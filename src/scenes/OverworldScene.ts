import Phaser from 'phaser';
import { W, H, txt, Pad, TextBox, choose, runScene, wait, tween, windowBox, yesNo } from '../ui/ui';
import { AREAS, BLOCKING, ENCOUNTER_TILES, tileAt, type Area, type Npc, type Encounter } from '../data/areas';
import { ANIMATED } from '../art/tiles';
import { tileKey } from './BootScene';
import { G, save, type Dir } from '../systems/state';
import { playBgm, playJingle, sfx, toggleMusic, toggleSfx, isMusicOn, isSfxOn } from '../systems/audio';
import type { QuizData, QuizResult } from './QuizScene';

const T = 16;
const DIRS: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const FRAME_BASE: Record<Dir, number> = { down: 0, up: 3, left: 6, right: 6 };
const OPPOSITE: Record<Dir, Dir> = { down: 'up', up: 'down', left: 'right', right: 'left' };

interface NpcObj { def: Npc; x: number; y: number; dir: Dir; sprite: Phaser.GameObjects.Sprite }

export class OverworldScene extends Phaser.Scene {
  private area!: Area;
  private pad!: Pad;
  private box!: TextBox;
  private player!: Phaser.GameObjects.Sprite;
  private npcs: NpcObj[] = [];
  private animTiles: { img: Phaser.GameObjects.Image; ch: string }[] = [];
  private busy = false;
  private moving = false;
  private parity = false;
  private keys!: Record<Dir, Phaser.Input.Keyboard.Key[]>;

  constructor() { super('Overworld'); }

  create() {
    this.area = AREAS[G.map];
    this.pad = new Pad(this);
    this.npcs = [];
    this.animTiles = [];
    this.busy = false;
    this.moving = false;

    const a = this.area;
    a.map.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === 'B') this.add.image(x * T, y * T, tileKey(a.ground ?? '.', 0)).setOrigin(0);
      const img = this.add.image(x * T, y * T, tileKey(ch, 0)).setOrigin(0);
      if (ANIMATED.has(ch)) this.animTiles.push({ img, ch });
    }));
    let frame = 0;
    this.time.addEvent({ delay: 600, loop: true, callback: () => {
      frame ^= 1;
      for (const t of this.animTiles) t.img.setTexture(tileKey(t.ch, frame));
    } });

    for (const n of a.npcs) {
      const open = !!n.gate && this.villageDone();
      const x = open ? n.gate!.open.x : n.x;
      const y = open ? n.gate!.open.y : n.y;
      const sprite = this.add.sprite(x * T, y * T - 2, `npc_${n.id}`, 0).setOrigin(0);
      const o: NpcObj = { def: n, x, y, dir: n.dir, sprite };
      this.faceNpc(o, n.dir);
      this.npcs.push(o);
    }

    this.player = this.add.sprite(G.x * T, G.y * T - 2, 'player', 0).setOrigin(0).setDepth(10);
    this.setPlayerFrame(false);

    const mw = a.map[0].length * T, mh = a.map.length * T;
    const cam = this.cameras.main;
    cam.setBounds(0, Math.min(0, (mh - H) / 2), mw, Math.max(mh, H));
    cam.startFollow(this.player, true, 1, 1, -8, -8);
    cam.setRoundPixels(true);
    cam.fadeIn(250);

    this.box = new TextBox(this, this.pad);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      up: [kb.addKey(K.UP), kb.addKey(K.W)],
      down: [kb.addKey(K.DOWN), kb.addKey(K.S)],
      left: [kb.addKey(K.LEFT), kb.addKey(K.A)],
      right: [kb.addKey(K.RIGHT), kb.addKey(K.D)],
    };

    // 다른 화면에 가 있는 동안 키를 뗀 것을 놓치지 않도록 키 상태 초기화
    this.events.on('resume', () => this.input.keyboard!.resetKeys());

    this.pad.listen(b => {
      if (this.busy || this.moving) return;
      if (b === 'A') void this.run(() => this.interact());
      if (b === 'START') void this.run(() => this.menu());
      // 짧게 톡 누른 경우에도 한 칸 이동 (꾹 누르기는 update 에서 처리)
      const dir = ({ UP: 'up', DOWN: 'down', LEFT: 'left', RIGHT: 'right' } as const)[b as 'UP'];
      if (dir) void this.tryMove(dir);
    });

    playBgm(a.bgm);
    this.showBanner();
    this.lostTo.clear();
  }

  /** 이번에 이 지역에서 퀴즈 대결에 진 트레이너 (다시 걸어오지 않게) */
  private lostTo = new Set<string>();

  /** 이 마을(족) 원소를 몇 종 채집했는지 [채집, 전체] */
  private villageCount(): [number, number] {
    const zs = Object.values(this.area.encounters).flatMap(t => (t ?? []).map(e => e.z));
    return [zs.filter(z => G.caught.includes(z)).length, zs.length];
  }

  private villageDone() {
    const [have, total] = this.villageCount();
    return have >= total;
  }

  private showBanner() {
    const box = windowBox(this, 4, 4, 132, 34).setScrollFactor(0).setDepth(900);
    const t = txt(this, 70, 8, this.area.name, { align: 'center' }).setScrollFactor(0).setDepth(901);
    const temp = txt(this, 70, 24, `${this.area.group} · 기온 ${this.area.temp} K (${this.area.temp - 273} ℃)`, { size: 'xs', color: '#5a6a90', shadow: null, align: 'center' })
      .setScrollFactor(0).setDepth(901);
    this.time.delayedCall(1800, () => {
      this.tweens.add({ targets: [box, t, temp], alpha: 0, duration: 300, onComplete: () => { box.destroy(); t.destroy(); temp.destroy(); } });
    });
  }

  private async run(f: () => Promise<void>) {
    this.busy = true;
    try { await f(); } finally { this.busy = false; }
  }

  private setPlayerFrame(walking: boolean) {
    const base = FRAME_BASE[G.dir];
    this.player.setFrame(base + (walking ? (this.parity ? 1 : 2) : 0));
    this.player.setFlipX(G.dir === 'right');
  }

  private faceNpc(o: NpcObj, d: Dir) {
    o.dir = d;
    o.sprite.setFrame(FRAME_BASE[d]);
    o.sprite.setFlipX(d === 'right');
  }

  private npcAt(x: number, y: number) {
    return this.npcs.find(n => n.x === x && n.y === y);
  }

  private blocked(x: number, y: number) {
    return BLOCKING.has(tileAt(this.area, x, y)) || !!this.npcAt(x, y);
  }

  update() {
    if (this.busy || this.moving) return;
    const held = (Object.keys(this.keys) as Dir[]).find(d => this.keys[d].some(k => k.isDown));
    if (held) void this.tryMove(held);
  }

  private async tryMove(d: Dir) {
    G.dir = d;
    const [dx, dy] = DIRS[d];
    const nx = G.x + dx, ny = G.y + dy;
    const warp = this.area.warps.find(w => w.x === nx && w.y === ny);
    if (this.blocked(nx, ny) && !warp) {
      this.setPlayerFrame(false);
      const door = this.area.doors.find(o => o.x === nx && o.y === ny);
      if (door) { void this.run(() => this.enterDoor(door)); return; }
      this.moving = true;
      sfx('bump');
      await wait(this, 200);
      this.moving = false;
      return;
    }
    this.moving = true;
    this.parity = !this.parity;
    this.setPlayerFrame(true);
    this.time.delayedCall(90, () => this.setPlayerFrame(false));
    await tween(this, { targets: this.player, x: nx * T, y: ny * T - 2, duration: 170 });
    G.x = nx; G.y = ny; G.steps++;
    this.moving = false;

    if (warp) { await this.run(() => this.doWarp(warp.to, warp.tx, warp.ty)); return; }
    if (await this.checkTrainers()) return;
    this.checkEncounter();
  }

  private async doWarp(to: string, tx: number, ty: number) {
    this.cameras.main.fadeOut(200);
    await wait(this, 220);
    G.map = to; G.x = tx; G.y = ty;
    this.scene.restart();
  }

  // ── 상호작용 ───────────────────────────────────────
  private async interact() {
    const [dx, dy] = DIRS[G.dir];
    const fx = G.x + dx, fy = G.y + dy;
    const npc = this.npcAt(fx, fy);
    if (npc) return this.talk(npc);
    const sign = this.area.signs.find(s => s.x === fx && s.y === fy);
    if (sign) return this.box.say(sign.lines);
    const door = this.area.doors.find(o => o.x === fx && o.y === fy);
    if (door) return this.enterDoor(door);
  }

  private async enterDoor(door: Area['doors'][number]) {
    const lines = door.lines;
    if (door.lab) {
      await this.box.say(lines);
      await this.profProgress();
      return;
    }
    await this.box.say(lines.length > 1 ? lines.slice(0, -1) : lines);
    if (door.save) { save(); sfx('heal'); }
    if (lines.length > 1) await this.box.say(lines[lines.length - 1]);
  }

  private async talk(o: NpcObj) {
    const n = o.def;
    this.faceNpc(o, OPPOSITE[G.dir]);
    if (n.trainer && !G.flags[`beat_${n.id}`]) {
      await this.trainerDuel(o);
      return;
    }
    if (n.trainer) { await this.box.say(n.trainer.win); return; }
    if (n.gate) {
      const [have, total] = this.villageCount();
      if (have >= total) {
        await this.box.say([`문지기: 이 마을의 원소 ${total}종을 모두 채집했구나!`, `지나가도 좋아. 동쪽은 ${n.gate.next}이야.`]);
      } else {
        await this.box.say([`문지기: 동쪽은 ${n.gate.next}이야.`,
          `이 마을(${this.area.group})의 원소 ${total}종을 모두 채집해야 지나갈 수 있어. (지금 ${have}/${total}종)`]);
      }
      return;
    }
    if (n.id === 'prof' && G.caught.length >= 36) { await this.profProgress(); return; }
    await this.box.say(n.lines);
    if (n.gift && !G.flags[`gift_${n.id}`]) {
      await this.box.say(n.gift.lines);
      G.hints += n.gift.hints;
      G.flags[`gift_${n.id}`] = true;
      sfx('catch');
      await this.box.say(`힌트 전구 ${n.gift.hints}개를 받았다! (가진 전구 ${G.hints}개)`);
    }
    if (n.id === 'prof') await this.profProgress();
  }

  private async profProgress() {
    const c = G.caught.length;
    const total = G.correct + G.wrong;
    const rate = total ? Math.round((G.correct / total) * 100) : 0;
    if (c >= 36) {
      if (!G.flags.ending) {
        await this.box.say(['주기 박사: 오오…! 36종을 모두 모았구나!!', '모두에게 보여 줄 게 있단다. 따라오렴!']);
      } else {
        this.box.set('주기 박사: 주기율표가 완성된 날의\n축하 파티를 다시 볼까?');
        if (!(await yesNo(this, this.pad))) {
          this.box.hide();
          await this.box.say('주기 박사: 도감의 "완성!" 도장, 정말 자랑스럽구나!');
          return;
        }
        this.box.hide();
      }
      this.cameras.main.fadeOut(400);
      await wait(this, 450);
      await runScene(this, 'Ending');
      G.flags.ending = true;
      save();
      playBgm(this.area.bgm);
      this.cameras.main.fadeIn(400);
      await this.box.say(['주기 박사: 정말 수고 많았다, 원정대원!', '도감에 "완성!" 도장을 찍어 두었단다. 언제든 다시 보고 싶으면 말을 걸렴.']);
      return;
    }
    await this.box.say([
      `주기 박사: 지금까지 ${c}종을 채집했구나. 36종까지 ${36 - c}종 남았다!`,
      ...(total ? [`지금까지 ${total}문제 중 ${G.correct}문제를 맞혔단다. (정답률 ${rate}%)`] : []),
    ]);
  }

  // ── 트레이너 (퀴즈 대결) ─────────────────────────────
  private async checkTrainers(): Promise<boolean> {
    for (const o of this.npcs) {
      const n = o.def;
      if (!n.trainer || G.flags[`beat_${n.id}`] || this.lostTo.has(n.id)) continue;
      const [dx, dy] = DIRS[o.dir];
      for (let k = 1; k <= 4; k++) {
        const x = o.x + dx * k, y = o.y + dy * k;
        if (x === G.x && y === G.y) {
          await this.run(async () => {
            const mark = txt(this, o.sprite.x + 8, o.sprite.y - 12, '!', { color: '#e83838', shadow: '#ffffff', align: 'center' }).setDepth(20);
            sfx('encounter');
            await wait(this, 600);
            mark.destroy();
            // 플레이어 앞까지 걸어온다
            for (let s = 1; s < k; s++) {
              o.x += dx; o.y += dy;
              await tween(this, { targets: o.sprite, x: o.x * T, y: o.y * T - 2, duration: 170 });
            }
            G.dir = OPPOSITE[o.dir];
            this.setPlayerFrame(false);
            await this.trainerDuel(o);
          });
          return true;
        }
        if (BLOCKING.has(tileAt(this.area, x, y)) || this.npcAt(x, y)) break;
      }
    }
    return false;
  }

  private async trainerDuel(o: NpcObj) {
    const n = o.def;
    const tr = n.trainer!;
    await this.box.say(n.lines);
    const pool = [...new Set(Object.values(this.area.encounters).flatMap(t => (t ?? []).map(e => e.z)))];
    const result = await this.quiz({ kind: 'trainer', pool, trainerName: n.name, trainerKey: `npc_${n.id}` });
    if (result === 'win') {
      G.flags[`beat_${n.id}`] = true;
      await this.box.say(tr.win);
      G.hints += tr.reward;
      sfx('catch');
      await this.box.say(`${n.name}에게서 힌트 전구 ${tr.reward}개를 받았다!`);
    } else {
      this.lostTo.add(n.id);
      await this.box.say(`${n.name}: 다음에 또 도전해! (말을 걸면 다시 대결할 수 있다)`);
    }
  }

  // ── 자연 상태의 원소 ──────────────────────────────────────
  private checkEncounter() {
    const ch = tileAt(this.area, G.x, G.y);
    if (!ENCOUNTER_TILES.has(ch)) return;
    const table = this.area.encounters[ch];
    if (!table || Math.random() > 0.11) return;
    // 아직 채집하지 못한 원소만 나온다
    const left = table.filter(e => !G.caught.includes(e.z));
    if (!left.length) return;
    const pick = weighted(left);
    void this.run(async () => {
      await this.quiz({ kind: 'wild', z: pick.z });
    });
  }

  private async quiz(data: QuizData): Promise<QuizResult> {
    sfx('encounter');
    const cam = this.cameras.main;
    cam.flash(150, 255, 255, 255);
    await wait(this, 200);
    cam.flash(150, 255, 255, 255);
    await wait(this, 250);
    const result = await runScene<QuizResult>(this, 'Quiz', { ...data, temp: this.area.temp, theme: this.area.theme, group: this.area.group });
    playBgm(this.area.bgm);
    if (result === 'caught') {
      const [have, total] = this.villageCount();
      if (G.caught.length >= 36 && !G.flags.ending) {
        void playJingle('clear', this.area.bgm);
        save();
        await this.box.say(['36종을 모두 모았다!! 원소 주기율표 완성이다!', '1족 마을의 주기 박사에게 가 보자!']);
      }
      if (have >= total) {
        void playJingle('clear', this.area.bgm);
        const gate = this.area.npcs.some(n => n.gate);
        await this.box.say(`${this.area.group} 원소 ${total}종을 모두 채집했다!${gate ? ' 동쪽 문지기가 길을 비켜 준다.' : ''}`);
        this.scene.restart();
      } else {
        await this.box.say(`(${this.area.name}: ${have}/${total}종 채집)`);
      }
    }
    return result;
  }

  // ── 메뉴 ──────────────────────────────────────────
  private async menu() {
    sfx('select');
    let start = 0;
    for (;;) {
      const items = ['도감', '기록', '저장', `음악 ${isMusicOn() ? '켬' : '끔'}`, `효과음 ${isSfxOn() ? '켬' : '끔'}`, '닫기'];
      const i = await choose(this, this.pad, { x: W - 88, y: 2, w: 86, items, cancel: true, start });
      start = Math.max(0, i);
      if (i === 0) await runScene(this, 'Dex');
      else if (i === 1) {
        const total = G.correct + G.wrong;
        await this.box.say([
          `원소 도감: 채집 ${G.caught.length}/36 · 발견 ${G.seen.length}/36`,
          `푼 문제 ${total}개 · 정답 ${G.correct}개 · 힌트 전구 ${G.hints}개`,
        ]);
      } else if (i === 2) {
        const ok = save();
        await this.box.say(ok ? '모험 기록을 저장했다!' : '저장에 실패했다… (브라우저 저장소를 확인해 주세요)');
      } else if (i === 3) {
        const on = toggleMusic();
        await this.box.say(on ? '배경 음악을 켰다.' : '배경 음악을 껐다.');
      } else if (i === 4) {
        const on = toggleSfx();
        if (on) sfx('select');
        await this.box.say(on ? '효과음을 켰다.' : '효과음을 껐다.');
      } else return;
    }
  }
}

function weighted(table: Encounter[]): Encounter {
  const total = table.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of table) { r -= e.w; if (r <= 0) return e; }
  return table[0];
}
