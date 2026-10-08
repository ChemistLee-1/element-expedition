import { makeCanvas, drawPattern } from './pixel';

// 12×12 아이콘: 채집 병, 힌트 전구, 하트(남은 기회)
export type IconId = 'flask' | 'hint' | 'heart' | 'heart_empty';

const ICONS: Record<IconId, { rows: string[]; pal: Record<string, string> }> = {
  flask: {
    rows: [
      '....oooo....',
      '....owwo....',
      '....owwo....',
      '....owwo....',
      '...owwwwo...',
      '..owwwwwwo..',
      '.owwwwwwwwo.',
      '.oggggggggo.',
      '.oggGggggGo.',
      '.ogggggGggo.',
      '..oggggggo..',
      '...oooooo...',
    ],
    pal: { o: '#283040', w: '#e8f0f8', g: '#68d898', G: '#b8f8d0' },
  },
  hint: {
    rows: [
      '...oooooo...',
      '..oyyyyyyo..',
      '.oyyWyyyyyo.',
      '.oyWyyyyyyo.',
      '.oyyyyyyyyo.',
      '.oyyyyyyyyo.',
      '..oyyyyyyo..',
      '...oyyyyo...',
      '...oooooo...',
      '...osssso...',
      '...oooooo...',
      '....oooo....',
    ],
    pal: { o: '#283040', y: '#f8d830', W: '#fffbe0', s: '#a0a8b8' },
  },
  heart: {
    rows: [
      '............',
      '.ooo...ooo..',
      'orrro.orrro.',
      'orWrrorrrro.',
      'orrrrrrrrro.',
      'orrrrrrrrro.',
      '.orrrrrrro..',
      '..orrrrro...',
      '...orrro....',
      '....oro.....',
      '.....o......',
      '............',
    ],
    pal: { o: '#283040', r: '#f04858', W: '#ffd0d8' },
  },
  heart_empty: {
    rows: [
      '............',
      '.ooo...ooo..',
      'ogggo.ogggo.',
      'ogggggogggo.',
      'ogggggggggo.',
      'ogggggggggo.',
      '.ogggggggo..',
      '..ogggggo...',
      '...ogggo....',
      '....ogo.....',
      '.....o......',
      '............',
    ],
    pal: { o: '#283040', g: '#c8c8d8' },
  },
};

export function drawIcon(id: IconId): HTMLCanvasElement {
  const { c, ctx } = makeCanvas(12, 12);
  const ic = ICONS[id];
  drawPattern(ctx, 0, 0, ic.rows, ic.pal);
  return c;
}

export const ICON_IDS = Object.keys(ICONS) as IconId[];
