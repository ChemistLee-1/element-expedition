import Phaser from 'phaser';
import { ELEMENTS } from '../data/elements';
import { AREAS } from '../data/areas';
import { drawElement, silhouette } from '../art/monsters';
import { drawTiles } from '../art/tiles';
import { drawCharacter, PLAYER_LOOK, type Look } from '../art/chars';
import { drawIcon, ICON_IDS } from '../art/icons';

export const tileKey = (ch: string, f = 0) => `tile_${ch.charCodeAt(0)}_${f}`;

/** 모든 그림을 코드로 생성해 텍스처로 등록한다 */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const tex = this.textures;

    for (const [ch, frames] of Object.entries(drawTiles())) {
      frames.forEach((c, f) => tex.addCanvas(tileKey(ch, f), c));
    }

    const addChar = (key: string, look: Look) => {
      const t = tex.addCanvas(key, drawCharacter(look))!;
      for (let i = 0; i < 9; i++) t.add(i, 0, i * 16, 0, 16, 16);
    };
    addChar('player', PLAYER_LOOK);
    for (const a of Object.values(AREAS)) for (const n of a.npcs) addChar(`npc_${n.id}`, n.look);

    for (const e of ELEMENTS) {
      const front = drawElement(e, false);
      tex.addCanvas(`mon_${e.z}`, front);
      tex.addCanvas(`monsil_${e.z}`, silhouette(front));
    }

    for (const id of ICON_IDS) tex.addCanvas(`icon_${id}`, drawIcon(id));

    this.scene.start('Title');
  }
}
