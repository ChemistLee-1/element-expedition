import Phaser from 'phaser';
import { W, H, txt, Pad, drawWindow } from '../ui/ui';
import { el, phaseAt, PHASE_NAME, configText } from '../data/elements';
import { TYPES } from '../data/types';
import { AREAS } from '../data/areas';
import { sfx } from '../systems/audio';

export function foundIn(z: number): string[] {
  return Object.values(AREAS).filter(a => Object.values(a.encounters).some(t => t?.some(e => e.z === z))).map(a => a.name);
}

/** 원소 카드 (도감 상세). ←→ 로 페이지 넘김 */
export class SummaryScene extends Phaser.Scene {
  constructor() { super('Summary'); }

  create(data: { z: number }) {
    const pad = new Pad(this);
    const e = el(data.z);
    const typeCol = Phaser.Display.Color.HexStringToColor(TYPES[e.type].color).color;

    this.add.rectangle(0, 0, W, H, 0xe8e8f0).setOrigin(0);
    this.add.rectangle(0, 0, W, 18, typeCol).setOrigin(0);
    const pages = ['정보', '실생활', '알고 있나요?', '물성'];
    const header = txt(this, 6, 3, '', { color: '#202030', shadow: '#ffffff80' });
    const dots = txt(this, W - 6, 4, '', { size: 's', color: '#202030', shadow: null, align: 'right' });
    const body = this.add.container(0, 0).setDepth(10);

    // 왼쪽: 원소 카드
    const card = this.add.graphics();
    drawWindow(card, 4, 22, 80, 134);
    this.add.rectangle(10, 28, 68, 68, typeCol, 0.35).setOrigin(0);
    this.add.image(44, 62, `mon_${e.z}`);
    txt(this, 44, 98, `No.${String(e.z).padStart(3, '0')}`, { size: 's', align: 'center' });
    txt(this, 44, 110, `${e.sym}  ${e.name}`, { align: 'center' });
    txt(this, 44, 126, e.en, { size: 'xs', color: '#606080', shadow: null, align: 'center' });
    txt(this, 44, 138, TYPES[e.type].name, { size: 's', color: '#202030', shadow: null, align: 'center' });

    const R = 92; // 오른쪽 영역 x
    const panel = this.add.graphics();
    drawWindow(panel, 88, 22, 148, 134);

    const line = (y: number, label: string, value: string) => {
      body.add(txt(this, R + 4, y, label, { size: 's', color: '#5a6a90', shadow: null }));
      body.add(txt(this, 230, y, value, { size: 's', align: 'right' }));
    };

    const render = (p: number) => {
      body.removeAll(true);
      header.setText(`${e.name} · ${pages[p]}`);
      dots.setText(pages.map((_, i) => (i === p ? '●' : '○')).join(''));
      const name = pages[p];
      if (name === '정보') {
        line(28, '원자 번호', String(e.z));
        line(42, '주기 / 족', `${e.period}주기 ${e.group}족`);
        line(56, '원자량', String(e.mass));
        line(70, '전자 배치', configText(e));
        line(84, '원자가 전자', `${e.valence}개`);
        body.add(txt(this, R + 4, 98, '발견', { size: 's', color: '#5a6a90', shadow: null }));
        body.add(txt(this, R + 4, 111, e.discovered, { size: 's', wrap: 138 }));
        line(138, '발견 장소', foundIn(e.z).join(', ') || '-');
      } else if (name === '실생활') {
        body.add(txt(this, R + 4, 28, '이런 데 쓰여요', { size: 's', color: '#5a6a90', shadow: null }));
        let y = 44;
        for (const u of e.uses) {
          body.add(this.add.rectangle(R + 6, y + 4, 3, 3, typeCol).setOrigin(0));
          const t = txt(this, R + 13, y, u, { size: 's', wrap: 128 });
          body.add(t);
          y += t.height + 8;
        }
      } else if (name === '알고 있나요?') {
        body.add(txt(this, R + 4, 28, '알고 있나요?', { size: 's', color: '#5a6a90', shadow: null }));
        body.add(txt(this, R + 4, 44, e.fact, { wrap: 136 }));
      } else if (name === '물성') {
        const temp = 298;
        line(28, '상태 (25 ℃)', PHASE_NAME[phaseAt(e, temp)]);
        line(42, '밀도', e.density < 0.01 ? `${(e.density * 1000).toFixed(3)} g/L` : `${e.density} g/cm³`);
        line(56, '녹는점', `${Math.round(e.mp - 273.15)} ℃`);
        line(70, '끓는점', `${Math.round(e.bp - 273.15)} ℃`);
        line(84, '전기음성도', e.eneg == null ? '없음' : String(e.eneg));
        line(98, '이온화 에너지', `${e.ie} kJ/mol`);
        line(112, '원자 반지름', `${e.radius} pm`);
        if (e.z === 33) body.add(txt(this, R + 4, 128, '※ 비소는 녹기 전에 승화한다', { size: 'xs', shadow: null }));
      }
    };

    let p = 0;
    render(p);

    void (async () => {
      for (;;) {
        const b = await pad.next();
        if (b === 'RIGHT' && p < pages.length - 1) { p++; sfx('move'); render(p); }
        else if (b === 'LEFT' && p > 0) { p--; sfx('move'); render(p); }
        else if (b === 'A' && p < pages.length - 1) { p++; sfx('move'); render(p); }
        else if (b === 'B' || b === 'A') { sfx('back'); break; }
      }
    })().then(() => this.events.emit('done'));
  }
}
