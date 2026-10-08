import Phaser from 'phaser';
import { W, H, txt, Pad, choose } from '../ui/ui';
import { hasSave, load, newGame, setState } from '../systems/state';
import { playBgm, sfx } from '../systems/audio';
import { ELEMENTS } from '../data/elements';
import { TYPES } from '../data/types';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const pad = new Pad(this);

    // 배경: 주기율표 무늬
    const g = this.add.graphics();
    g.fillGradientStyle(0x1c2050, 0x1c2050, 0x4a2a6a, 0x4a2a6a, 1);
    g.fillRect(0, 0, W, H);
    for (const e of ELEMENTS) {
      const x = 12 + (e.group - 1) * 12, y = 8 + (e.period - 1) * 12;
      g.fillStyle(Phaser.Display.Color.HexStringToColor(TYPES[e.type].color).color, 0.22);
      g.fillRect(x, y, 11, 11);
    }

    const title = txt(this, W / 2, 26, '원소 원정대', { color: '#fff4c0', shadow: '#b04020', align: 'center' }).setScale(2);
    title.setFontStyle('bold');
    txt(this, W / 2, 56, 'The Element Expedition', { size: 's', color: '#ffd890', shadow: '#202040', align: 'center' });
    txt(this, W / 2, 68, '원소 주기율표를 완성하라', { size: 'xs', color: '#c8d0ff', shadow: '#202040', align: 'center' });

    // 원소 퍼레이드
    const picks = [8, 26, 11, 17, 2];
    picks.forEach((z, i) => {
      const s = this.add.image(32 + i * 44, 100, `mon_${z}`).setScale(0.75);
      this.tweens.add({ targets: s, y: 96, duration: 500 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: i * 90 });
    });

    const press = txt(this, W / 2, 132, 'Z 키를 눌러 시작', { color: '#ffffff', shadow: '#202040', align: 'center' });
    this.tweens.add({ targets: press, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    txt(this, W - 4, H - 10, 'v0.3 · 1~36번 원소', { size: 'xs', color: '#8890c0', shadow: null, align: 'right' });

    void (async () => {
      await pad.waitFor('A', 'START');
      sfx('select');
      playBgm('town');
      press.destroy();
      const items = hasSave() ? ['이어하기', '새 게임'] : ['새 게임'];
      for (;;) {
        const i = await choose(this, pad, { x: W / 2 - 40, y: 118, w: 80, items });
        if (items[i] === '이어하기' && load()) {
          this.scene.start('Overworld');
          return;
        }
        if (items[i] === '새 게임') {
          setState(newGame());
          this.scene.start('Intro');
          return;
        }
      }
    })();
  }
}
