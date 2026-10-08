// 게임 진행 상황. localStorage 에 저장한다.
// 레벨·HP 같은 육성 요소는 없다. 목표는 36종 원소 도감 완성!
export interface GameState {
  version: 3;
  seen: number[];
  caught: number[];
  hints: number;     // 힌트 전구 (오답 2개 지우기)
  correct: number;   // 지금까지 맞힌 문제 수
  wrong: number;     // 지금까지 틀린 문제 수
  asked: Record<number, number>; // 원소별로 몇 번째 문제까지 냈는지 (다음엔 다른 문제)
  hintsUsed?: number;  // 사용한 힌트 전구 수 (엔딩 기록용)
  playerName?: string; // 수료증에 적을 이름
  map: string;
  x: number;
  y: number;
  dir: Dir;
  flags: Record<string, boolean>;
  steps: number;
}

export type Dir = 'down' | 'up' | 'left' | 'right';

const KEY = 'element-quest-save-v3';

export function newGame(): GameState {
  return {
    version: 3,
    seen: [],
    caught: [],
    hints: 3,
    correct: 0,
    wrong: 0,
    asked: {},
    map: 'g1',
    x: 5,
    y: 4,
    dir: 'down',
    flags: {},
    steps: 0,
  };
}

/** 현재 게임 상태 (씬끼리 공유하는 단 하나의 객체) */
export let G: GameState = newGame();

export function setState(s: GameState) {
  G = s;
}

export function hasSave(): boolean {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
}

export function save(): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(G));
    return true;
  } catch {
    return false;
  }
}

export function load(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as GameState;
    if (s.version !== 3) return false;
    G = s;
    return true;
  } catch {
    return false;
  }
}

export function markSeen(z: number) {
  if (!G.seen.includes(z)) G.seen.push(z);
}
export function markCaught(z: number) {
  markSeen(z);
  if (!G.caught.includes(z)) G.caught.push(z);
}

/** 타이틀 화면용: 저장 기록을 불러오지 않고 살짝 들여다보기 */
export function peekSave(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    return s.version === 3 ? s : null;
  } catch {
    return null;
  }
}
