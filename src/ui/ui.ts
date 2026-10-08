import Phaser from 'phaser';
import { sfx } from '../systems/audio';

export const W = 240;
export const H = 160;

export const FONT = 'Galmuri11';
export const FONT_S = 'Galmuri9';
export const FONT_XS = 'Galmuri7';

export const C = {
  text: '#303040',
  shadow: '#c8c8d8',
  white: '#f8f8f8',
  border: 0x384868,
  border2: 0xa8b8d8,
  fill: 0xf8f8f8,
  dark: 0x283048,
};

// ── 텍스트 ────────────────────────────────────────────
export function txt(
  scene: Phaser.Scene, x: number, y: number, s: string,
  opt: { size?: 'm' | 's' | 'xs'; color?: string; shadow?: string | null; align?: 'left' | 'center' | 'right'; wrap?: number } = {},
): Phaser.GameObjects.Text {
  const size = opt.size ?? 'm';
  const family = size === 'm' ? FONT : size === 's' ? FONT_S : FONT_XS;
  const px = size === 'm' ? 12 : size === 's' ? 10 : 8;
  const t = scene.add.text(x, y, s, {
    fontFamily: family,
    fontSize: `${px}px`,
    color: opt.color ?? C.text,
    align: opt.align ?? 'left',
    lineSpacing: size === 'm' ? 4 : 2,
    wordWrap: opt.wrap ? { width: opt.wrap, useAdvancedWrap: true } : undefined,
  });
  const shadow = opt.shadow === undefined ? C.shadow : opt.shadow;
  if (shadow) t.setShadow(1, 1, shadow, 0, false, true);
  if (opt.align === 'center') t.setOrigin(0.5, 0);
  if (opt.align === 'right') t.setOrigin(1, 0);
  return t;
}

// ── GBA 스타일 창 ──────────────────────────────────────
export function drawWindow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill = C.fill) {
  g.fillStyle(C.border, 1);
  g.fillRect(x + 1, y, w - 2, h);
  g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle(C.border2, 1);
  g.fillRect(x + 2, y + 1, w - 4, h - 2);
  g.fillRect(x + 1, y + 2, w - 2, h - 4);
  g.fillStyle(fill, 1);
  g.fillRect(x + 3, y + 3, w - 6, h - 6);
}

export function windowBox(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = C.fill) {
  const g = scene.add.graphics();
  drawWindow(g, x, y, w, h, fill);
  return g;
}

// ── 입력 ─────────────────────────────────────────────
export type Btn = 'A' | 'B' | 'START' | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const KEYMAP: Record<string, Btn> = {
  KeyZ: 'A', Space: 'A', KeyX: 'B', Escape: 'B', Backspace: 'B', Enter: 'START',
  ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
  KeyW: 'UP', KeyS: 'DOWN', KeyA: 'LEFT', KeyD: 'RIGHT',
};

/** 버튼 입력을 Promise 로 기다릴 수 있게 해 주는 도우미 */
export class Pad {
  private waiter: ((b: Btn) => void) | null = null;
  private listeners = new Set<(b: Btn) => void>();

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    kb.addCapture('UP,DOWN,LEFT,RIGHT,SPACE,ENTER,BACKSPACE');
    kb.on('keydown', (e: KeyboardEvent) => {
      const b = KEYMAP[e.code];
      if (!b) return;
      for (const l of this.listeners) l(b);
      if (this.waiter) {
        const w = this.waiter;
        this.waiter = null;
        w(b);
      }
    });
  }

  next(): Promise<Btn> {
    return new Promise(r => (this.waiter = r));
  }

  async waitFor(...bs: Btn[]): Promise<Btn> {
    for (;;) {
      const b = await this.next();
      if (bs.includes(b)) return b;
    }
  }

  listen(f: (b: Btn) => void): () => void {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }
}

export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise(r => scene.time.delayedCall(ms, r));
}

export function tween(scene: Phaser.Scene, cfg: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
  return new Promise(r => scene.tweens.add({ ...cfg, onComplete: () => r() }));
}

// ── 대화창 ────────────────────────────────────────────
export class TextBox {
  private g: Phaser.GameObjects.Graphics;
  private t: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene, private pad: Pad, private y = H - 48, private h = 48) {
    this.g = scene.add.graphics();
    drawWindow(this.g, 0, y, W, h);
    this.t = txt(scene, 10, y + 8, '', { wrap: W - 22 });
    this.arrow = txt(scene, W - 14, y + h - 16, '▼', { size: 's', color: '#d04838' });
    this.container = scene.add.container(0, 0, [this.g, this.t, this.arrow]).setDepth(1000).setScrollFactor(0, 0, true);
    this.hide();
  }

  show() { this.container.setVisible(true); }
  hide() { this.container.setVisible(false); }

  /** 여러 문장을 순서대로 보여 주고, 각 페이지마다 A/B 를 기다린다. keep=true 이면 마지막 문장 후 기다리지 않음 */
  async say(lines: string | string[], opt: { keep?: boolean } = {}) {
    const arr = Array.isArray(lines) ? lines : [lines];
    this.show();
    for (let i = 0; i < arr.length; i++) {
      const pages = this.paginate(arr[i]);
      for (let p = 0; p < pages.length; p++) {
        const last = i === arr.length - 1 && p === pages.length - 1;
        await this.type(pages[p]);
        if (last && opt.keep) return;
        this.arrow.setVisible(true);
        await this.pad.waitFor('A', 'B');
        sfx('select');
        this.arrow.setVisible(false);
      }
    }
    this.hide();
  }

  /** 문장을 바로 띄워 둔다 (선택지와 함께 쓸 때) */
  set(s: string) {
    this.show();
    this.arrow.setVisible(false);
    this.t.setText(s);
  }

  private paginate(s: string): string[] {
    const lines = this.t.getWrappedText(s);
    const pages: string[] = [];
    for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2).join('\n'));
    return pages.length ? pages : [''];
  }

  private async type(s: string) {
    this.arrow.setVisible(false);
    let skip = false;
    const off = this.pad.listen(b => { if (b === 'A' || b === 'B') skip = true; });
    for (let i = 1; i <= s.length; i++) {
      if (skip) break;
      this.t.setText(s.slice(0, i));
      await wait(this.scene, 22);
    }
    off();
    this.t.setText(s);
    // 빨리 넘기기 키 입력이 다음 페이지 넘김으로 이어지지 않도록 살짝 쉼
    await wait(this.scene, 60);
  }

  destroy() { this.container.destroy(); }
}

// ── 선택 메뉴 ─────────────────────────────────────────
export interface ChooseOpt {
  x: number; y: number; w: number;
  items: string[];
  cancel?: boolean;      // B 로 취소 가능 (-1 반환)
  start?: number;
  cols?: number;
  rowH?: number;
  onMove?: (i: number) => void;
  disabled?: boolean[];
}

export async function choose(scene: Phaser.Scene, pad: Pad, o: ChooseOpt): Promise<number> {
  const cols = o.cols ?? 1;
  const rowH = o.rowH ?? 16;
  const rows = Math.ceil(o.items.length / cols);
  const h = rows * rowH + 10;
  const colW = (o.w - 16) / cols;
  const g = scene.add.graphics();
  drawWindow(g, o.x, o.y, o.w, h);
  const texts = o.items.map((s, i) => txt(scene, o.x + 16 + (i % cols) * colW, o.y + 6 + Math.floor(i / cols) * rowH, s,
    { color: o.disabled?.[i] ? '#a0a0b0' : C.text }));
  const cursor = txt(scene, 0, 0, '▶', { size: 's', color: C.text });
  const objs = scene.add.container(0, 0, [g, ...texts, cursor]).setDepth(1100).setScrollFactor(0, 0, true);
  let i = o.start ?? 0;
  const place = () => {
    cursor.setPosition(o.x + 6 + (i % cols) * colW, o.y + 8 + Math.floor(i / cols) * rowH);
    o.onMove?.(i);
  };
  place();
  for (;;) {
    const b = await pad.next();
    const n = o.items.length;
    if (b === 'UP' && i - cols >= 0) { i -= cols; sfx('move'); place(); }
    else if (b === 'DOWN' && i + cols < n) { i += cols; sfx('move'); place(); }
    else if (b === 'LEFT' && cols > 1 && i % cols > 0) { i -= 1; sfx('move'); place(); }
    else if (b === 'RIGHT' && cols > 1 && i % cols < cols - 1 && i + 1 < n) { i += 1; sfx('move'); place(); }
    else if (b === 'A' && o.disabled?.[i]) { sfx('bump'); }
    else if (b === 'A') { sfx('select'); objs.destroy(); return i; }
    else if (b === 'B' && o.cancel) { sfx('back'); objs.destroy(); return -1; }
  }
}

export async function yesNo(scene: Phaser.Scene, pad: Pad): Promise<boolean> {
  const r = await choose(scene, pad, { x: W - 64, y: H - 48 - 46, w: 60, items: ['예', '아니요'], cancel: true });
  return r === 0;
}

// ── 다른 씬을 띄우고 결과 기다리기 ────────────────────────
export function runScene<T = unknown>(from: Phaser.Scene, key: string, data?: object): Promise<T> {
  return new Promise(res => {
    const target = from.scene.get(key);
    target.events.once('done', (result: T) => {
      from.scene.stop(key);
      from.scene.resume();
      res(result);
    });
    from.scene.launch(key, data);
    from.scene.bringToTop(key);
    from.scene.pause();
  });
}

// ── 한국어 조사 ───────────────────────────────────────
/** josa('나트륨', '이/가') → '나트륨이' */
export function josa(word: string, pair: '이/가' | '을/를' | '은/는' | '와/과' | '으로/로' | '아/야'): string {
  const ch = word.charCodeAt(word.length - 1);
  let batchim = false;
  let rieul = false;
  if (ch >= 0xac00 && ch <= 0xd7a3) {
    const jong = (ch - 0xac00) % 28;
    batchim = jong !== 0;
    rieul = jong === 8;
  } else if (/\d$/.test(word)) {
    // 숫자 읽기: 영·일·삼·육·칠·팔·(십) 은 받침이 있고, 일·칠·팔은 ㄹ 받침
    const d = word[word.length - 1];
    batchim = '013678'.includes(d);
    rieul = '178'.includes(d);
  } else {
    // 영문으로 끝나면 대충 받침 판정 (L, M, N, R 등)
    batchim = /[lmnr]$/i.test(word);
    rieul = /l$/i.test(word);
  }
  const [a, b] = pair.split('/');
  if (pair === '으로/로') return word + (batchim && !rieul ? a : b);
  return word + (batchim ? a : b);
}

/** 안내 문구용 버튼 이름 (모바일은 화면 버튼, 컴퓨터는 키보드) */
export function keyLabel(k: 'A' | 'MENU'): string {
  const touch = document.body.classList.contains('touch');
  if (k === 'A') return touch ? 'A 버튼' : 'Z 키';
  return touch ? '메뉴 버튼' : 'Enter 키';
}
