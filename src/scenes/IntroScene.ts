import Phaser from 'phaser';
import { W, H, Pad, TextBox, tween, keyLabel, josa } from '../ui/ui';
import { sfx, playBgm } from '../systems/audio';

export class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  create() {
    const pad = new Pad(this);
    const g = this.add.graphics();
    g.fillGradientStyle(0xf8f0d8, 0xf8f0d8, 0xd8e8f8, 0xd8e8f8, 1);
    g.fillRect(0, 0, W, H);
    const prof = this.add.image(W / 2, 58, 'npc_prof', 0).setScale(4);
    const box = new TextBox(this, pad);
    playBgm('intro');

    void (async () => {
      await box.say([
        '안녕! 원소의 세계에 온 걸 환영한다!',
        '나는 이 마을 주기 연구소의 주기 박사란다.',
        '이 세상의 모든 물질은 118종류의 "원소"로 이루어져 있지.',
        '물은 수소와 산소, 소금은 나트륨과 염소… 우리 몸도 탄소, 산소, 칼슘 같은 원소로 되어 있단다.',
        '이 지역에는 1번 수소부터 36번 크립톤까지 36종의 원소가 살고 있어.',
      ]);

      // 원소 몇 개를 보여 주며 설명
      prof.setVisible(false);
      const demo = [8, 26, 11].map((z, i) => this.add.image(60 + i * 60, 60, `mon_${z}`).setAlpha(0));
      for (const s of demo) await tween(this, { targets: s, alpha: 1, duration: 200 });
      await box.say([
        '이 지역은 주기율표처럼 생겼단다. 1족 마을에서 시작해 동쪽으로 가면 2족, 전이 금속(3~12족)… 18족 마을까지 이어져 있지.',
        '마을마다 그 족의 원소들이 "자연 상태"로 숨어 있어. 풀숲이나 광석 위를 걸으면 나타난단다.',
        '자연 상태의 원소는 겉모습만 봐서는 어떤 원소인지 알 수 없어.',
        '대신 그 원소에 대한 수수께끼가 나오지. 생활 속에서 어디에 쓰이는지 같은 단서로, 정체를 맞혀 보렴!',
        '정답을 맞히면 정체가 밝혀지고 채집할 수 있어. 기회는 2번. 다 틀리면 도망가지만, 다시 만나면 다른 문제로 도전할 수 있단다.',
        '마을의 원소를 모두 채집하면 문지기가 다음 족 마을로 가는 길을 열어 줄 거야.',
      ]);
      demo.forEach(s => s.destroy());
      const bulb = this.add.image(W / 2, 56, 'icon_hint').setScale(4);
      sfx('catch');
      await box.say([
        '이건 "힌트 전구"란다. 문제를 풀 때 쓰면 틀린 보기 2개를 지워 주지.',
        '우선 3개를 줄 테니 아껴 쓰렴. 마을 사람들에게 받거나 퀴즈 대결에서 이기면 더 얻을 수 있단다.',
      ]);
      bulb.destroy();
      prof.setVisible(true);
      await box.say([
        '목표는 원소를 모두 채집해서 "원소 도감", 그러니까 주기율표를 완성하는 거야!',
        `${josa(keyLabel('MENU'), '으로/로')} 메뉴를 열면 도감과 기록을 볼 수 있어.`,
        '그럼 원소의 세계로 출발!',
      ]);
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Overworld'));
    })();
  }
}
