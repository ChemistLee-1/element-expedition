import { makeCanvas, drawPattern, shade } from './pixel';

// 16×16 사람 캐릭터. 프레임 순서: [아래 서기, 아래 걷기A, 아래 걷기B, 위 ×3, 왼쪽 ×3] (오른쪽은 좌우 반전)

const HEAD_DOWN = [
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...oHssssssHo...',
  '...ossessesso...',
  '...osssssssso...',
  '....oossssoo....',
];
const BODY_DOWN = [
  '...owccccccwo...',
  '..owwccccccwwo..',
  '..oswccccccwso..',
  '...owwwwwwwwo...',
];
const HEAD_UP = [
  '................',
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...oHhhhhhhHo...',
  '...oHHhhhhHHo...',
  '....oossssoo....',
];
const BODY_UP = [
  '...owwwwwwwwo...',
  '..owwwwwwwwwwo..',
  '..oswwwwwwwwso..',
  '...owwwwwwwwo...',
];
const HEAD_LEFT = [
  '................',
  '......ooooo.....',
  '.....ohhhhho....',
  '....ohhhhhhho...',
  '....ohhhhhhho...',
  '....osssHhhho...',
  '....oesshhhho...',
  '....osssshhho...',
  '.....oossso.....',
];
const BODY_LEFT = [
  '.....occcwo.....',
  '....owcccwwo....',
  '....owscccwo....',
  '....owwwwwwo....',
];
const LEGS_FRONT = [
  ['....oppooppo....', '....obboobbo....', '................'],
  ['....oppooppo....', '....obbo.ooo....', '................'],
  ['....oppooppo....', '....ooo.obbo....', '................'],
];
const LEGS_SIDE = [
  ['......oppo......', '......obbo......', '................'],
  ['.....opppo......', '.....ob.bo......', '................'],
  ['......oppo......', '.....obbbo......', '................'],
];

export interface Look { hair: string; shirt: string; skin?: string; coat?: string }

export function drawCharacter(look: Look): HTMLCanvasElement {
  const { c, ctx } = makeCanvas(16 * 9, 16);
  const pal: Record<string, string> = {
    o: '#283040',
    h: look.hair,
    H: shade(look.hair, -0.3),
    s: look.skin ?? '#f8d0a8',
    e: '#283040',
    c: look.shirt,
    w: look.coat ?? shade(look.shirt, -0.15),
    p: '#40507a',
    b: '#4a3028',
  };
  const sets: [string[], string[], string[][]][] = [
    [HEAD_DOWN, BODY_DOWN, LEGS_FRONT],
    [HEAD_UP, BODY_UP, LEGS_FRONT],
    [HEAD_LEFT, BODY_LEFT, LEGS_SIDE],
  ];
  sets.forEach(([head, body, legs], d) => {
    for (let f = 0; f < 3; f++) {
      const bob = f === 0 ? 0 : -1;
      const rows = [...head, ...body, ...legs[f].slice(0, 2)];
      drawPattern(ctx, (d * 3 + f) * 16, 1 + bob, rows, pal);
    }
  });
  return c;
}

export const PLAYER_LOOK: Look = { hair: '#6a3a20', shirt: '#e86838', coat: '#f8f8f8' };
