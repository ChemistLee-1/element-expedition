import type { Dir } from '../systems/state';
import { villageMembers, type VillageKey } from './elements';

// ── 타일 문자 ───────────────────────────────────────
//  .  풀밭           ,  긴 풀(자연 원소)    =  흙길          f  꽃
//  #  나무(막힘)     ~  물(막힘)            s  모래          :  해초 모래(자연 원소)
//  R  지붕(막힘)     W  벽(막힘)            D  문(부딪히면 이벤트)
//  B  표지판(막힘)   F  울타리(막힘)
//  r  암벽(막힘)     c  동굴 바닥           x  광석 자갈(자연 원소)
//  l  용암(막힘)     a  화산재 땅           A  유황 바위밭(자연 원소)
//  K  빌딩(막힘)     N  네온 간판(막힘)     p  보도           q  네온 골목(자연 원소)
export const BLOCKING = new Set(['#', '~', 'R', 'W', 'D', 'B', 'F', 'r', 'l', 'K', 'N']);
export const ENCOUNTER_TILES = new Set([',', ':', 'x', 'A', 'q']);

export interface Encounter { z: number; w: number }  // w = 출현 가중치

export interface Warp { x: number; y: number; to: string; tx: number; ty: number }

export interface Npc {
  id: string;
  x: number;
  y: number;
  dir: Dir;
  look: { hair: string; shirt: string; skin?: string };
  name: string;
  lines: string[];
  /** 문지기: 이 마을 원소를 모두 채집하면 open 위치로 비켜 선다 */
  gate?: { open: { x: number; y: number }; next: string };
  /** 처음 말을 걸면 힌트 전구를 준다 */
  gift?: { hints: number; lines: string[] };
  /** 퀴즈 대결: 이 마을 원소 문제 3개 중 2개 이상 맞히면 승리, 힌트 전구 reward 개 */
  trainer?: { win: string[]; reward: number };
}

export interface Door { x: number; y: number; lines: string[]; lab?: boolean; save?: boolean }
export interface Sign { x: number; y: number; lines: string[] }

export type Theme = 'town' | 'forest' | 'beach' | 'mine' | 'volcano' | 'city';

export interface Area {
  id: VillageKey;
  name: string;     // 마을 이름
  group: string;    // 'n족'
  temp: number;     // K
  theme: Theme;     // 퀴즈 화면 배경
  ground?: string;  // 표지판 아래에 깔 바닥 타일 (기본 '.')
  bgm: string;
  map: string[];
  encTile: string;  // 자연 원소가 나오는 타일
  encounters: Partial<Record<string, Encounter[]>>;
  warps: Warp[];
  npcs: Npc[];
  doors: Door[];
  signs: Sign[];
}

type AreaDef = Omit<Area, 'encounters'>;

// 오른쪽(동쪽)으로 갈수록 족 번호가 커진다 — 주기율표를 왼쪽에서 오른쪽으로 여행!
// 모든 마을은 y=6 줄의 서쪽(x=0)·동쪽(x=19) 끝으로 이어진다.
const east = (to: string) => ({ x: 19, y: 6, to, tx: 1, ty: 6 });
const west = (to: string) => ({ x: 0, y: 6, to, tx: 18, ty: 6 });

const guard = (id: string, next: string, look: Npc['look'], openTo: { x: number; y: number }): Npc => ({
  id, x: 18, y: 6, dir: 'left', name: '문지기', look, lines: [], gate: { open: openTo, next },
});

const DEFS: AreaDef[] = [
  {
    id: 'g1', name: '알칼리 금속 마을', group: '1족', temp: 293, theme: 'town', bgm: 'town', encTile: ',',
    map: [
      '####################',
      '#..RRRRR....RRRR...#',
      '#..RRRRR....RRRR...#',
      '#..WWDWW....WWDW...#',
      '#....=........=....#',
      '#....==========....#',
      '#....=........======',
      '#,,,,=,,,,.....ff..#',
      '#,,,,=,,,,..~~~~...#',
      '#,,,,=,,,,..~~~~.B.#',
      '#,,,,,,,,,......f..#',
      '#ff.............ff.#',
      '####################',
    ],
    warps: [east('g2')],
    npcs: [
      { id: 'prof', x: 7, y: 4, dir: 'down', name: '주기 박사', look: { hair: '#e8e8e8', shirt: '#f8f8f8' },
        lines: ['주기 박사: 이 지역은 주기율표처럼 1족부터 18족까지 마을이 동쪽으로 이어져 있단다.',
          '마을마다 그 족의 원소들이 자연 상태로 숨어 있지. 풀숲을 걸어 보렴!',
          '자연 상태의 원소는 정체를 알 수 없어. 문제를 맞혀야 어떤 원소인지 밝혀지고 채집할 수 있단다.'] },
      { id: 'kid', x: 10, y: 10, dir: 'left', name: '어린이', look: { hair: '#5a3a20', shirt: '#4ab0e0' },
        lines: ['어린이: 그거 알아? 수소도 1족이래!', '그런데 수소는 금속이 아니야. 1족에서 혼자만 기체야!'] },
      guard('guard_g1', '2족 · 알칼리 토금속 마을', { hair: '#3a3a3a', shirt: '#e8a030' }, { x: 18, y: 5 }),
    ],
    doors: [
      { x: 5, y: 3, lines: ['주기 연구소에 들어갔다.'], lab: true },
      { x: 14, y: 3, lines: ['우리 집이다.', '…따뜻한 집에서 푹 쉬었다. 모험 기록을 저장했다!'], save: true },
    ],
    signs: [{ x: 17, y: 9, lines: ['1족 · 알칼리 금속 마을', '사는 원소: 4종 (1족)', '→ 동쪽: 2족 마을'] }],
  },
  {
    id: 'g2', name: '알칼리 토금속 마을', group: '2족', temp: 300, theme: 'beach', bgm: 'route', encTile: ':', ground: 's',
    map: [
      '####################',
      '#..ffff......ffff..#',
      '#..................#',
      '#..sss::::sss::::..#',
      '#.ss::::::ss::::::.#',
      '#.ss::B:::ss::::::.#',
      '====================',
      '#sssss::::sss::::ss#',
      '#sss::::::sss::::ss#',
      '#ssssssssssssssssss#',
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~',
    ],
    warps: [west('g1'), east('g3_12')],
    npcs: [
      { id: 'shell', x: 10, y: 2, dir: 'down', name: '조개 줍는 아이', look: { hair: '#2a2a2a', shirt: '#f07878' },
        lines: ['조개 줍는 아이: 조개껍데기는 단단하지? 2족 원소가 들어 있어서 그래!'],
        gift: { hints: 3, lines: ['이 힌트 전구 줄게. 문제가 어려우면 써 봐!'] } },
      { id: 'tr_g2', x: 3, y: 8, dir: 'up', name: '수영부 하늘', look: { hair: '#202020', shirt: '#50c070' },
        lines: ['하늘: 2족 원소 퀴즈로 대결하자!'],
        trainer: { win: ['하늘: 우와, 2족 원소를 잘 아는구나!', '2족 원소는 최외각 전자가 2개라서 성질이 비슷하대.'], reward: 2 } },
      guard('guard_g2', '3~12족 · 전이 금속 마을', { hair: '#1a1a1a', shirt: '#4a4a8a' }, { x: 18, y: 5 }),
    ],
    doors: [],
    signs: [{ x: 6, y: 5, lines: ['2족 · 알칼리 토금속 마을', '조개껍데기와 바닷물 속에 2족 원소가 숨어 있다.'] }],
  },
  {
    id: 'g3_12', name: '전이 금속 마을', group: '3~12족', temp: 288, theme: 'mine', bgm: 'cave', encTile: 'x', ground: 'c',
    map: [
      'rrrrrrrrrrrrrrrrrrrr',
      'rxxxxccrrrrrrccxxxxr',
      'rxxxxcccxxxxcccxxxxr',
      'rccrrcccxxxxcccrrccr',
      'rccrrccrrrrrrccrrccr',
      'rxxxxccrxxxxrccxxxxr',
      'cccccccccxxccccccccc',
      'rxxxxccrxxxxrccxxxxr',
      'rrrrrccrrxxrrccrrrrr',
      'rxxxxccccccccccxxxxr',
      'rxxxxccrrccrrccxxxxr',
      'rrrrrrrrrrrrrrrrrrrr',
    ],
    warps: [west('g2'), east('g13')],
    npcs: [
      { id: 'miner', x: 6, y: 9, dir: 'down', name: '광부', look: { hair: '#f0c030', shirt: '#7a5a3a' },
        lines: ['광부: 여기는 3족부터 12족까지, 전이 금속 10종이 모여 사는 광산이야!',
          '우리 생활에 쓰이는 금속은 대부분 여기 있지.'],
        gift: { hints: 3, lines: ['광부: 원소가 10종이나 돼서 헷갈릴 거야. 힌트 전구를 가져가!'] } },
      { id: 'tr_g3', x: 13, y: 9, dir: 'left', name: '견습 광부 준호', look: { hair: '#3a2a1a', shirt: '#c06030' },
        lines: ['준호: 전이 금속 퀴즈, 맞힐 수 있겠어?'],
        trainer: { win: ['준호: 크윽… 금속 박사가 나타났구나!'], reward: 2 } },
      guard('guard_g3', '13족 · 붕소족 마을', { hair: '#5a4a3a', shirt: '#e8c040' }, { x: 18, y: 5 }),
    ],
    doors: [],
    signs: [],
  },
  {
    id: 'g13', name: '붕소족 마을', group: '13족', temp: 298, theme: 'city', bgm: 'town', encTile: 'q', ground: 'p',
    map: [
      'KKKKKKKKKKKKKKKKKKKK',
      'KKNNKKqqqppqqqKKNNKK',
      'KKKKKKqqqppqqqKKKKKK',
      'KppppppppppppppppppK',
      'KpqqqqppKKKKppqqqqpK',
      'KpqqqqppKKDKppqqqqpK',
      'pppppppppppppppppppp',
      'KpqqqqppppppppqqqqpK',
      'KpqqqqppppppppqqqqpK',
      'KKKKKKKKKKKKKKKKKKKK',
    ],
    warps: [west('g3_12'), east('g14')],
    npcs: [
      { id: 'engineer', x: 9, y: 3, dir: 'down', name: '공장장', look: { hair: '#e0e0e0', shirt: '#3a3a3a' },
        lines: ['공장장: 여긴 13족 공업 단지! 캔, LED, 내열 유리를 만들지.',
          '13족 원소는 최외각 전자가 3개란다.'],
        gift: { hints: 3, lines: ['공장장: 이 힌트 전구도 공장에서 만든 거야. 가져가렴!'] } },
      guard('guard_g13', '14족 · 탄소족 마을', { hair: '#2a4a8a', shirt: '#f0f0f0' }, { x: 18, y: 7 }),
    ],
    doors: [{ x: 10, y: 5, lines: ['원소 연구 센터에 들어갔다.', '연구원: 탐험 기록을 저장해 드릴게요!', '모험 기록을 저장했다!'], save: true }],
    signs: [],
  },
  {
    id: 'g14', name: '탄소족 마을', group: '14족', temp: 291, theme: 'forest', bgm: 'route', encTile: ',',
    map: [
      '####################',
      '#,,,,###....###,,,,#',
      '#,,,,,##....##,,,,,#',
      '#,,,,,,......,,,,,,#',
      '##..##..B.......####',
      '#..##............#.#',
      '====================',
      '#,,,..##....##..,,,#',
      '#,,,,.##....##.,,,,#',
      '#,,,,,,..ff..,,,,,,#',
      '##ff............ff##',
      '####################',
    ],
    warps: [west('g13'), east('g15')],
    npcs: [
      { id: 'botanist', x: 10, y: 3, dir: 'down', name: '식물학자', look: { hair: '#8a5a2a', shirt: '#7a9a3a' },
        lines: ['식물학자: 14족은 최외각 전자가 4개야. 다른 원자와 여러 방향으로 결합할 수 있지.',
          '그래서 생명의 뼈대도, 컴퓨터 칩도 14족 원소로 만든단다.'] },
      { id: 'tr_g14', x: 10, y: 5, dir: 'down', name: '화학 동아리 서연', look: { hair: '#6a3a8a', shirt: '#d0a040' },
        lines: ['서연: 탄소족 퀴즈에 도전해 볼래?'],
        trainer: { win: ['서연: 대단해! 14족에는 비금속과 준금속이 함께 있어.'], reward: 2 } },
      guard('guard_g14', '15족 · 질소족 마을', { hair: '#3a2a1a', shirt: '#80a050' }, { x: 18, y: 5 }),
    ],
    doors: [],
    signs: [{ x: 8, y: 4, lines: ['14족 · 탄소족 숲 마을', '사는 원소: 3종 (14족)'] }],
  },
  {
    id: 'g15', name: '질소족 마을', group: '15족', temp: 293, theme: 'forest', bgm: 'route', encTile: ',',
    map: [
      '####################',
      '#FFFFFFF....FFFFFFF#',
      '#F,,,,,F....F,,,,,F#',
      '#F,,,,,F....F,,,,,F#',
      '#F,,,,,..B.....,,,F#',
      '#FFFFFFF....FFFFFFF#',
      '====================',
      '#..RRRR......ff....#',
      '#..WDWW....,,,,,,..#',
      '#.....,,,,,,,,,,,..#',
      '#ff..,,,,,,,,,,,ff.#',
      '####################',
    ],
    warps: [west('g14'), east('g16')],
    npcs: [
      { id: 'farmer', x: 9, y: 7, dir: 'down', name: '농부', look: { hair: '#c08040', shirt: '#4a7ac0' },
        lines: ['농부: 식물이 잘 자라려면 비료의 3대 영양소가 필요하지. 그중 둘이 15족 원소야!'],
        gift: { hints: 3, lines: ['농부: 수확한 힌트 전구를 나눠 줄게!'] } },
      guard('guard_g15', '16족 · 산소족 마을', { hair: '#2a2a2a', shirt: '#a06030' }, { x: 18, y: 7 }),
    ],
    doors: [{ x: 4, y: 8, lines: ['비료 창고다.', '비료 포대에 "N-P-K" 숫자가 적혀 있다. 3대 영양소의 비율이다.'] }],
    signs: [{ x: 9, y: 4, lines: ['15족 · 질소족 농장 마을', '사는 원소: 3종 (15족)'] }],
  },
  {
    id: 'g16', name: '산소족 마을', group: '16족', temp: 600, theme: 'volcano', bgm: 'cave', encTile: 'A', ground: 'a',
    map: [
      'llllllllllllllllllll',
      'lAAAAaaallllaaaAAAAl',
      'lAAAAaaaallaaaaAAAAl',
      'laaaaaaBaaaaaaaaaaal',
      'lllaaAAAlllAAAaaalll',
      'lAAaaAAAlllAAAaaAAAl',
      'aaaaaaaaaaaaaaaaaaaa',
      'lAAAaaaaaaaaaaaAAAAl',
      'lAAAAaaalllaaaAAAAAl',
      'llllllllllllllllllll',
    ],
    warps: [west('g15'), east('g17')],
    npcs: [
      { id: 'volcanologist', x: 12, y: 3, dir: 'down', name: '화산학자', look: { hair: '#c0c0c0', shirt: '#c04030' },
        lines: ['화산학자: 여긴 600 K, 약 327 ℃야! 녹는점보다 뜨거우면 액체, 끓는점보다 뜨거우면 기체가 되지.',
          '화산 가스에는 16족 원소가 잔뜩 들어 있다네.'],
        gift: { hints: 3, lines: ['화산학자: 이 힌트 전구를 가져가게.'] } },
      { id: 'tr_g16', x: 4, y: 7, dir: 'up', name: '지질학자 도윤', look: { hair: '#2a4a8a', shirt: '#f0f0f0' },
        lines: ['도윤: 화산의 16족 원소 퀴즈, 받아 봐!'],
        trainer: { win: ['도윤: 훌륭해! 16족은 최외각 전자가 6개라서 전자 2개를 얻으려 한대.'], reward: 2 } },
      guard('guard_g16', '17족 · 할로젠 마을', { hair: '#6a3a1a', shirt: '#e8a030' }, { x: 18, y: 7 }),
    ],
    doors: [],
    signs: [{ x: 7, y: 3, lines: ['16족 · 산소족 화산 마을', '경고! 기온 600 K (약 327 ℃)'] }],
  },
  {
    id: 'g17', name: '할로젠 마을', group: '17족', temp: 305, theme: 'beach', bgm: 'route', encTile: ':', ground: 's',
    map: [
      '####################',
      '#ss~~~ss~~~ss~~~sss#',
      '#ss~~~ss~~~ss~~~sss#',
      '#ssssssssssssssssss#',
      '#s::::ss::::ss::::s#',
      '#s::::ss::B:ss::::s#',
      'ssssssssssssssssssss',
      '#s::::ss::::ss::::s#',
      '#ss~~~ss~~~ss~~~sss#',
      '#ssssssssssssssssss#',
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~',
    ],
    warps: [west('g16'), east('g18')],
    npcs: [
      { id: 'saltworker', x: 3, y: 3, dir: 'down', name: '염전 일꾼', look: { hair: '#2a2a2a', shirt: '#3a7ac0' },
        lines: ['염전 일꾼: 바닷물을 말려서 소금을 얻는 곳이 염전이야.',
          '할로젠은 "소금을 만드는 것"이라는 뜻이래. 금속과 만나면 소금(염)을 만들거든!'] },
      guard('guard_g17', '18족 · 비활성 기체 마을', { hair: '#1a1a1a', shirt: '#c8e86a' }, { x: 18, y: 5 }),
    ],
    doors: [],
    signs: [{ x: 10, y: 5, lines: ['17족 · 할로젠 염전 마을', '여름 기온 32 ℃ (305 K)'] }],
  },
  {
    id: 'g18', name: '비활성 기체 마을', group: '18족', temp: 298, theme: 'city', bgm: 'town', encTile: 'q', ground: 'p',
    map: [
      'KKKKKKKKKKKKKKKKKKKK',
      'KKNNKKqqqppqqqKKNNKK',
      'KKKKKKqqqppqqqKKKKKK',
      'KppppppppppppppppppK',
      'KpqqqqppKKKKppqqqqpK',
      'KpqqqqppKNNKppqqqqpK',
      'pppppppppKDKpppppppK',
      'KpqqqqppppppppqqqqpK',
      'KpqqqqppppppppqqqqpK',
      'KKKKKKKKKKKKKKKKKKKK',
    ],
    warps: [west('g17')],
    npcs: [
      { id: 'researcher', x: 15, y: 3, dir: 'down', name: '네온사인 장인', look: { hair: '#f070c0', shirt: '#303050' },
        lines: ['네온사인 장인: 18족 원소는 전자 껍질이 꽉 차 있어서 거의 반응하지 않아.',
          '그래서 간판이나 전구 속을 채우는 데 딱 좋지!'],
        gift: { hints: 3, lines: ['네온사인 장인: 반짝이는 힌트 전구를 줄게!'] } },
      { id: 'tr_g18', x: 17, y: 7, dir: 'left', name: '연구원 지우', look: { hair: '#2a4a8a', shirt: '#f0f0f0' },
        lines: ['지우: 주기율표의 끝, 18족에 온 걸 환영해. 마지막 퀴즈 대결이야!'],
        trainer: { win: ['지우: 훌륭해! 너라면 36종 도감을 완성할 수 있을 거야.'], reward: 3 } },
      { id: 'final', x: 3, y: 3, dir: 'down', name: '안내원', look: { hair: '#e8e8e8', shirt: '#e86838' },
        lines: ['안내원: 여기가 주기율표의 오른쪽 끝, 18족이야.', '36종을 모두 모았다면 1족 마을의 주기 박사님께 가 봐!'] },
    ],
    doors: [{ x: 10, y: 6, lines: ['원소 연구 센터에 들어갔다.', '연구원: 탐험 기록을 저장해 드릴게요!', '모험 기록을 저장했다!'], save: true }],
    signs: [],
  },
];

export const AREAS: Record<string, Area> = Object.fromEntries(DEFS.map(d => [d.id, {
  ...d,
  encounters: { [d.encTile]: villageMembers(d.id).map(z => ({ z, w: 1 })) },
}]));

export function tileAt(area: Area, x: number, y: number): string {
  if (y < 0 || y >= area.map.length) return '#';
  const row = area.map[y];
  if (x < 0 || x >= row.length) return '#';
  return row[x];
}
