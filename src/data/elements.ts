import type { TypeId } from './types';

// 원소 1~36번 데이터.
// 수치(원자량·전기음성도·밀도·녹는점·끓는점·이온화 에너지·원자 반지름)는 일반적으로 공개된 표준값이다.
// - 밀도: g/cm³ (기체도 g/cm³로 통일 → 매우 작은 값)
// - 녹는점·끓는점: K (켈빈)
// - 이온화 에너지: kJ/mol (1차)
// - 원자 반지름: pm (계산값)
// 설명 문구는 이 게임을 위해 직접 작성한 것이다.

export interface ElementData {
  z: number;
  sym: string;
  name: string;
  en: string;
  type: TypeId;
  period: number;
  group: number;
  mass: number;
  eneg: number | null;   // 폴링 전기음성도 (비활성 기체 일부는 없음)
  density: number;
  mp: number;
  bp: number;
  ie: number;
  radius: number;
  config: string;        // 전자 배치
  valence: number;       // 가장 바깥 껍질 전자 수 (스프라이트 궤도 점 개수)
  color: string;         // 몸 색 (실제 모습)
  accent: string;        // 포인트 색 (불꽃 반응색·화합물 색 등)
  rarity: 1 | 2 | 3;     // 1 흔함 · 2 보통 · 3 희귀 (지각 존재량·공급 위험 참고)
  discovered: string;    // 발견 연도/발견자
  uses: [string, string, string]; // 실생활 용도
  fact: string;          // 재미있는 사실
}

const E = (d: ElementData) => d;

export const ELEMENTS: ElementData[] = [
  E({ z: 1, sym: 'H', name: '수소', en: 'Hydrogen', type: 'nonmetal', period: 1, group: 1,
    mass: 1.008, eneg: 2.20, density: 0.0000899, mp: 13.99, bp: 20.27, ie: 1312.0, radius: 53,
    config: '1s1', valence: 1, color: '#cfe8ff', accent: '#8fb8ff', rarity: 1,
    discovered: '1766년 · 캐번디시',
    uses: ['수소 연료전지 자동차', '암모니아 비료 만들기', '로켓 연료'],
    fact: '우주에서 가장 흔한 원소! 태양은 수소를 헬륨으로 바꾸며 빛난다.' }),
  E({ z: 2, sym: 'He', name: '헬륨', en: 'Helium', type: 'noble', period: 1, group: 18,
    mass: 4.0026, eneg: null, density: 0.0001785, mp: 0.95, bp: 4.22, ie: 2372.3, radius: 31,
    config: '1s2', valence: 2, color: '#ffe0c2', accent: '#ffb07a', rarity: 3,
    discovered: '1868년 · 얀센, 로키어 (태양 빛 속에서)',
    uses: ['하늘로 뜨는 풍선과 비행선', 'MRI 자석 냉각', '심해 잠수용 호흡 기체'],
    fact: '지구보다 태양에서 먼저 발견됐다. 이름도 태양신 "헬리오스"에서 왔다.' }),
  E({ z: 3, sym: 'Li', name: '리튬', en: 'Lithium', type: 'alkali', period: 2, group: 1,
    mass: 6.94, eneg: 0.98, density: 0.534, mp: 453.65, bp: 1615, ie: 520.2, radius: 167,
    config: '[He] 2s1', valence: 1, color: '#d8d8e0', accent: '#e8403a', rarity: 2,
    discovered: '1817년 · 아르프베드손',
    uses: ['휴대폰·전기차 배터리', '조울증 치료제', '가벼운 항공기 합금'],
    fact: '가장 가벼운 금속. 물에 뜨고, 불꽃에 넣으면 진한 빨간색이 난다.' }),
  E({ z: 4, sym: 'Be', name: '베릴륨', en: 'Beryllium', type: 'alkaline', period: 2, group: 2,
    mass: 9.0122, eneg: 1.57, density: 1.85, mp: 1560, bp: 2742, ie: 899.5, radius: 112,
    config: '[He] 2s2', valence: 2, color: '#b8c4c8', accent: '#7fd6a0', rarity: 3,
    discovered: '1798년 · 보클랭',
    uses: ['우주 망원경 거울', 'X선 장비 창문', '스프링용 베릴륨-구리 합금'],
    fact: '보석 에메랄드와 아쿠아마린의 주성분인 "녹주석(베릴)"에서 이름이 왔다.' }),
  E({ z: 5, sym: 'B', name: '붕소', en: 'Boron', type: 'metalloid', period: 2, group: 13,
    mass: 10.81, eneg: 2.04, density: 2.34, mp: 2349, bp: 4200, ie: 800.6, radius: 87,
    config: '[He] 2s2 2p1', valence: 3, color: '#6b5a4a', accent: '#6ee08a', rarity: 2,
    discovered: '1808년 · 게이뤼삭, 테나르, 데이비',
    uses: ['잘 깨지지 않는 내열 유리 그릇', '슬라임 만들기 (붕사)', '원자로 제어봉'],
    fact: '붕소 화합물을 불꽃에 넣으면 초록색 불꽃이 난다.' }),
  E({ z: 6, sym: 'C', name: '탄소', en: 'Carbon', type: 'nonmetal', period: 2, group: 14,
    mass: 12.011, eneg: 2.55, density: 2.267, mp: 3823, bp: 4098, ie: 1086.5, radius: 67,
    config: '[He] 2s2 2p2', valence: 4, color: '#3a3a44', accent: '#9ee8ff', rarity: 1,
    discovered: '고대부터 사용 (숯, 그을음)',
    uses: ['연필심 (흑연)', '다이아몬드', '모든 생명체의 뼈대'],
    fact: '연필심과 다이아몬드는 둘 다 순수한 탄소! 원자 배열만 다르다.' }),
  E({ z: 7, sym: 'N', name: '질소', en: 'Nitrogen', type: 'nonmetal', period: 2, group: 15,
    mass: 14.007, eneg: 3.04, density: 0.0012506, mp: 63.15, bp: 77.36, ie: 1402.3, radius: 56,
    config: '[He] 2s2 2p3', valence: 5, color: '#a8c8ff', accent: '#5a7fd6', rarity: 1,
    discovered: '1772년 · 대니얼 러더퍼드',
    uses: ['과자 봉지 충전 기체', '액체 질소로 급속 냉동', '식물 비료'],
    fact: '우리가 마시는 공기의 약 78%가 질소다.' }),
  E({ z: 8, sym: 'O', name: '산소', en: 'Oxygen', type: 'nonmetal', period: 2, group: 16,
    mass: 15.999, eneg: 3.44, density: 0.001429, mp: 54.36, bp: 90.20, ie: 1313.9, radius: 48,
    config: '[He] 2s2 2p4', valence: 6, color: '#8fd0ff', accent: '#3a8fe0', rarity: 1,
    discovered: '1774년 · 프리스틀리 (셸레도 독립 발견)',
    uses: ['호흡 (병원 산소 호흡기)', '불이 타려면 꼭 필요', '용접·철강 생산'],
    fact: '지각 무게의 거의 절반이 산소! 액체 산소는 연한 하늘색이다.' }),
  E({ z: 9, sym: 'F', name: '플루오린', en: 'Fluorine', type: 'halogen', period: 2, group: 17,
    mass: 18.998, eneg: 3.98, density: 0.001696, mp: 53.53, bp: 85.03, ie: 1681.0, radius: 42,
    config: '[He] 2s2 2p5', valence: 7, color: '#f0f08a', accent: '#c8d84a', rarity: 2,
    discovered: '1886년 · 무아상 (전기분해)',
    uses: ['충치 예방 치약', '눌어붙지 않는 프라이팬 코팅', '반도체 가공'],
    fact: '전기음성도가 가장 큰 원소. 전자를 빼앗는 힘이 최강이다!' }),
  E({ z: 10, sym: 'Ne', name: '네온', en: 'Neon', type: 'noble', period: 2, group: 18,
    mass: 20.180, eneg: null, density: 0.0008999, mp: 24.56, bp: 27.07, ie: 2080.7, radius: 38,
    config: '[He] 2s2 2p6', valence: 8, color: '#ff6a3a', accent: '#ffd0a0', rarity: 3,
    discovered: '1898년 · 램지, 트래버스',
    uses: ['붉은 네온사인', '레이저 (헬륨-네온 레이저)', '고전압 표시등'],
    fact: '네온관에 전기를 흘리면 주황빛이 도는 빨간색으로 빛난다.' }),
  E({ z: 11, sym: 'Na', name: '나트륨', en: 'Sodium', type: 'alkali', period: 3, group: 1,
    mass: 22.990, eneg: 0.93, density: 0.971, mp: 370.87, bp: 1156, ie: 495.8, radius: 190,
    config: '[Ne] 3s1', valence: 1, color: '#e0e0d8', accent: '#ffd23a', rarity: 1,
    discovered: '1807년 · 데이비 (전기분해)',
    uses: ['소금 (염화 나트륨)', '주황빛 나트륨 가로등', '베이킹소다'],
    fact: '칼로 버터처럼 잘릴 만큼 무르다. 물에 넣으면 펑! 하고 반응한다.' }),
  E({ z: 12, sym: 'Mg', name: '마그네슘', en: 'Magnesium', type: 'alkaline', period: 3, group: 2,
    mass: 24.305, eneg: 1.31, density: 1.738, mp: 923, bp: 1363, ie: 737.7, radius: 145,
    config: '[Ne] 3s2', valence: 2, color: '#c8ccd4', accent: '#ffffff', rarity: 1,
    discovered: '1755년 · 블랙 (1808년 데이비가 분리)',
    uses: ['가벼운 노트북·자전거 몸체', '불꽃놀이의 흰 섬광', '식물 엽록소의 중심'],
    fact: '불이 붙으면 눈부신 흰 빛을 내며 탄다. 옛날 사진기 플래시에 쓰였다.' }),
  E({ z: 13, sym: 'Al', name: '알루미늄', en: 'Aluminium', type: 'post', period: 3, group: 13,
    mass: 26.982, eneg: 1.61, density: 2.698, mp: 933.47, bp: 2792, ie: 577.5, radius: 118,
    config: '[Ne] 3s2 3p1', valence: 3, color: '#c8d0dc', accent: '#9fb8d8', rarity: 1,
    discovered: '1825년 · 외르스테드',
    uses: ['음료수 캔', '쿠킹 포일', '비행기 몸체'],
    fact: '옛날엔 금보다 비쌌다! 전기분해법이 나온 뒤에야 값이 싸졌다.' }),
  E({ z: 14, sym: 'Si', name: '규소', en: 'Silicon', type: 'metalloid', period: 3, group: 14,
    mass: 28.085, eneg: 1.90, density: 2.3296, mp: 1687, bp: 3538, ie: 786.5, radius: 111,
    config: '[Ne] 3s2 3p2', valence: 4, color: '#6a7280', accent: '#3a5aa0', rarity: 1,
    discovered: '1824년 · 베르셀리우스',
    uses: ['컴퓨터 반도체 칩', '태양 전지판', '유리와 모래 (이산화 규소)'],
    fact: '지각에서 산소 다음으로 많은 원소. 실리콘밸리의 그 "실리콘"이다.' }),
  E({ z: 15, sym: 'P', name: '인', en: 'Phosphorus', type: 'nonmetal', period: 3, group: 15,
    mass: 30.974, eneg: 2.19, density: 1.82, mp: 317.3, bp: 553.6, ie: 1011.8, radius: 98,
    config: '[Ne] 3s2 3p3', valence: 5, color: '#f0e6c8', accent: '#e04a3a', rarity: 1,
    discovered: '1669년 · 브란트 (소변에서!)',
    uses: ['성냥갑 옆면 (붉은 인)', '비료', '뼈와 이, DNA의 성분'],
    fact: '흰 인은 어둠 속에서 은은하게 빛난다. 이름도 "빛을 가져오는 것"이란 뜻.' }),
  E({ z: 16, sym: 'S', name: '황', en: 'Sulfur', type: 'nonmetal', period: 3, group: 16,
    mass: 32.06, eneg: 2.58, density: 2.067, mp: 388.36, bp: 717.8, ie: 999.6, radius: 88,
    config: '[Ne] 3s2 3p4', valence: 6, color: '#f2d83a', accent: '#4a7ae0', rarity: 1,
    discovered: '고대부터 사용 (화산 주변)',
    uses: ['고무 타이어 단단하게 만들기', '황산 (공업의 기본 재료)', '화약'],
    fact: '노란 고체지만 태우면 파란 불꽃이 난다. 계란 썩는 냄새는 황 화합물 때문!' }),
  E({ z: 17, sym: 'Cl', name: '염소', en: 'Chlorine', type: 'halogen', period: 3, group: 17,
    mass: 35.45, eneg: 3.16, density: 0.003214, mp: 171.6, bp: 239.11, ie: 1251.2, radius: 79,
    config: '[Ne] 3s2 3p5', valence: 7, color: '#c8e86a', accent: '#8ab83a', rarity: 1,
    discovered: '1774년 · 셸레',
    uses: ['수영장·수돗물 소독', '소금 (염화 나트륨)', 'PVC 플라스틱'],
    fact: '그 자체는 위험한 황록색 기체지만, 나트륨과 만나면 맛있는 소금이 된다.' }),
  E({ z: 18, sym: 'Ar', name: '아르곤', en: 'Argon', type: 'noble', period: 3, group: 18,
    mass: 39.948, eneg: null, density: 0.0017837, mp: 83.8, bp: 87.30, ie: 1520.6, radius: 71,
    config: '[Ne] 3s2 3p6', valence: 8, color: '#c87af0', accent: '#f0c8ff', rarity: 1,
    discovered: '1894년 · 레일리, 램지',
    uses: ['백열전구 속 충전 기체', '용접할 때 보호 기체', '이중창 사이 단열'],
    fact: '공기의 약 1%가 아르곤. 이름은 그리스어로 "게으른 것"이란 뜻.' }),
  E({ z: 19, sym: 'K', name: '칼륨', en: 'Potassium', type: 'alkali', period: 4, group: 1,
    mass: 39.098, eneg: 0.82, density: 0.862, mp: 336.53, bp: 1032, ie: 418.8, radius: 243,
    config: '[Ar] 4s1', valence: 1, color: '#d0d0d8', accent: '#b88aff', rarity: 1,
    discovered: '1807년 · 데이비 (전기분해)',
    uses: ['바나나 속 영양소', '비료 (칼리 비료)', '신경 신호 전달'],
    fact: '물에 넣으면 보라색 불꽃을 내며 물 위를 뛰어다닌다. 원소기호 K는 라틴어 "칼리움"에서.' }),
  E({ z: 20, sym: 'Ca', name: '칼슘', en: 'Calcium', type: 'alkaline', period: 4, group: 2,
    mass: 40.078, eneg: 1.00, density: 1.54, mp: 1115, bp: 1757, ie: 589.8, radius: 194,
    config: '[Ar] 4s2', valence: 2, color: '#e8e4dc', accent: '#ff7a3a', rarity: 1,
    discovered: '1808년 · 데이비',
    uses: ['뼈와 이', '조개껍데기와 분필 (탄산 칼슘)', '시멘트'],
    fact: '우리 몸에 가장 많은 금속 원소! 불꽃 반응은 주황빛 빨강이다.' }),
  E({ z: 21, sym: 'Sc', name: '스칸듐', en: 'Scandium', type: 'transition', period: 4, group: 3,
    mass: 44.956, eneg: 1.36, density: 2.989, mp: 1814, bp: 3109, ie: 633.1, radius: 184,
    config: '[Ar] 3d1 4s2', valence: 2, color: '#d8d8cc', accent: '#c8c890', rarity: 3,
    discovered: '1879년 · 닐손',
    uses: ['가볍고 튼튼한 야구 배트·자전거', '경기장 조명 (메탈 할라이드 램프)', '항공기 부품'],
    fact: '멘델레예프가 "에카붕소"라는 이름으로 미리 존재를 예언했던 원소다.' }),
  E({ z: 22, sym: 'Ti', name: '타이타늄', en: 'Titanium', type: 'transition', period: 4, group: 4,
    mass: 47.867, eneg: 1.54, density: 4.54, mp: 1941, bp: 3560, ie: 658.8, radius: 176,
    config: '[Ar] 3d2 4s2', valence: 2, color: '#a0a8b4', accent: '#5a8ad0', rarity: 1,
    discovered: '1791년 · 그레고르',
    uses: ['인공 관절·치아 임플란트', '흰색 페인트·선크림 (이산화 타이타늄)', '안경테'],
    fact: '강철만큼 튼튼하지만 훨씬 가볍고, 몸속에 넣어도 거부 반응이 적다.' }),
  E({ z: 23, sym: 'V', name: '바나듐', en: 'Vanadium', type: 'transition', period: 4, group: 5,
    mass: 50.942, eneg: 1.63, density: 6.11, mp: 2183, bp: 3680, ie: 650.9, radius: 171,
    config: '[Ar] 3d3 4s2', valence: 2, color: '#9aa4b0', accent: '#7a5ad0', rarity: 2,
    discovered: '1801년 · 델 리오 (1830년 세프스트룀이 재발견)',
    uses: ['단단한 공구강 (스패너)', '대용량 에너지 저장 배터리', '황산 제조 촉매'],
    fact: '화합물 색이 무지개처럼 다양해서 아름다움의 여신 "바나디스"의 이름을 땄다.' }),
  E({ z: 24, sym: 'Cr', name: '크로뮴', en: 'Chromium', type: 'transition', period: 4, group: 6,
    mass: 51.996, eneg: 1.66, density: 7.15, mp: 2180, bp: 2944, ie: 652.9, radius: 166,
    config: '[Ar] 3d5 4s1', valence: 1, color: '#c8d4e0', accent: '#4ab86a', rarity: 2,
    discovered: '1797년 · 보클랭',
    uses: ['녹슬지 않는 스테인리스강', '반짝이는 크롬 도금', '에메랄드·루비의 색'],
    fact: '루비의 빨간색과 에메랄드의 초록색 모두 크로뮴 때문이다.' }),
  E({ z: 25, sym: 'Mn', name: '망가니즈', en: 'Manganese', type: 'transition', period: 4, group: 7,
    mass: 54.938, eneg: 1.55, density: 7.44, mp: 1519, bp: 2334, ie: 717.3, radius: 161,
    config: '[Ar] 3d5 4s2', valence: 2, color: '#a89c94', accent: '#c84ab0', rarity: 1,
    discovered: '1774년 · 간',
    uses: ['단단한 강철 (레일·금고)', '건전지 (이산화 망가니즈)', '보라색 소독약 (과망가니즈산 칼륨)'],
    fact: '선사 시대 동굴 벽화의 검은 물감에도 망가니즈 산화물이 쓰였다.' }),
  E({ z: 26, sym: 'Fe', name: '철', en: 'Iron', type: 'transition', period: 4, group: 8,
    mass: 55.845, eneg: 1.83, density: 7.874, mp: 1811, bp: 3134, ie: 762.5, radius: 156,
    config: '[Ar] 3d6 4s2', valence: 2, color: '#8a8c94', accent: '#c8603a', rarity: 1,
    discovered: '고대부터 사용 (철기 시대)',
    uses: ['건물 철골과 자동차 (강철)', '피 속 헤모글로빈 (산소 운반)', '자석'],
    fact: '피가 빨간 이유는 철 때문! 지구의 핵도 대부분 철로 되어 있다.' }),
  E({ z: 27, sym: 'Co', name: '코발트', en: 'Cobalt', type: 'transition', period: 4, group: 9,
    mass: 58.933, eneg: 1.88, density: 8.86, mp: 1768, bp: 3200, ie: 760.4, radius: 152,
    config: '[Ar] 3d7 4s2', valence: 2, color: '#7a86a0', accent: '#2a4ad0', rarity: 2,
    discovered: '1735년 · 브란트',
    uses: ['파란 도자기 물감 (코발트 블루)', '전기차 배터리', '비타민 B12의 중심'],
    fact: '이름은 광부들을 괴롭히던 독일 요정 "코볼트"에서 왔다.' }),
  E({ z: 28, sym: 'Ni', name: '니켈', en: 'Nickel', type: 'transition', period: 4, group: 10,
    mass: 58.693, eneg: 1.91, density: 8.912, mp: 1728, bp: 3186, ie: 737.1, radius: 149,
    config: '[Ar] 3d8 4s2', valence: 2, color: '#b8b49c', accent: '#6ac87a', rarity: 2,
    discovered: '1751년 · 크론스테트',
    uses: ['동전 (백동화)', '스테인리스강', '충전식 배터리'],
    fact: '철, 코발트와 함께 자석에 붙는 3대 금속이다.' }),
  E({ z: 29, sym: 'Cu', name: '구리', en: 'Copper', type: 'transition', period: 4, group: 11,
    mass: 63.546, eneg: 1.90, density: 8.96, mp: 1357.77, bp: 2835, ie: 745.5, radius: 145,
    config: '[Ar] 3d10 4s1', valence: 1, color: '#d8834a', accent: '#3ac8b0', rarity: 2,
    discovered: '고대부터 사용 (청동기 시대)',
    uses: ['전선', '10원짜리 동전', '청동 종·조각상'],
    fact: '자유의 여신상이 초록색인 이유는 구리가 녹슬어 "녹청"이 생겼기 때문!' }),
  E({ z: 30, sym: 'Zn', name: '아연', en: 'Zinc', type: 'transition', period: 4, group: 12,
    mass: 65.38, eneg: 1.65, density: 7.134, mp: 692.68, bp: 1180, ie: 906.4, radius: 142,
    config: '[Ar] 3d10 4s2', valence: 2, color: '#a8b4c0', accent: '#d0d8e0', rarity: 2,
    discovered: '1746년 · 마르크그라프 (인도에서는 더 일찍 사용)',
    uses: ['철이 녹슬지 않게 하는 도금 (함석)', '건전지', '자외선 차단제'],
    fact: '구리와 섞으면 금빛 "황동"이 된다. 트럼펫이 바로 황동!' }),
  E({ z: 31, sym: 'Ga', name: '갈륨', en: 'Gallium', type: 'post', period: 4, group: 13,
    mass: 69.723, eneg: 1.81, density: 5.907, mp: 302.91, bp: 2477, ie: 578.8, radius: 136,
    config: '[Ar] 3d10 4s2 4p1', valence: 3, color: '#c8ccd0', accent: '#8ad0f0', rarity: 3,
    discovered: '1875년 · 르코크 드 부아보드랑',
    uses: ['파란색·흰색 LED', '스마트폰 고속 충전기 (질화 갈륨)', '온도계'],
    fact: '녹는점이 약 30 ℃라서 손바닥 위에서 녹아 버린다!' }),
  E({ z: 32, sym: 'Ge', name: '저마늄', en: 'Germanium', type: 'metalloid', period: 4, group: 14,
    mass: 72.630, eneg: 2.01, density: 5.323, mp: 1211.4, bp: 3106, ie: 762.0, radius: 125,
    config: '[Ar] 3d10 4s2 4p2', valence: 4, color: '#9a9ca4', accent: '#5a6a8a', rarity: 3,
    discovered: '1886년 · 빙클러',
    uses: ['광섬유', '야간 투시경 렌즈', '최초의 트랜지스터'],
    fact: '멘델레예프가 "에카규소"라고 예언한 성질과 거의 똑같아 주기율표의 힘을 증명했다.' }),
  E({ z: 33, sym: 'As', name: '비소', en: 'Arsenic', type: 'metalloid', period: 4, group: 15,
    mass: 74.922, eneg: 2.18, density: 5.776, mp: 1090, bp: 887, ie: 947.0, radius: 114,
    config: '[Ar] 3d10 4s2 4p3', valence: 5, color: '#8a8a8a', accent: '#a0d84a', rarity: 3,
    discovered: '1250년경 · 알베르투스 마그누스',
    uses: ['반도체 (갈륨 비소)', '목재 방부제 (과거)', '일부 백혈병 치료제'],
    fact: '독으로 악명 높지만 약으로도 쓰인다. 가열하면 녹지 않고 바로 기체가 된다(승화).' }),
  E({ z: 34, sym: 'Se', name: '셀레늄', en: 'Selenium', type: 'nonmetal', period: 4, group: 16,
    mass: 78.971, eneg: 2.55, density: 4.809, mp: 494, bp: 958, ie: 941.0, radius: 103,
    config: '[Ar] 3d10 4s2 4p4', valence: 6, color: '#8a3a3a', accent: '#3a3a3a', rarity: 3,
    discovered: '1817년 · 베르셀리우스',
    uses: ['복사기 감광 드럼', '비듬 샴푸', '유리를 붉게 물들이기'],
    fact: '빛을 받으면 전기가 더 잘 통한다. 이름은 달의 여신 "셀레네"에서 왔다.' }),
  E({ z: 35, sym: 'Br', name: '브로민', en: 'Bromine', type: 'halogen', period: 4, group: 17,
    mass: 79.904, eneg: 2.96, density: 3.122, mp: 265.8, bp: 332.0, ie: 1139.9, radius: 94,
    config: '[Ar] 3d10 4s2 4p5', valence: 7, color: '#a8401a', accent: '#e07a3a', rarity: 2,
    discovered: '1826년 · 발라르',
    uses: ['불이 잘 안 붙게 하는 난연제', '수영장 소독', '사진 필름'],
    fact: '상온에서 액체인 단 두 원소 중 하나 (다른 하나는 수은). 고약한 냄새가 난다.' }),
  E({ z: 36, sym: 'Kr', name: '크립톤', en: 'Krypton', type: 'noble', period: 4, group: 18,
    mass: 83.798, eneg: 3.00, density: 0.003733, mp: 115.79, bp: 119.93, ie: 1350.8, radius: 88,
    config: '[Ar] 3d10 4s2 4p6', valence: 8, color: '#f0f0ff', accent: '#c8b8ff', rarity: 3,
    discovered: '1898년 · 램지, 트래버스',
    uses: ['사진기 고속 플래시', '공항 활주로 조명', '고급 이중창 단열'],
    fact: '이름은 그리스어로 "숨겨진 것". 슈퍼맨의 크립토나이트와는 상관없다!' }),
];

export const ELEMENT_BY_Z: Record<number, ElementData> = Object.fromEntries(ELEMENTS.map(e => [e.z, e]));

export function el(z: number): ElementData {
  return ELEMENT_BY_Z[z];
}

/** 주어진 온도(K)에서의 상태 */
export type Phase = 'solid' | 'liquid' | 'gas';
export function phaseAt(e: ElementData, tempK: number): Phase {
  // 비소처럼 녹기 전에 기체가 되는(승화) 원소도 있으므로 끓는점부터 확인
  if (tempK >= e.bp) return 'gas';
  if (tempK >= e.mp) return 'liquid';
  return 'solid';
}
export const PHASE_NAME: Record<Phase, string> = { solid: '고체', liquid: '액체', gas: '기체' };

// ── 족별 마을 ────────────────────────────────────────
// 3~12족(전이 금속)은 한 마을로 묶는다. 수소는 1족이므로 알칼리 금속 마을에 산다.
export type VillageKey = 'g1' | 'g2' | 'g3_12' | 'g13' | 'g14' | 'g15' | 'g16' | 'g17' | 'g18';
export const VILLAGE_ORDER: VillageKey[] = ['g1', 'g2', 'g3_12', 'g13', 'g14', 'g15', 'g16', 'g17', 'g18'];

export function villageOf(e: ElementData): VillageKey {
  if (e.group >= 3 && e.group <= 12) return 'g3_12';
  return `g${e.group}` as VillageKey;
}

export function villageMembers(v: VillageKey): number[] {
  return ELEMENTS.filter(e => villageOf(e) === v).map(e => e.z);
}

/** 전자 배치 표기: '[Ar] 3d6 4s2' → '[Ar] 3d⁶ 4s²' (오비탈 뒤 전자 수를 위첨자로) */
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export function configText(e: ElementData): string {
  return e.config.replace(/([spdf])(\d+)/g, (_, orb: string, n: string) => orb + [...n].map(d => SUP[+d]).join(''));
}
