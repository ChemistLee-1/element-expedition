import Phaser from 'phaser';
import { W, H, txt, Pad, TextBox, wait, tween, drawWindow } from '../ui/ui';
import { ELEMENTS, el, villageOf, villageMembers, VILLAGE_ORDER, type ElementData, type VillageKey } from '../data/elements';
import { TYPES } from '../data/types';
import { AREAS } from '../data/areas';
import { G } from '../systems/state';
import { playBgm, sfx, chime } from '../systems/audio';

// 엔딩: 36종을 모두 모은 뒤 주기 박사에게 말을 걸면 시작된다.
//  1 박사의 축하 → 2 원소 입장(원자 번호 순) → 3 축하 파티(불꽃 반응 불꽃놀이) → 4 화합물 합체 인사
//  → 5 원정 기록 → 6 수료증 → 7 크레딧 → 8 다음 원정 예고
// B 버튼으로 연출 단계를 건너뛸 수 있다.

const CREATOR = 'chemistLee';

const CW = 13;
const OX = (W - 18 * CW) / 2;
const OY = 46;

const GROUP_LABEL: Record<VillageKey, string> = {
  g1: '1족 · 알칼리 금속', g2: '2족 · 알칼리 토금속', g3_12: '3~12족 · 전이 금속',
  g13: '13족 · 붕소족', g14: '14족 · 탄소족', g15: '15족 · 질소족',
  g16: '16족 · 산소족', g17: '17족 · 할로젠', g18: '18족 · 비활성 기체',
};

// 불꽃 반응 색 (실제 색)
const FLAMES: [string, string][] = [
  ['#f04838', '리튬 · 빨강'], ['#ffd23a', '나트륨 · 노랑'], ['#b88aff', '칼륨 · 보라'],
  ['#3ac8b0', '구리 · 청록'], ['#6ee08a', '붕소 · 초록'], ['#ff7a3a', '칼슘 · 주황빛 빨강'],
];

const COMPOUNDS: { zs: number[]; formula: string; line: string }[] = [
  { zs: [1, 1, 8], formula: 'H₂O', line: '우리는 물이야! 생명의 바탕!' },
  { zs: [11, 17], formula: 'NaCl', line: '짭짤한 소금이 되었어!' },
  { zs: [6, 8, 8], formula: 'CO₂', line: '식물이 좋아하는 이산화 탄소!' },
  { zs: [26, 6], formula: '강철 (Fe + C)', line: '철에 탄소를 조금 섞으면 튼튼한 강철!' },
];

const cellPos = (e: ElementData) => ({ x: OX + (e.group - 1) * CW, y: OY + (e.period - 1) * CW });

export class EndingScene extends Phaser.Scene {
  private pad!: Pad;
  private box!: TextBox;
  private skip = false;
  private skippable = false;
  private stage!: Phaser.GameObjects.Container;
  private table!: Phaser.GameObjects.Container;
  private cells = new Map<number, Phaser.GameObjects.Container>();
  private tableLabel?: Phaser.GameObjects.Text;

  constructor() { super('Ending'); }

  create() {
    this.pad = new Pad(this);
    this.skip = false;
    this.skippable = false;
    this.cells = new Map();
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x14163a, 0x14163a, 0x3a1f5a, 0x3a1f5a, 1).fillRect(0, 0, W, H);
    this.table = this.add.container(0, 0);
    this.stage = this.add.container(0, 0).setDepth(10);
    this.box = new TextBox(this, this.pad);
    playBgm('ending');
    this.pad.listen(b => { if (b === 'B' && this.skippable) this.skip = true; });
    void this.run().then(() => this.events.emit('done'));
  }

  /** 기다리기 (B 로 건너뛰면 바로 끝남) */
  private async pause(ms: number) {
    const end = this.time.now + ms;
    while (!this.skip && this.time.now < end) await wait(this, 40);
  }

  private begin() { this.skip = false; this.skippable = true; }
  private clearStage() {
    this.skippable = false;
    this.skip = false;
    this.tweens.killAll();
    this.stage.removeAll(true);
  }

  private async run() {
    await this.stepProfessor();
    await this.stepTable();
    await this.stepParty();
    await this.stepCompounds();
    await this.stepRecord();
    await this.stepCertificate();
    await this.stepCredits();
    await this.stepTeaser();
  }

  // ── 1. 박사의 축하 인사 ─────────────────────────────
  private async stepProfessor() {
    const prof = this.add.image(W / 2, 64, 'npc_prof', 0).setScale(4);
    this.stage.add(prof);
    this.cameras.main.fadeIn(500);
    await this.box.say([
      '주기 박사: 드디어… 1주기 수소부터 4주기 크립톤까지!',
      '원정대원이 모은 36종의 원소가 한자리에 모였단다.',
      '자, 모두 주기율표의 자기 자리로 들어가 볼까?',
    ]);
    await tween(this, { targets: prof, alpha: 0, duration: 400 });
    this.clearStage();
  }

  // ── 2. 원소 입장 (원자 번호 순서대로) ──────────────────
  private async stepTable() {
    this.begin();
    const title = txt(this, W / 2, 8, '원소 주기율표', { color: '#fff4c0', shadow: '#b04020', align: 'center' }).setScale(1.5);
    this.table.add(title);
    // 빈 칸
    const g = this.add.graphics();
    for (const e of ELEMENTS) {
      const { x, y } = cellPos(e);
      g.fillStyle(0x2a2d55, 1).fillRect(x, y, CW - 1, CW - 1);
      g.lineStyle(1, 0x4a4e88, 1).strokeRect(x + 0.5, y + 0.5, CW - 2, CW - 2);
    }
    this.table.add(g);
    for (const e of ELEMENTS) {
      const { x, y } = cellPos(e);
      const c = this.add.container(x + 6, y + 6).setVisible(false);
      const col = Phaser.Display.Color.HexStringToColor(TYPES[e.type].color).color;
      c.add([
        this.add.rectangle(0, 0, CW - 1, CW - 1, col),
        txt(this, 0, -4, e.sym, { size: 'xs', color: '#202030', shadow: null, align: 'center' }),
      ]);
      this.cells.set(e.z, c);
      this.table.add(c);
    }
    const label = txt(this, W / 2, 104, '', { color: '#ffffff', shadow: '#202040', align: 'center' });
    this.tableLabel = label;
    this.table.add(label);
    const bannerG = this.add.graphics().setVisible(false);
    drawWindow(bannerG, 30, 124, W - 60, 24);
    const bannerT = txt(this, W / 2, 129, '', { align: 'center' }).setVisible(false);
    const hl = this.add.graphics();
    this.table.add([bannerG, bannerT, hl]);

    const landed = new Set<number>();
    let queue = Promise.resolve();
    const showGroup = async (v: VillageKey) => {
      const cs = villageMembers(v).map(z => cellPos(el(z)));
      const x0 = Math.min(...cs.map(c => c.x)) - 2, y0 = Math.min(...cs.map(c => c.y)) - 2;
      const x1 = Math.max(...cs.map(c => c.x)) + CW + 1, y1 = Math.max(...cs.map(c => c.y)) + CW + 1;
      bannerT.setText(`${GROUP_LABEL[v]} 완성!`);
      bannerG.setVisible(true); bannerT.setVisible(true);
      for (let k = 0; k < 3 && !this.skip; k++) {
        hl.clear().lineStyle(2, 0xfff070, 1).strokeRect(x0, y0, x1 - x0, y1 - y0);
        await this.pause(160);
        hl.clear();
        await this.pause(120);
      }
      await this.pause(350);
      bannerG.setVisible(false); bannerT.setVisible(false);
    };

    const land = (e: ElementData, i: number, animate: boolean) => {
      const c = this.cells.get(e.z)!;
      c.setVisible(true);
      if (animate) { c.setScale(1.7); this.tweens.add({ targets: c, scale: 1, duration: 160 }); chime(i); }
      landed.add(e.z);
      const v = villageOf(e);
      if (villageMembers(v).every(z => landed.has(z))) queue = queue.then(() => showGroup(v));
    };

    for (let i = 0; i < ELEMENTS.length; i++) {
      const e = ELEMENTS[i];
      if (this.skip) { land(e, i, false); continue; }
      label.setText(`${e.z}번  ${e.sym}  ${e.name}`);
      const { x, y } = cellPos(e);
      const s = this.add.image(W / 2, H + 24, `mon_${e.z}`).setScale(0.45).setDepth(5);
      this.tweens.add({
        targets: s, x: x + 6, y: y + 6, scale: 0.16, duration: 420, ease: 'Quad.out',
        onComplete: () => { s.destroy(); land(e, i, true); },
      });
      await this.pause(170);
    }
    await this.pause(500);
    if (this.skip) for (const e of ELEMENTS) this.cells.get(e.z)!.setVisible(true).setScale(1);
    await queue;
    this.skip = false;
    hl.clear();
    label.setText('1~4주기 주기율표 완성!');
    sfx('fanfare');
    await this.pause(1500);
    this.skippable = false;
  }

  // ── 3. 축하 파티: 파도타기 점프 + 불꽃 반응 불꽃놀이 ──────
  private async stepParty() {
    this.begin();
    this.tableLabel?.setVisible(false);
    const big = txt(this, W / 2, 112, '★ 도감 완성 축하 파티! ★', { color: '#fff070', shadow: '#b04020', align: 'center' });
    this.stage.add(big);
    this.tweens.add({ targets: big, scale: 1.1, duration: 300, yoyo: true, repeat: -1 });
    for (const e of ELEMENTS) {
      const c = this.cells.get(e.z)!;
      this.tweens.add({ targets: c, y: c.y - 5, duration: 170, yoyo: true, delay: (e.group - 1) * 45, repeat: 6, repeatDelay: 500, ease: 'Quad.out' });
    }
    const note = txt(this, W / 2, 132, '불꽃놀이 색은 진짜 불꽃 반응 색이야!', { size: 's', color: '#c8d0ff', shadow: '#202040', align: 'center' });
    this.stage.add(note);
    for (let k = 0; k < 12 && !this.skip; k++) {
      const [color, name] = FLAMES[k % FLAMES.length];
      void this.firework(Phaser.Math.Between(24, W - 24), Phaser.Math.Between(10, 34), color, name);
      await this.pause(480);
    }
    await this.pause(1200);
    this.clearStage();
    // 칸 위치 원래대로
    for (const e of ELEMENTS) { const { y } = cellPos(e); this.cells.get(e.z)!.setY(y + 6); }
  }

  private async firework(x: number, y: number, color: string, name: string) {
    const col = Phaser.Display.Color.HexStringToColor(color).color;
    const rocket = this.add.rectangle(x, 100, 2, 4, 0xffffff);
    this.stage.add(rocket);
    await tween(this, { targets: rocket, y, duration: 260, ease: 'Quad.out' });
    rocket.destroy();
    sfx('pop');
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const d = 14 + (i % 3) * 4;
      const p = this.add.rectangle(x, y, 2, 2, col);
      this.stage.add(p);
      this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + 4, alpha: 0, duration: 750, ease: 'Quad.out', onComplete: () => p.destroy() });
    }
    const t = txt(this, x, y + 14, name, { size: 'xs', color, shadow: '#101020', align: 'center' });
    this.stage.add(t);
    this.tweens.add({ targets: t, alpha: 0, delay: 600, duration: 400, onComplete: () => t.destroy() });
  }

  // ── 4. 화합물 합체 인사 ─────────────────────────────
  private async stepCompounds() {
    this.table.setVisible(false);
    await this.box.say('주기 박사: 원소들이 짝을 지어 합체 인사를 한단다!');
    this.begin();
    const head = txt(this, W / 2, 8, '원소들의 합체 인사', { color: '#fff4c0', shadow: '#b04020', align: 'center' });
    this.stage.add(head);
    for (const c of COMPOUNDS) {
      if (this.skip) break;
      const n = c.zs.length;
      const xs = n === 2 ? [72, 168] : [52, 120, 188];
      const sprites = c.zs.map((z, i) => {
        const s = this.add.image(i < n / 2 ? -40 : W + 40, 104, `mon_${z}`).setOrigin(0.5, 1).setScale(0.75);
        this.stage.add(s);
        this.tweens.add({ targets: s, x: xs[i], duration: 450, ease: 'Back.out' });
        return s;
      });
      const plus = xs.slice(0, -1).map((x, i) => {
        const p = txt(this, (x + xs[i + 1]) / 2, 64, '+', { color: '#ffffff', align: 'center' }).setAlpha(0);
        this.stage.add(p);
        this.tweens.add({ targets: p, alpha: 1, delay: 450, duration: 200 });
        return p;
      });
      await this.pause(1100);
      plus.forEach(p => p.destroy());
      await Promise.all(sprites.map(s => tween(this, { targets: s, x: W / 2, scale: 0.5, duration: 350, ease: 'Quad.in' })));
      sprites.forEach(s => s.setVisible(false));
      const flash = this.add.circle(W / 2, 74, 6, 0xffffff);
      this.stage.add(flash);
      sfx('catch');
      this.tweens.add({ targets: flash, radius: 60, alpha: 0, duration: 450 });
      const f = txt(this, W / 2, 46, c.formula, { color: '#fff070', shadow: '#b04020', align: 'center' }).setScale(c.formula.length > 5 ? 1.5 : 2.5);
      const l = txt(this, W / 2, 100, c.line, { color: '#ffffff', shadow: '#202040', align: 'center' });
      this.stage.add([f, l]);
      await this.pause(2000);
      [f, l, flash, ...sprites].forEach(o => o.destroy());
    }
    this.clearStage();
    await this.box.say('주기 박사: 원소는 혼자일 때보다 함께일 때 세상을 만든단다.');
  }

  // ── 5. 나의 원정 기록 ────────────────────────────────
  private rank() {
    const total = G.correct + G.wrong;
    const rate = total ? Math.round((G.correct / total) * 100) : 100;
    const title = rate >= 90 ? '주기율표 마스터' : rate >= 70 ? '원소 박사' : '원소 탐험가';
    return { total, rate, title };
  }

  private async stepRecord() {
    const { total, rate, title } = this.rank();
    let hardest = 0, most = 0;
    for (const [z, n] of Object.entries(G.asked)) if (n > most) { most = n; hardest = Number(z); }
    const g = this.add.graphics();
    drawWindow(g, 8, 6, W - 16, H - 12);
    this.stage.add(g);
    const rows: [string, string][] = [
      ['채집한 원소', `${G.caught.length} / 36종`],
      ['푼 문제', `${total}개 (정답 ${G.correct}개)`],
      ['정답률', `${rate}%`],
      ['사용한 힌트 전구', `${G.hintsUsed ?? 0}개`],
      ['걸은 걸음', `${G.steps}걸음`],
      ['가장 여러 번 도전한 원소', hardest ? `${el(hardest).name} (${most}번)` : '-'],
    ];
    this.stage.add(txt(this, W / 2, 12, '★ 나의 원정 기록 ★', { color: '#d04838', align: 'center' }));
    rows.forEach(([k, v], i) => {
      this.stage.add(txt(this, 20, 32 + i * 14, k, { size: 's', color: '#5a6a90', shadow: null }));
      this.stage.add(txt(this, W - 20, 32 + i * 14, v, { size: 's', align: 'right' }));
    });
    this.stage.add(txt(this, W / 2, 120, '칭호', { size: 's', color: '#5a6a90', shadow: null, align: 'center' }));
    const t = txt(this, W / 2, 132, title, { color: '#c08010', shadow: '#f8e8b0', align: 'center' }).setScale(1.3);
    this.stage.add(t);
    sfx('levelup');
    const hint = txt(this, W - 16, H - 18, '▼', { size: 's', color: '#d04838', shadow: null, align: 'right' });
    this.stage.add(hint);
    this.tweens.add({ targets: hint, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });
    await this.pad.waitFor('A', 'B');
    sfx('select');
    this.clearStage();
  }

  // ── 6. 수료증 ────────────────────────────────────────
  private askName(def: string): Promise<string> {
    return new Promise(res => {
      const kb = this.game.input.keyboard!;
      kb.enabled = false; // 이름을 치는 동안 게임 조작이 눌리지 않게
      const r = this.game.canvas.getBoundingClientRect();
      const wrap = document.createElement('div');
      wrap.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height * 0.55}px;transform:translate(-50%,-50%);
        z-index:1000;display:flex;gap:6px;align-items:center;`;
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 10;
      input.value = def;
      input.placeholder = '이름';
      input.style.cssText = `font:16px Galmuri11,sans-serif;padding:8px 10px;width:${Math.min(180, r.width * 0.5)}px;border:3px solid #384868;
        border-radius:6px;background:#f8f8f8;color:#303040;-webkit-user-select:text;user-select:text;outline:none;`;
      const btn = document.createElement('button');
      btn.textContent = '확인';
      btn.style.cssText = 'font:16px Galmuri11,sans-serif;padding:9px 14px;border:none;border-radius:6px;background:#8a3a78;color:#fff;';
      wrap.append(input, btn);
      document.body.appendChild(wrap);
      const done = () => {
        const v = input.value.trim().slice(0, 10) || '원소 탐험가';
        wrap.remove();
        kb.enabled = true;
        sfx('select');
        res(v);
      };
      input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); done(); } });
      btn.addEventListener('click', done);
      setTimeout(() => input.focus(), 60);
    });
  }

  private async stepCertificate() {
    await this.box.say(['주기 박사: 마지막으로, 원정을 끝까지 해낸 대원에게 수료증을 주마!', '수료증에 적을 이름을 알려 주렴.']);
    this.box.set('이름을 입력하고 [확인]을 눌러 주세요.');
    const name = await this.askName(G.playerName ?? '');
    G.playerName = name;
    this.box.hide();

    const { rate, title } = this.rank();
    const d = new Date();
    const g = this.add.graphics();
    g.fillStyle(0xfbf3dc, 1).fillRect(0, 0, W, H);
    g.lineStyle(3, 0xc8a040, 1).strokeRect(4, 4, W - 8, H - 8);
    g.lineStyle(1, 0xc8a040, 1).strokeRect(9, 9, W - 18, H - 18);
    for (const [cx, cy] of [[9, 9], [W - 9, 9], [9, H - 9], [W - 9, H - 9]]) g.fillStyle(0xc8a040, 1).fillRect(cx - 3, cy - 3, 6, 6);
    this.stage.add(g);
    const dark = '#4a3a20';
    const add = (o: Phaser.GameObjects.GameObject) => this.stage.add(o);
    add(txt(this, W / 2, 12, '수  료  증', { color: dark, shadow: '#e8d8a8', align: 'center' }).setScale(1.6).setFontStyle('bold'));
    add(txt(this, W / 2, 33, '원소 원정대 · The Element Expedition', { size: 'xs', color: '#8a7a50', shadow: null, align: 'center' }));
    add(txt(this, W / 2, 43, `이름: ${name}`, { color: dark, shadow: null, align: 'center' }));
    add(txt(this, 20, 58, '위 원정대원은 1~4주기 원소 36종의 정체를 모두 밝혀 원소 주기율표를 완성하였으므로 이 증서를 수여합니다.',
      { size: 's', color: dark, shadow: null, wrap: W - 40 }));
    add(txt(this, W / 2, 99, `칭호: ${title} · 정답률 ${rate}%`, { size: 's', color: '#a06010', shadow: null, align: 'center' }));
    add(txt(this, W / 2, 112, `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`, { size: 's', color: dark, shadow: null, align: 'center' }));
    add(txt(this, W / 2 - 10, 125, '원소 원정대 대장  주기 박사', { size: 's', color: dark, shadow: null, align: 'center' }));
    // 도장
    const stamp = this.add.container(W - 36, 126);
    const sg = this.add.graphics();
    sg.lineStyle(2, 0xd03028, 1).strokeCircle(0, 0, 11);
    stamp.add([sg, txt(this, 0, -6, '주기', { size: 's', color: '#d03028', shadow: null, align: 'center' })]);
    stamp.setAngle(-12).setScale(2).setAlpha(0);
    add(stamp);
    await tween(this, { targets: stamp, scale: 1, alpha: 1, duration: 260, ease: 'Back.out' });
    sfx('shake');
    add(txt(this, W / 2, 140, '화면을 캡처해서 선생님께 보여 주세요 · A: 다음', { size: 'xs', color: '#8a7a50', shadow: null, align: 'center' }));
    sfx('fanfare');
    await this.pad.waitFor('A', 'B');
    sfx('select');
    this.clearStage();
  }

  // ── 7. 엔딩 크레딧 ──────────────────────────────────
  private async stepCredits() {
    this.begin();
    playBgm('credits');
    const black = this.add.rectangle(0, 0, W, H, 0x0c0c18).setOrigin(0);
    this.stage.add(black);
    const name = G.playerName ?? '원소 탐험가';
    const lines: [string, 'h' | 'b' | 't'][] = [
      ['원소 원정대', 't'], ['The Element Expedition', 'b'], ['', 'b'],
      ['— 만든 사람 —', 'h'], [CREATOR, 't'], ['', 'b'],
      ['— 등장 원소 —', 'h'], ['1번 수소 ~ 36번 크립톤', 'b'], ['모두 36종', 'b'], ['', 'b'],
      ['— 원정 마을 —', 'h'], ['1족부터 18족까지 9개 마을', 'b'], ['', 'b'],
      ['— 등장인물 —', 'h'], ['주기 박사', 'b'], ['광부 · 농부 · 화산학자', 'b'], ['조개 줍는 아이 · 공장장', 'b'],
      ['식물학자 · 염전 일꾼', 'b'], ['네온사인 장인 · 문지기들', 'b'], ['', 'b'],
      ['— 폰트 —', 'h'], ['Galmuri (Lee Minseo · SIL OFL)', 'b'], ['', 'b'],
      ['— 그리고 원정대원 —', 'h'], [name, 't'], ['', 'b'], ['', 'b'],
      ['플레이해 줘서 고마워!', 't'],
    ];
    const roll = this.add.container(0, H);
    lines.forEach(([s, k], i) => {
      const t = txt(this, W / 2, i * 16, s, {
        size: k === 'b' ? 's' : 'm', color: k === 'h' ? '#ffd890' : '#ffffff', shadow: '#000000', align: 'center',
      });
      if (k === 't') t.setScale(1.2);
      roll.add(t);
    });
    this.stage.add(roll);
    const height = lines.length * 16;
    const speed = 22; // px/초
    this.tweens.add({ targets: roll, y: H / 2 - height + 8, duration: ((H / 2 + height) / speed) * 1000 });

    // 마을 사람들 행진 (1족 → 18족 순서) + 마지막에 플레이어
    const ids = ['prof', ...VILLAGE_ORDER.flatMap(v => AREAS[v].npcs.filter(n => !n.gate && n.id !== 'prof').map(n => `npc_${n.id}`))]
      .map(id => (id.startsWith('npc_') ? id : `npc_${id}`));
    ids.push('player');
    const walkers: Phaser.GameObjects.Sprite[] = [];
    // 글자가 행진하는 사람들 뒤로 지나가지 않도록 아래 띠를 덮는다
    const band = this.add.rectangle(0, H - 38, W, 38, 0x0c0c18).setOrigin(0);
    const ground = this.add.rectangle(0, H - 10, W, 10, 0x1c1c34).setOrigin(0);
    this.stage.add([band, ground]);
    let frame = 0;
    const anim = this.time.addEvent({ delay: 160, loop: true, callback: () => {
      frame = (frame + 1) % 3;
      walkers.forEach(w => w.setFrame(6 + frame));
    } });
    for (let i = 0; i < ids.length && !this.skip; i++) {
      const w = this.add.sprite(-16, H - 26, ids[i], 6).setOrigin(0).setFlipX(true);
      walkers.push(w);
      this.stage.add(w);
      this.tweens.add({ targets: w, x: W + 16, duration: 9000 });
      await this.pause(700);
    }
    await this.pause(Math.max(0, ((H / 2 + height) / speed) * 1000 - ids.length * 700) + 1500);
    anim.remove();
    this.cameras.main.fadeOut(500);
    await wait(this, 550);
    this.clearStage();
    this.cameras.main.fadeIn(10);
  }

  // ── 8. 다음 원정 예고 ────────────────────────────────
  private async stepTeaser() {
    this.begin();
    playBgm('teaser');
    this.stage.add(this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0));
    const t1 = txt(this, W / 2, 6, '하지만…', { color: '#ffffff', shadow: null, align: 'center' }).setAlpha(0);
    const t2 = txt(this, W / 2, 20, '주기율표에는 아직 82종의 원소가 남아 있다.', { size: 's', color: '#c8d0ff', shadow: null, align: 'center' }).setAlpha(0);
    this.stage.add([t1, t2]);
    await tween(this, { targets: t1, alpha: 1, duration: 600 });
    await this.pause(500);
    await tween(this, { targets: t2, alpha: 1, duration: 600 });

    // 1~7주기 전체 주기율표 (1~4주기는 완성, 5주기부터는 물음표)
    const C = 12, ox = (W - 18 * C) / 2, oy = 36;
    const g = this.add.graphics();
    this.stage.add(g);
    for (const e of ELEMENTS) {
      g.fillStyle(Phaser.Display.Color.HexStringToColor(TYPES[e.type].color).color, 1)
        .fillRect(ox + (e.group - 1) * C, oy + (e.period - 1) * C, C - 1, C - 1);
    }
    const unknown: { x: number; y: number; z: number }[] = [];
    let z = 37;
    for (let p = 5; p <= 7; p++) for (let gr = 1; gr <= 18; gr++) {
      unknown.push({ x: ox + (gr - 1) * C, y: oy + (p - 1) * C, z });
      z += gr === 3 && p >= 6 ? 15 : 1; // 6·7주기 3족 자리에 란타넘족·악티늄족 15개가 들어간다
    }
    for (let r = 0; r < 2; r++) for (let k = 0; k < 15; k++) unknown.push({ x: ox + (2 + k) * C, y: oy + 7 * C + 6 + r * C, z: (r ? 89 : 57) + k });
    const SPECIAL: Record<number, string> = { 47: '은 Ag', 79: '금 Au', 92: '우라늄 U' };
    const marks: { x: number; y: number; label: string }[] = [];
    for (let i = 0; i < unknown.length; i++) {
      const u = unknown[i];
      const cell = this.add.container(u.x + 5.5, u.y + 5.5);
      cell.add([this.add.rectangle(0, 0, C - 1, C - 1, 0x3a3e64), txt(this, 0, -4, '?', { size: 'xs', color: '#9098c8', shadow: null, align: 'center' })]);
      cell.setScale(0);
      this.stage.add(cell);
      this.tweens.add({ targets: cell, scale: 1, duration: 120, delay: this.skip ? 0 : i * 22 });
      if (SPECIAL[u.z]) marks.push({ x: u.x, y: u.y, label: SPECIAL[u.z] });
    }
    await this.pause(unknown.length * 22 + 500);
    const caption = txt(this, W / 2, 151, '', { size: 'xs', color: '#fff070', shadow: '#000000', align: 'center' });
    this.stage.add(caption);
    const names: string[] = [];
    for (const m of marks) {
      if (this.skip) break;
      const r = this.add.rectangle(m.x + 5.5, m.y + 5.5, C + 1, C + 1).setStrokeStyle(1, 0xfff070);
      this.stage.add(r);
      this.tweens.add({ targets: r, alpha: 0.3, duration: 300, yoyo: true, repeat: -1 });
      names.push(m.label);
      caption.setText(`다음 원정에서 만날 원소: ${names.join(' · ')} …`);
      sfx('move');
      await this.pause(800);
    }
    this.skip = false;
    await tween(this, { targets: [t1, t2], alpha: 0, duration: 500 });
    const end = txt(this, W / 2, 10, '원정은 계속된다…', { color: '#ffffff', shadow: '#5a3a8a', align: 'center' }).setAlpha(0).setScale(1.3);
    this.stage.add(end);
    await tween(this, { targets: end, alpha: 1, duration: 900 });
    await this.pause(2500);
    this.skippable = false;
    this.cameras.main.fadeOut(800);
    await wait(this, 850);
  }
}
