import Phaser from 'phaser';
import { W, H, txt, Pad, TextBox, choose, runScene, wait, tween, drawWindow, josa } from '../ui/ui';
import { el, phaseAt, PHASE_NAME } from '../data/elements';
import { TYPES, type TypeId } from '../data/types';
import type { Theme } from '../data/areas';
import { G, markSeen, markCaught } from '../systems/state';
import { nextQuestion, randomLifeQuestion, type Question } from '../systems/quiz';
import { playBgm, playJingle, sfx } from '../systems/audio';

// 퀴즈 채집: 자연 상태의 원소는 정체를 모르는 채로 나타난다.
// "이 원소는 무엇일까?" 문제를 맞히면 정체가 밝혀지고 채집된다. (레벨·HP 없음)

export interface QuizData {
  kind: 'wild' | 'trainer';
  z?: number;              // 자연 원소: 만난 원소 (화면에는 숨김)
  pool?: number[];         // 트레이너: 문제를 낼 원소 후보
  trainerName?: string;
  trainerKey?: string;
  temp?: number;
  theme?: Theme;
  group?: string;          // 'n족'
}
export type QuizResult = 'caught' | 'fled' | 'run' | 'win' | 'lose';

const BG: Record<Theme, [number, number, number]> = {
  // 하늘 위, 하늘 아래, 땅
  town: [0x88c8f8, 0xd8f0f8, 0x98d070],
  forest: [0x70b8e8, 0xc8e8c0, 0x70b050],
  beach: [0x68b0f0, 0xd8f0f8, 0xf0d898],
  mine: [0x403830, 0x706050, 0xa89878],
  volcano: [0x602818, 0xc06030, 0x8a7a72],
  city: [0x201838, 0x584878, 0xa0a0b0],
};

const ENEMY_POS = { x: 176, y: 68 };
const PLAYER_POS = { x: 58, y: 112 };
const MAX_TRIES = 2;          // 한 문제에 기회 2번
const TRAINER_QUESTIONS = 3;
const TRAINER_NEED = 2;

export class QuizScene extends Phaser.Scene {
  private d!: QuizData;
  private pad!: Pad;
  private box!: TextBox;
  private temp = 293;
  private foeSprite!: Phaser.GameObjects.Image;
  private foeInfo?: Phaser.GameObjects.Container;
  private meInfo?: Phaser.GameObjects.Container;
  private tries = MAX_TRIES;
  private score = 0;

  constructor() { super('Quiz'); }

  create(data: QuizData) {
    this.d = data;
    this.temp = data.temp ?? 293;
    this.pad = new Pad(this);
    this.tries = MAX_TRIES;
    this.score = 0;
    this.foeInfo = undefined;
    this.meInfo = undefined;
    playBgm(data.kind === 'trainer' ? 'duel' : 'quiz');

    const [sky1, sky2, ground] = BG[data.theme ?? 'town'];
    const g = this.add.graphics();
    g.fillGradientStyle(sky1, sky1, sky2, sky2, 1).fillRect(0, 0, W, 60);
    g.fillStyle(ground, 1).fillRect(0, 58, W, 102);
    const dark = Phaser.Display.Color.ValueToColor(ground).darken(15).color;
    const light = Phaser.Display.Color.ValueToColor(ground).brighten(10).color;
    g.fillStyle(dark, 1).fillEllipse(ENEMY_POS.x, ENEMY_POS.y - 4, 104, 22).fillEllipse(PLAYER_POS.x, PLAYER_POS.y - 4, 110, 24);
    g.fillStyle(light, 1).fillEllipse(ENEMY_POS.x, ENEMY_POS.y - 6, 96, 16).fillEllipse(PLAYER_POS.x, PLAYER_POS.y - 6, 102, 18);

    // 플레이어(뒷모습)
    this.add.image(PLAYER_POS.x, PLAYER_POS.y + 4, 'player', 3).setOrigin(0.5, 1).setScale(4);

    this.box = new TextBox(this, this.pad);
    void (data.kind === 'trainer' ? this.trainerFlow() : this.wildFlow()).then(r => this.events.emit('done', r));
  }

  // ── 정보 창 ───────────────────────────────────────
  /** 정체를 모를 때: ??? / 밝혀진 뒤: 이름·기호·분류 */
  private drawFoeInfo(z: number, revealed: boolean) {
    this.foeInfo?.destroy();
    const e = el(z);
    const x = 6, y = 6;
    const g = this.add.graphics();
    drawWindow(g, x, y, 112, 36);
    const items: Phaser.GameObjects.GameObject[] = [g];
    if (revealed) {
      items.push(
        txt(this, x + 8, y + 4, `${e.sym} ${e.name}`),
        this.typeBadge(x + 8, y + 20, e.type),
        txt(this, x + 40, y + 21, `${PHASE_NAME[phaseAt(e, this.temp)]} · ${e.z}번`, { size: 'xs', color: '#506080', shadow: null }),
      );
    } else {
      items.push(
        txt(this, x + 8, y + 4, '???'),
        txt(this, x + 8, y + 21, `${this.d.group ?? ''} 원소 · 정체 불명`, { size: 'xs', color: '#506080', shadow: null }),
      );
    }
    this.foeInfo = this.add.container(0, 0, items).setDepth(50);
  }

  private drawMeInfo() {
    this.meInfo?.destroy();
    const x = 126, y = 70;
    const g = this.add.graphics();
    drawWindow(g, x, y, 112, 40);
    const items: Phaser.GameObjects.GameObject[] = [g];
    if (this.d.kind === 'wild') {
      items.push(txt(this, x + 8, y + 4, '남은 기회', { size: 's' }));
      for (let i = 0; i < MAX_TRIES; i++) items.push(this.add.image(x + 64 + i * 14, y + 10, i < this.tries ? 'icon_heart' : 'icon_heart_empty'));
    } else {
      items.push(txt(this, x + 8, y + 4, `정답 ${this.score} / ${TRAINER_QUESTIONS}`, { size: 's' }));
      items.push(txt(this, x + 104, y + 5, `${TRAINER_NEED}개면 승리`, { size: 'xs', align: 'right', shadow: null, color: '#506080' }));
    }
    items.push(this.add.image(x + 14, y + 27, 'icon_hint'));
    items.push(txt(this, x + 24, y + 21, `힌트 전구 × ${G.hints}`, { size: 's' }));
    this.meInfo = this.add.container(0, 0, items).setDepth(50);
  }

  private typeBadge(x: number, y: number, type: TypeId) {
    const t = TYPES[type];
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(Phaser.Display.Color.HexStringToColor(t.color).color, 1).fillRoundedRect(0, 0, 28, 10, 2);
    c.add([g, txt(this, 14, 1, t.short, { size: 'xs', color: '#202030', shadow: null, align: 'center' })]);
    return c;
  }

  /** 실루엣 → 진짜 모습 */
  private async reveal(z: number) {
    sfx('heal');
    const flash = this.add.circle(this.foeSprite.x, this.foeSprite.y - 30, 6, 0xffffff).setDepth(40);
    await tween(this, { targets: flash, radius: 46, alpha: 0, duration: 400 });
    flash.destroy();
    this.foeSprite.setTexture(`mon_${z}`);
    markSeen(z);
    this.drawFoeInfo(z, true);
  }

  // ── 자연 상태의 원소 ───────────────────────────────
  private async wildFlow(): Promise<QuizResult> {
    const z = this.d.z!;
    const e = el(z);
    this.foeSprite = this.add.image(W + 40, ENEMY_POS.y, `monsil_${z}`).setOrigin(0.5, 1);
    await tween(this, { targets: this.foeSprite, x: ENEMY_POS.x, duration: 500 });
    this.drawFoeInfo(z, false);
    await this.box.say(['앗! 자연 상태의 원소가 나타났다!', '어떤 원소인지 알 수 없다…']);
    this.drawMeInfo();

    this.box.set('문제를 맞혀서\n정체를 밝혀 보자!');
    const k = await choose(this, this.pad, { x: 140, y: H - 48, w: 100, items: ['문제 풀기', '도망가기'], rowH: 18 });
    if (k !== 0) {
      sfx('back');
      await this.box.say('무사히 빠져나왔다!');
      return 'run';
    }

    const q = nextQuestion(z);
    const ok = await this.ask(q, MAX_TRIES);
    if (ok) {
      await this.reveal(z);
      await this.box.say([`정체는 ${e.name}(${e.sym})이었다!`, q.ex]);
      await this.phaseNotice(z);
      await this.capture(z);
      return 'caught';
    }
    await this.reveal(z);
    await this.box.say([`정체는 ${e.name}(${e.sym})이었다!`, q.ex]);
    void playJingle('fled');
    await tween(this, { targets: this.foeSprite, x: W + 40, duration: 500 });
    await this.box.say([`${josa(e.name, '은/는')} 도망쳐 버렸다…`, '다시 만나면 다른 문제로 또 도전할 수 있어!']);
    return 'fled';
  }

  private async phaseNotice(z: number) {
    const e = el(z);
    const ph = phaseAt(e, this.temp);
    if (ph === 'solid') return;
    await this.box.say(`이곳 기온(${this.temp - 273} ℃)에서 ${josa(e.name, '은/는')} ${PHASE_NAME[ph]} 상태다!`);
  }

  // ── 트레이너 퀴즈 대결 ──────────────────────────────
  private async trainerFlow(): Promise<QuizResult> {
    const d = this.d;
    const trainer = this.add.image(W + 40, ENEMY_POS.y - 2, d.trainerKey!, 0).setOrigin(0.5, 1).setScale(3);
    await tween(this, { targets: trainer, x: ENEMY_POS.x, duration: 500 });
    await this.box.say([`${josa(d.trainerName!, '이/가')} 퀴즈 대결을 걸어왔다!`,
      `숨겨진 원소의 정체를 맞히는 문제 ${TRAINER_QUESTIONS}개 중 ${TRAINER_NEED}개 이상 맞히면 승리!`]);
    this.drawMeInfo();
    await tween(this, { targets: trainer, x: W + 40, duration: 300 });

    const pool = Phaser.Utils.Array.Shuffle([...(d.pool ?? [1])]);
    this.foeSprite = this.add.image(W + 40, ENEMY_POS.y, `monsil_${pool[0]}`).setOrigin(0.5, 1);
    for (let i = 0; i < TRAINER_QUESTIONS; i++) {
      const z = pool[i % pool.length];
      this.foeSprite.setTexture(`monsil_${z}`).setX(W + 40);
      await tween(this, { targets: this.foeSprite, x: ENEMY_POS.x, duration: 350 });
      this.drawFoeInfo(z, false);
      await this.box.say(`${i + 1}번 문제! 이 원소의 정체는?`);
      const q = randomLifeQuestion(z);
      if (await this.ask(q, 1)) this.score++;
      await this.reveal(z);
      await this.box.say([`정체는 ${el(z).name}(${el(z).sym})이었다!`, q.ex]);
      this.drawMeInfo();
      this.foeInfo?.destroy();
      await tween(this, { targets: this.foeSprite, x: W + 40, duration: 250 });
      // 승부가 이미 결정되면 끝
      if (this.score >= TRAINER_NEED || this.score + (TRAINER_QUESTIONS - 1 - i) < TRAINER_NEED) break;
    }
    trainer.setX(W + 40);
    await tween(this, { targets: trainer, x: ENEMY_POS.x, duration: 300 });
    if (this.score >= TRAINER_NEED) {
      void playJingle('win');
      await this.box.say(`${josa(d.trainerName!, '와/과')}의 퀴즈 대결에서 이겼다!`);
      return 'win';
    }
    void playJingle('lose');
    await this.box.say(['아쉽게 졌다…', '도감에서 원소 정보를 다시 보고 재도전해 보자!']);
    return 'lose';
  }

  // ── 문제 내기 ─────────────────────────────────────
  /** 문제를 낸다. tries 번 안에 맞히면 true. (해설은 부르는 쪽에서 정체 공개와 함께 보여 줌) */
  private async ask(q: Question, tries: number): Promise<boolean> {
    const layer = this.add.container(0, 0).setDepth(900);
    layer.add(this.add.rectangle(0, 0, W, H, 0x101020, 0.55).setOrigin(0));
    const g = this.add.graphics();
    drawWindow(g, 0, 0, W, 64);
    layer.add(g);
    layer.add(txt(this, 8, 5, 'Q.', { color: '#d04838' }));
    layer.add(txt(this, 24, 5, q.q, { wrap: W - 34 }));
    this.box.hide();

    const disabled = q.choices.map(() => false);
    let hintUsed = false;
    this.tries = tries;
    for (;;) {
      const items = [...q.choices];
      const canHint = !hintUsed && G.hints > 0;
      if (canHint) items.push(`힌트 쓰기 (전구 ${G.hints}개)`);
      const rowH = 15;
      const h = items.length * rowH + 10;
      layer.setVisible(true);
      const i = await choose(this, this.pad, { x: 0, y: H - h, w: W, items, rowH, disabled: [...disabled, false] });
      if (i >= q.choices.length) {
        // 힌트: 오답 2개 지우기
        hintUsed = true;
        G.hints--;
        G.hintsUsed = (G.hintsUsed ?? 0) + 1;
        this.drawMeInfo();
        const wrongs = Phaser.Utils.Array.Shuffle(q.choices.map((_, k) => k).filter(k => k !== q.answer && !disabled[k])).slice(0, 2);
        wrongs.forEach(k => (disabled[k] = true));
        sfx('heal');
        continue;
      }
      if (i === q.answer) {
        layer.destroy();
        G.correct++;
        sfx('levelup');
        await this.flash(0x58d080);
        await this.box.say('딩동댕! 정답이야!');
        return true;
      }
      // 오답
      G.wrong++;
      disabled[i] = true;
      this.tries--;
      if (this.d.kind === 'wild') this.drawMeInfo();
      sfx('faint');
      this.cameras.main.shake(200, 0.01);
      await this.flash(0xf05838);
      if (this.tries <= 0) {
        layer.destroy();
        await this.box.say(`땡! 「${q.choices[i]}」${eun(q.choices[i])} 아니었다…`);
        return false;
      }
      layer.setVisible(false);
      await this.box.say(`땡! 「${q.choices[i]}」${eun(q.choices[i])} 아니야. 다시 한 번 생각해 봐! (기회 ${this.tries}번 남음)`);
    }
  }

  private async flash(color: number) {
    const r = this.add.rectangle(0, 0, W, H, color, 0.35).setOrigin(0).setDepth(950);
    await tween(this, { targets: r, alpha: 0, duration: 350 });
    r.destroy();
  }

  // ── 채집 연출 ─────────────────────────────────────
  private async capture(z: number) {
    const e = el(z);
    await this.box.say('채집 병을 던졌다!', { keep: true });
    const icon = this.add.image(PLAYER_POS.x, PLAYER_POS.y - 40, 'icon_flask').setScale(1.5).setDepth(60);
    const sx = icon.x, sy = icon.y, tx = ENEMY_POS.x, ty = ENEMY_POS.y - 34;
    await tween(this, {
      targets: { t: 0 }, t: 1, duration: 450,
      onUpdate: (_tw: Phaser.Tweens.Tween, o: { t: number }) => {
        const t = o.t;
        icon.setPosition(sx + (tx - sx) * t, sy + (ty - sy) * t - Math.sin(t * Math.PI) * 40);
        icon.setAngle(t * 540);
      },
    });
    icon.setAngle(0);
    this.foeSprite.setTintFill(0xffffff);
    await tween(this, { targets: this.foeSprite, scale: 0, duration: 250 });
    await tween(this, { targets: icon, y: ENEMY_POS.y - 8, duration: 250, ease: 'Bounce.out' });
    for (let i = 0; i < 3; i++) {
      await wait(this, 250);
      sfx('shake');
      await tween(this, { targets: icon, angle: { from: -20, to: 20 }, duration: 110, yoyo: true });
      icon.setAngle(0);
    }
    await wait(this, 250);
    void playJingle('caught');
    for (let i = 0; i < 8; i++) {
      const s = this.add.rectangle(icon.x, icon.y, 2, 2, 0xfff4a0).setDepth(61);
      const a = (i / 8) * Math.PI * 2;
      this.tweens.add({ targets: s, x: icon.x + Math.cos(a) * 16, y: icon.y + Math.sin(a) * 16, alpha: 0, duration: 500, onComplete: () => s.destroy() });
    }
    icon.setTint(0xb0ffc0);
    markCaught(z);
    await this.box.say([`좋아! ${josa(e.name, '을/를')} 채집했다! (도감 ${G.caught.length}/36)`, `${e.name}의 정보가 원소 도감에 등록되었다!`]);
    await runScene(this, 'Summary', { z });
  }
}

/** 「이름」 뒤에 붙일 은/는 */
const eun = (word: string) => josa(word, '은/는').slice(word.length);
