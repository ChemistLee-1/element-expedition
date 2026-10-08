import { ELEMENTS, el, villageOf, villageMembers, VILLAGE_ORDER } from '../data/elements';
import { QUIZ } from '../data/quiz';
import { G } from './state';

// 자연 상태의 원소는 정체를 모르는 채로 나타난다.
// 그래서 모든 문제는 "이 원소는 무엇일까?" — 정답은 그 원소 자신이고, 보기는 원소 이름이다.

export interface Question {
  z: number;          // 정답 원소
  q: string;
  choices: string[];  // 섞인 보기 (원소 이름)
  answer: number;     // 정답 인덱스
  ex: string;         // 해설
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 오답 보기 3개: 같은 마을(같은 족) 원소를 먼저, 모자라면 이웃 마을에서 */
function distractors(z: number, not: number[] = []): number[] {
  const bad = new Set([z, ...not]);
  const v = villageOf(el(z));
  const same = shuffle(villageMembers(v).filter(x => !bad.has(x)));
  if (same.length >= 3) return same.slice(0, 3);
  const vi = VILLAGE_ORDER.indexOf(v);
  const near = shuffle(ELEMENTS.map(e => e.z).filter(x => !bad.has(x) && !same.includes(x)))
    .sort((a, b) => Math.abs(VILLAGE_ORDER.indexOf(villageOf(el(a))) - vi) - Math.abs(VILLAGE_ORDER.indexOf(villageOf(el(b))) - vi));
  return [...same, ...near].slice(0, 3);
}

function make(z: number, q: string, ex: string, not?: number[]): Question {
  const ids = shuffle([z, ...distractors(z, not)]);
  return { z, q, choices: ids.map(id => el(id).name), answer: ids.indexOf(z), ex };
}

/** 데이터로 자동으로 만드는 단서 문제 */
function clueQuestions(z: number): Question[] {
  const e = el(z);
  const latin = e.sym[0] !== e.en[0] ? ' 기호는 라틴어 이름에서 왔다.' : '';
  return [
    make(z, `이 원소의 원소 기호는 「${e.sym}」야. 무슨 원소일까?`, `${e.sym}는 ${e.name}(${e.en})의 원소 기호다.${latin}`),
    make(z, `이 원소는 주기율표 ${e.period}주기 ${e.group}족에 있어. 무슨 원소일까?`,
      `${e.period}주기 ${e.group}족의 원소는 ${e.name}, 원자 번호 ${e.z}번이다.`),
    make(z, `이 원소의 원자 번호는 ${e.z}번이야. 양성자가 ${e.z}개라는 뜻! 무슨 원소일까?`,
      `원자 번호 ${e.z}번은 ${e.name}이다. 원자 번호 = 양성자 수.`),
  ];
}

function lifeQuestion(z: number, i: number): Question {
  const item = QUIZ[z][i];
  return make(z, item.q, item.ex, item.not);
}

/** 이 원소의 문제 목록 (실생활 수수께끼 3개 → 단서 문제 3개 순) */
function poolSize(z: number) {
  return QUIZ[z].length + 3;
}
function questionAt(z: number, i: number): Question {
  const n = QUIZ[z].length;
  return i < n ? lifeQuestion(z, i) : clueQuestions(z)[i - n];
}

/** 만날 때마다 다른 문제가 나오도록 차례대로 낸다 */
export function nextQuestion(z: number): Question {
  const i = G.asked[z] ?? 0;
  G.asked[z] = i + 1;
  return questionAt(z, i % poolSize(z));
}

/** 트레이너 퀴즈 대결용: 실생활 문제 중 아무거나 */
export function randomLifeQuestion(z: number): Question {
  return lifeQuestion(z, Math.floor(Math.random() * QUIZ[z].length));
}

/** 검사용: 모든 문제 */
export function allQuestions(): Question[] {
  return ELEMENTS.flatMap(e => Array.from({ length: poolSize(e.z) }, (_, i) => questionAt(e.z, i)));
}
