import { makeCanvas, px, rng, drawPattern } from './pixel';

// 16×16 맵 타일을 코드로 그린다. 반환: 타일 문자 → 캔버스 (물/용암은 2프레임)

const T = 16;
type Ctx = CanvasRenderingContext2D;

function speckle(ctx: Ctx, base: string, dots: [string, number][], seed: number) {
  px(ctx, 0, 0, base, T, T);
  const r = rng(seed);
  for (const [col, n] of dots) for (let i = 0; i < n; i++) px(ctx, Math.floor(r() * T), Math.floor(r() * T), col);
}

const grass = (ctx: Ctx, seed = 7) => {
  speckle(ctx, '#78c850', [['#60b040', 10], ['#98d870', 6]], seed);
  // GBA 풍 풀 무늬
  for (const [x, y] of [[3, 4], [11, 10], [6, 13]]) { px(ctx, x, y, '#58a038'); px(ctx, x + 2, y, '#58a038'); px(ctx, x + 1, y - 1, '#58a038'); }
};

const DRAW: Record<string, (ctx: Ctx, frame: number) => void> = {
  '.': ctx => grass(ctx),
  ',': ctx => {
    px(ctx, 0, 0, '#4a9a38', T, T);
    for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) {
      const ox = bx * 8, oy = by * 8;
      drawPattern(ctx, ox, oy, [
        '........',
        '.g...g..',
        '.gG.gG..',
        'gGGgGG.g',
        'GGdGGdgG',
        'GddGddGG',
        'dDDdDDdd',
        'DDDDDDDD',
      ], { g: '#a8e070', G: '#70c048', d: '#3a8028', D: '#2a6020' });
    }
  },
  '=': ctx => speckle(ctx, '#d8c088', [['#c0a868', 14], ['#e8d8a8', 8]], 3),
  'f': ctx => {
    grass(ctx, 11);
    for (const [x, y, c] of [[3, 3, '#f05858'], [10, 5, '#f8f8f8'], [6, 10, '#f8d030'], [12, 12, '#f05858']] as [number, number, string][]) {
      px(ctx, x - 1, y, c); px(ctx, x + 1, y, c); px(ctx, x, y - 1, c); px(ctx, x, y + 1, c); px(ctx, x, y, '#f8f080');
    }
  },
  '#': ctx => {
    grass(ctx, 5);
    drawPattern(ctx, 0, 0, [
      '.....oooooo.....',
      '...ooGGGGGGoo...',
      '..oGGgggGGGGGo..',
      '.oGGgggGGGGGGGo.',
      '.oGgggGGGGGGdGo.',
      'oGGggGGGGGGGdGGo',
      'oGGGGGGGGGGdGGGo',
      'oGGGGGGGGGdGGGdo',
      'oGGGGGGGGdGGGddo',
      '.oGGGGGGGGGGddo.',
      '.oddGGGGGGGdddo.',
      '..oddddddddddo..',
      '...ooodttdooo...',
      '......otto......',
      '......otto......',
      '.....oottoo.....',
    ], { o: '#204820', G: '#40a040', g: '#68c860', d: '#2a7a2a', t: '#7a5030' });
  },
  '~': (ctx, f) => {
    px(ctx, 0, 0, '#4890e0', T, T);
    const o = f * 4;
    for (const [x, y] of [[2, 3], [10, 7], [4, 11], [12, 14]]) {
      px(ctx, (x + o) % T, y, '#88c0f8', 3, 1);
      px(ctx, (x + o + 3) % T, y - 1, '#88c0f8', 2, 1);
    }
  },
  's': ctx => speckle(ctx, '#f0d898', [['#e0c078', 14], ['#f8e8b8', 8]], 9),
  ':': ctx => {
    speckle(ctx, '#e8d090', [['#d8b870', 10]], 13);
    drawPattern(ctx, 0, 0, [
      '................',
      '..k.............',
      '.kK.k.......k...',
      '.kKkK......kK.k.',
      '..KkK.....kKkK..',
      '..KK......kKK...',
      '...........K....',
      '................',
      '.......k........',
      '......kK.k......',
      '......KkkK...k..',
      '.......KK...kK..',
      '............KK..',
      '..k.............',
      '..Kk............',
      '................',
    ], { k: '#58a058', K: '#3a7a40' });
  },
  'R': ctx => {
    px(ctx, 0, 0, '#d05848', T, T);
    for (let y = 0; y < T; y += 4) {
      px(ctx, 0, y + 3, '#a03830', T, 1);
      for (let x = (y / 4) % 2 ? 0 : 4; x < T; x += 8) px(ctx, x, y, '#a03830', 1, 3);
    }
    px(ctx, 0, 0, '#e88878', T, 1);
  },
  'W': ctx => {
    px(ctx, 0, 0, '#f0e8d8', T, T);
    px(ctx, 0, 15, '#c0b098', T, 1);
    px(ctx, 4, 4, '#5a6a88', 8, 7);
    px(ctx, 5, 5, '#88b8e8', 6, 5);
    px(ctx, 5, 5, '#c8e0f8', 2, 2);
    px(ctx, 7, 5, '#5a6a88', 1, 5);
  },
  'D': ctx => {
    px(ctx, 0, 0, '#f0e8d8', T, T);
    px(ctx, 3, 2, '#5a3a20', 10, 14);
    px(ctx, 4, 3, '#9a6a3a', 8, 13);
    px(ctx, 10, 9, '#f8d030', 1, 2);
    px(ctx, 4, 3, '#b88048', 8, 1);
  },
  'B': ctx => {
    px(ctx, 7, 9, '#5a3a20', 2, 7);
    px(ctx, 2, 2, '#5a3a20', 12, 8);
    px(ctx, 3, 3, '#c09058', 10, 6);
    px(ctx, 4, 4, '#7a5030', 8, 1);
    px(ctx, 4, 6, '#7a5030', 6, 1);
  },
  'F': ctx => {
    grass(ctx, 23);
    px(ctx, 0, 5, '#f8f8f8', T, 2);
    px(ctx, 0, 10, '#f8f8f8', T, 2);
    for (const x of [2, 10]) { px(ctx, x, 3, '#f8f8f8', 2, 11); px(ctx, x + 1, 3, '#b8b8c8', 1, 11); }
  },
  'r': ctx => {
    speckle(ctx, '#5e4e40', [['#4a3a2e', 18], ['#76665a', 8]], 31);
    px(ctx, 0, 0, '#8a7a68', T, 2);
    px(ctx, 0, 14, '#2e241c', T, 2);
    px(ctx, 5, 4, '#4a3a30', 1, 5); px(ctx, 6, 8, '#4a3a30', 3, 1); px(ctx, 11, 9, '#4a3a30', 1, 4);
  },
  'c': ctx => speckle(ctx, '#b0a080', [['#988868', 16], ['#c8b898', 6]], 37),
  'x': ctx => {
    speckle(ctx, '#a89878', [['#887858', 20]], 41);
    const r = rng(43);
    const ores = ['#d8834a', '#8a8c94', '#6ac87a', '#c8d4e0', '#2a4ad0'];
    for (let i = 0; i < 7; i++) {
      const x = 1 + Math.floor(r() * 13), y = 1 + Math.floor(r() * 13);
      const col = ores[i % ores.length];
      px(ctx, x, y, '#4a3a30', 3, 2); px(ctx, x, y, col, 2, 1);
    }
  },
  'l': (ctx, f) => {
    px(ctx, 0, 0, '#e05020', T, T);
    const r = rng(51 + f);
    for (let i = 0; i < 10; i++) px(ctx, Math.floor(r() * 15), Math.floor(r() * 15), '#f8a030', 2, 1);
    for (let i = 0; i < 4; i++) px(ctx, Math.floor(r() * 15), Math.floor(r() * 15), '#f8e060', 1, 1);
    px(ctx, 0, 0, '#a03010', T, 1);
  },
  'a': ctx => speckle(ctx, '#8a7a72', [['#6a5a52', 16], ['#a8988e', 6]], 61),
  'A': ctx => {
    speckle(ctx, '#7a6a62', [['#5a4a42', 14]], 63);
    drawPattern(ctx, 0, 0, [
      '................',
      '..o.............',
      '.oYo.......o....',
      '.oYyo.....oYo...',
      'oYYyo....oYyYo..',
      'ooooo....ooooo..',
      '................',
      '........o.......',
      '.......oYo......',
      '......oYYyo.....',
      '......ooooo.....',
      '...o.........o..',
      '..oYo.......oYo.',
      '.oYyyo.....oYyo.',
      '.ooooo.....oooo.',
      '................',
    ], { o: '#7a6010', Y: '#f8e050', y: '#d0b030' });
  },
  'K': ctx => {
    px(ctx, 0, 0, '#4a4a70', T, T);
    const r = rng(71);
    for (let y = 2; y < T; y += 5) for (let x = 2; x < T; x += 5) px(ctx, x, y, r() > 0.45 ? '#f8e080' : '#2a2a48', 3, 3);
    px(ctx, 0, 0, '#6a6a98', T, 1);
  },
  'N': (ctx, f) => {
    px(ctx, 0, 0, '#2a2440', T, T);
    const c1 = f ? '#f070c0' : '#ff98d8', c2 = f ? '#60e0f0' : '#a0f0ff';
    px(ctx, 2, 3, c1, 12, 1); px(ctx, 2, 3, c1, 1, 4); px(ctx, 13, 3, c1, 1, 4);
    px(ctx, 4, 9, c2, 8, 1); px(ctx, 4, 12, c2, 8, 1); px(ctx, 7, 9, c2, 1, 4);
  },
  'p': ctx => {
    px(ctx, 0, 0, '#a0a0b0', T, T);
    px(ctx, 0, 7, '#8a8a9a', T, 1); px(ctx, 0, 15, '#8a8a9a', T, 1);
    px(ctx, 7, 0, '#8a8a9a', 1, 7); px(ctx, 15, 8, '#8a8a9a', 1, 7);
  },
  'q': (ctx, f) => {
    px(ctx, 0, 0, '#3a3454', T, T);
    px(ctx, 0, 7, '#2a2440', T, 1); px(ctx, 7, 0, '#2a2440', 1, T);
    const r = rng(81);
    const cols = ['#f070c0', '#60e0f0', '#f8e060', '#a080f8'];
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(r() * 14), y = Math.floor(r() * 14);
      if ((i + f) % 2 === 0) px(ctx, x, y, cols[i % 4], 2, 1);
    }
  },
};

export const ANIMATED = new Set(['~', 'l', 'N', 'q']);

export function drawTiles(): Record<string, HTMLCanvasElement[]> {
  const out: Record<string, HTMLCanvasElement[]> = {};
  for (const [ch, fn] of Object.entries(DRAW)) {
    const frames = ANIMATED.has(ch) ? 2 : 1;
    out[ch] = [];
    for (let f = 0; f < frames; f++) {
      const { c, ctx } = makeCanvas(T, T);
      fn(ctx, f);
      out[ch].push(c);
    }
  }
  return out;
}
