import Phaser from 'phaser';
import { W, H, txt, Pad, drawWindow, runScene, TextBox } from '../ui/ui';
import { ELEMENTS, type ElementData } from '../data/elements';
import { TYPES, type TypeId } from '../data/types';
import { G } from '../systems/state';
import { sfx } from '../systems/audio';
import { foundIn } from './SummaryScene';

const CW = 13, CH = 13;
const OX = (W - 18 * CW) / 2;
const OY = 18;

/** 원소 도감 = 주기율표. 채집할수록 칸이 채워진다 */
export class DexScene extends Phaser.Scene {
  constructor() { super('Dex'); }

  create() {
    const pad = new Pad(this);
    this.add.rectangle(0, 0, W, H, 0x24284a).setOrigin(0);
    txt(this, 6, 3, '원소 도감', { color: '#ffffff', shadow: '#000000' });
    txt(this, W - 6, 4, `채집 ${G.caught.length}/36 · 발견 ${G.seen.length}/36`, { size: 's', color: '#f8e080', shadow: '#000000', align: 'right' });

    const g = this.add.graphics();
    for (const e of ELEMENTS) {
      const { x, y } = cellPos(e);
      const caught = G.caught.includes(e.z), seen = G.seen.includes(e.z);
      const col = caught ? Phaser.Display.Color.HexStringToColor(TYPES[e.type].color).color : seen ? 0x7880a0 : 0x3a3e64;
      g.fillStyle(col, 1).fillRect(x, y, CW - 1, CH - 1);
      txt(this, x + 6, y + 2, caught || seen ? e.sym : '?', { size: 'xs', color: caught ? '#202030' : '#c0c4e0', shadow: null, align: 'center' });
    }
    // 분류 범례
    (Object.keys(TYPES) as TypeId[]).forEach((t, i) => {
      const x = OX + 28 + (i % 4) * 32, y = OY + 4 + Math.floor(i / 4) * 10;
      g.fillStyle(Phaser.Display.Color.HexStringToColor(TYPES[t].color).color, 1).fillRect(x, y + 1, 5, 5);
      txt(this, x + 7, y - 1, TYPES[t].short, { size: 'xs', color: '#c0c4e0', shadow: null });
    });

    const cursor = this.add.rectangle(0, 0, CW + 1, CH + 1).setOrigin(0).setStrokeStyle(2, 0xffffff);
    this.tweens.add({ targets: cursor, alpha: 0.4, duration: 400, yoyo: true, repeat: -1 });

    const pg = this.add.graphics();
    drawWindow(pg, 0, 76, W, 84);
    const info = this.add.container(0, 0);
    const box = new TextBox(this, pad);

    let cur = ELEMENTS[0];
    const render = () => {
      const { x, y } = cellPos(cur);
      cursor.setPosition(x - 1, y - 1);
      info.removeAll(true);
      const e = cur;
      const caught = G.caught.includes(e.z), seen = G.seen.includes(e.z);
      info.add(this.add.rectangle(8, 84, 68, 68, 0xdde0ee).setOrigin(0));
      if (seen) info.add(this.add.image(42, 118, caught ? `mon_${e.z}` : `monsil_${e.z}`));
      else info.add(txt(this, 42, 110, '?', { align: 'center' }));
      info.add(txt(this, 84, 84, `No.${String(e.z).padStart(3, '0')}  ${seen ? `${e.sym} ${e.name}` : '???'}`));
      if (seen) {
        info.add(txt(this, 84, 100, `${TYPES[e.type].name} · ${e.period}주기 ${e.group}족`, { size: 's', color: '#5a6a90', shadow: null }));
        const where = foundIn(e.z);
        info.add(txt(this, 84, 114, `서식지: ${where.join(', ') || '-'}`, { size: 's', wrap: 150 }));
      } else {
        info.add(txt(this, 84, 100, `${e.period}주기 ${e.group}족 자리`, { size: 's', color: '#5a6a90', shadow: null }));
        info.add(txt(this, 84, 114, '아직 만나지 못한 원소다.', { size: 's' }));
      }
      info.add(txt(this, 84, 138, caught ? 'Z: 자세히 보기' : seen ? '채집하면 자세한 정보가 열린다!' : '', { size: 'xs', color: '#d04838', shadow: null }));
    };
    render();

    void (async () => {
      for (;;) {
        const b = await pad.next();
        if (b === 'B' || b === 'START') { sfx('back'); return; }
        if (b === 'A') {
          if (G.caught.includes(cur.z)) { sfx('select'); await runScene(this, 'Summary', { z: cur.z }); }
          else if (G.seen.includes(cur.z)) await box.say('아직 채집하지 못했다. 채집하면 실생활 정보와 물성을 볼 수 있다!');
          continue;
        }
        const next = move(cur, b);
        if (next && next !== cur) { cur = next; sfx('move'); render(); }
      }
    })().then(() => this.events.emit('done'));
  }
}

function cellPos(e: ElementData) {
  return { x: OX + (e.group - 1) * CW, y: OY + (e.period - 1) * CH };
}

/** 방향키로 가장 가까운 칸 찾기 */
function move(cur: ElementData, b: string): ElementData | null {
  const dx = b === 'LEFT' ? -1 : b === 'RIGHT' ? 1 : 0;
  const dy = b === 'UP' ? -1 : b === 'DOWN' ? 1 : 0;
  if (!dx && !dy) return null;
  let best: ElementData | null = null, bestD = Infinity;
  for (const e of ELEMENTS) {
    const gx = e.group - cur.group, gy = e.period - cur.period;
    if (dx && Math.sign(gx) !== dx) continue;
    if (dy && Math.sign(gy) !== dy) continue;
    const d = dx ? Math.abs(gx) + Math.abs(gy) * 20 : Math.abs(gy) * 2 + Math.abs(gx);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}
