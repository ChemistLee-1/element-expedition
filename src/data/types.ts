// 원소 분류 = 게임 타입. 1~36번에는 란타넘족/악티늄족이 없으므로 8타입.
export type TypeId =
  | 'alkali' | 'alkaline' | 'transition' | 'post'
  | 'metalloid' | 'nonmetal' | 'halogen' | 'noble';

export interface TypeInfo {
  id: TypeId;
  name: string;   // 한글 이름
  short: string;  // 2글자 약칭 (UI 배지용)
  color: string;  // 주기율표 칸 색
}

export const TYPES: Record<TypeId, TypeInfo> = {
  alkali:     { id: 'alkali',     name: '알칼리 금속',   short: '알칼', color: '#f2726b' },
  alkaline:   { id: 'alkaline',   name: '알칼리 토금속', short: '토금', color: '#f5a65b' },
  transition: { id: 'transition', name: '전이 금속',     short: '전이', color: '#e8c95c' },
  post:       { id: 'post',       name: '전이후 금속',   short: '후금', color: '#9fc7a8' },
  metalloid:  { id: 'metalloid',  name: '준금속',        short: '준금', color: '#6fc2c0' },
  nonmetal:   { id: 'nonmetal',   name: '비금속',        short: '비금', color: '#7fb5f0' },
  halogen:    { id: 'halogen',    name: '할로젠',        short: '할로', color: '#b79cf2' },
  noble:      { id: 'noble',      name: '비활성 기체',   short: '비활', color: '#ef8fd0' },
};

