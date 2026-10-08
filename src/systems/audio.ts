// 아주 작은 칩튠 사운드 엔진 (WebAudio). 외부 음원 파일 없이 효과음과 배경음을 만든다.
// 배경음은 GBA 처럼 "단음 멜로디(펄스파)" 위주 + 가벼운 베이스(삼각파) 한 줄.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let pulse: PeriodicWave | null = null;

const PREF_KEY = 'element-quest-audio';
const pref = (() => {
  try { return { music: true, sfx: true, ...JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}') } as { music: boolean; sfx: boolean }; }
  catch { return { music: true, sfx: true }; }
})();
const savePref = () => { try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch { /* 저장 안 돼도 괜찮음 */ } };

// 기본 볼륨 (휴대폰 스피커 기준으로 맞춤)
const MASTER_VOL = 0.42;
const MUSIC_VOL = 0.65;
const SFX_VOL = 0.75;

function ac(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = MASTER_VOL;
      master.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.gain.value = pref.music ? MUSIC_VOL : 0;
      musicBus.connect(master);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = pref.sfx ? SFX_VOL : 0;
      sfxBus.connect(master);
      // 25% 펄스파 (GBA·게임보이 특유의 소리)
      const N = 32, duty = 0.25;
      const real = new Float32Array(N), imag = new Float32Array(N);
      for (let n = 1; n < N; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
      pulse = ctx.createPeriodicWave(real, imag);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** 모바일 브라우저는 사용자가 화면을 터치한 그 순간에만 소리를 켤 수 있다 */
export function unlockAudio() {
  ac();
}

export function isMusicOn() { return pref.music; }
export function isSfxOn() { return pref.sfx; }

export function toggleMusic(): boolean {
  pref.music = !pref.music;
  savePref();
  if (musicBus) musicBus.gain.value = pref.music ? MUSIC_VOL : 0;
  return pref.music;
}

export function toggleSfx(): boolean {
  pref.sfx = !pref.sfx;
  savePref();
  if (sfxBus) sfxBus.gain.value = pref.sfx ? SFX_VOL : 0;
  return pref.sfx;
}

// ── 효과음 ──────────────────────────────────────────
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.5, slideTo?: number) {
  const a = ac();
  if (!a || !sfxBus) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g).connect(sfxBus);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.4) {
  const a = ac();
  if (!a || !sfxBus) return;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource();
  const g = a.createGain();
  s.buffer = buf;
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  s.connect(g).connect(sfxBus);
  s.start(start);
}

export type Sfx = 'move' | 'select' | 'back' | 'hit' | 'super' | 'weak' | 'shake' | 'catch' | 'levelup' | 'bump' | 'heal' | 'faint' | 'encounter' | 'pop' | 'fanfare';

export function sfx(name: Sfx) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime;
  switch (name) {
    case 'move': tone(880, t, 0.04, 'square', 0.25); break;
    case 'select': tone(1320, t, 0.05, 'square', 0.3); break;
    case 'back': tone(660, t, 0.06, 'square', 0.3); break;
    case 'bump': tone(110, t, 0.08, 'square', 0.3); break;
    case 'hit': noise(t, 0.15, 0.5); tone(220, t, 0.1, 'square', 0.3, 80); break;
    case 'super': noise(t, 0.25, 0.6); tone(440, t, 0.2, 'sawtooth', 0.3, 60); break;
    case 'weak': noise(t, 0.08, 0.3); break;
    case 'shake': tone(300, t, 0.06, 'square', 0.3); tone(200, t + 0.07, 0.06, 'square', 0.3); break;
    case 'catch': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.1, 0.12, 'square', 0.35)); break;
    case 'levelup': [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.1, 'square', 0.35)); break;
    case 'heal': [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.12, 0.15, 'triangle', 0.5)); break;
    case 'faint': tone(600, t, 0.5, 'square', 0.3, 80); break;
    case 'encounter': for (let i = 0; i < 6; i++) tone(i % 2 ? 784 : 1047, t + i * 0.06, 0.05, 'square', 0.3); break;
    case 'pop': noise(t, 0.12, 0.35); tone(1200 + Math.random() * 800, t + 0.02, 0.25, 'triangle', 0.25, 400); break;
    case 'fanfare': [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, t + [0, 0.12, 0.24, 0.36, 0.6, 0.84, 0.96, 1.08][i], i === 7 ? 0.6 : 0.14, 'square', 0.35)); break;
  }
}

/** 엔딩: 원소가 칸에 들어갈 때 울리는 소리. i(0~35)가 커질수록 음이 올라간다 (장조 5음계 3옥타브) */
export function chime(i: number) {
  const a = ac();
  if (!a) return;
  const PENTA = [0, 2, 4, 7, 9];
  const step = Math.floor((i * 15) / 36);
  const semi = 60 + Math.floor(step / 5) * 12 + PENTA[step % 5]; // C4 부터
  const f = 440 * Math.pow(2, (semi - 69) / 12);
  tone(f, a.currentTime, 0.18, 'triangle', 0.5);
  tone(f * 2, a.currentTime, 0.08, 'square', 0.12);
}

// ── 배경음 ──────────────────────────────────────────
// 악보 표기: 한 칸 = 8분음표. 'C5' 음, '~' 앞 음을 한 칸 더 길게, '-' 쉼표. 8칸 = 한 마디(4/4)
// lead = 단음 멜로디, bass = 가벼운 베이스. 베이스는 휴대폰 스피커에서도 들리게 한 옥타브 올려 연주한다.

const NOTE: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(n: string, transpose = 0): number {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 0;
  const semi = NOTE[m[1]] + (Number(m[2]) + 1) * 12 + transpose;
  return 440 * Math.pow(2, (semi - 69) / 12);
}

export interface Song { bpm: number; lead: string; bass?: string; loop?: boolean }

export const SONGS: Record<string, Song> = {
  // ── 상황별 ──
  // 타이틀: 모험을 떠나는 씩씩한 주제가 (C장조)
  title: {
    bpm: 120,
    lead: 'G4 ~ C5 ~ E5 ~ G5 ~  A5 ~ G5 E5 F5 ~ D5 ~  E5 ~ C5 ~ D5 E5 F5 G5  E5 ~ ~ ~ - - G4 ~ ' +
          'A4 ~ C5 ~ F5 ~ A5 ~  G5 ~ E5 C5 D5 ~ G4 ~  C5 D5 E5 F5 G5 A5 B5 ~  C6 ~ ~ ~ ~ ~ - - ',
    bass: 'C3 ~ G3 ~ C3 ~ G3 ~  F3 ~ C4 ~ G3 ~ B3 ~  C3 ~ G3 ~ G3 ~ B3 ~  C3 ~ G3 ~ C3 ~ G3 ~ ' +
          'F3 ~ C4 ~ F3 ~ A3 ~  C3 ~ G3 ~ G3 ~ D4 ~  F3 ~ A3 ~ G3 ~ B3 ~  C3 ~ G3 ~ C4 ~ - - ',
  },
  // 주기 박사의 이야기: 잔잔하고 궁금한 느낌 (F장조)
  intro: {
    bpm: 96,
    lead: 'A4 ~ C5 ~ F5 ~ E5 ~  D5 ~ C5 ~ A4 ~ ~ ~  A#4 ~ D5 ~ G5 ~ F5 ~  E5 ~ ~ ~ C5 ~ ~ ~ ' +
          'A4 ~ C5 ~ F5 ~ A5 ~  G5 ~ F5 ~ D5 ~ E5 ~  F5 ~ ~ ~ C5 ~ A4 ~  F4 ~ ~ ~ ~ ~ - - ',
    bass: 'F3 ~ C4 ~ F3 ~ C4 ~  D3 ~ A3 ~ D3 ~ A3 ~  A#2 ~ F3 ~ A#2 ~ F3 ~  C3 ~ G3 ~ C3 ~ G3 ~ ' +
          'F3 ~ C4 ~ F3 ~ C4 ~  A#2 ~ F3 ~ C3 ~ G3 ~  F3 ~ C4 ~ C3 ~ G3 ~  F3 ~ C4 ~ F3 ~ - - ',
  },
  // 자연 원소와 만남: 정체를 고민하는 긴장감 (A단조)
  quiz: {
    bpm: 150,
    lead: 'A4 - C5 - E5 - C5 -  B4 - D5 - E5 - D5 -  A4 - C5 - E5 - A5 -  G#5 ~ ~ ~ E5 ~ ~ ~ ' +
          'F5 - E5 - D5 - C5 -  D5 - C5 - B4 - A4 -  B4 - C5 - D5 - E5 -  E5 ~ ~ ~ - - - - ',
    bass: 'A2 - A3 - A2 - A3 -  G2 - G3 - G2 - G3 -  F2 - F3 - F2 - F3 -  E2 - E3 - E2 - E3 - ' +
          'D3 - D4 - D3 - D4 -  F2 - F3 - F2 - F3 -  E2 - E3 - E2 - E3 -  E2 - E3 - E2 - - - ',
  },
  // 트레이너 퀴즈 대결: 퀴즈쇼처럼 신나고 빠르게 (E단조)
  duel: {
    bpm: 168,
    lead: 'E5 E5 G5 E5 B5 ~ A5 G5  F#5 F#5 A5 F#5 D6 ~ C6 B5  E5 E5 G5 E5 B5 ~ A5 G5  A5 ~ G5 ~ F#5 ~ D5 ~ ' +
          'C5 ~ E5 ~ G5 ~ C6 ~  B5 ~ G5 ~ E5 ~ G5 ~  A5 G5 F#5 E5 D#5 E5 F#5 G5  E5 ~ ~ ~ B4 ~ ~ ~ ',
    bass: 'E3 E3 - E3 E3 - E3 -  D3 D3 - D3 D3 - D3 -  E3 E3 - E3 E3 - E3 -  B2 B2 - B2 B2 - B2 - ' +
          'C3 C3 - C3 C3 - C3 -  E3 E3 - E3 E3 - E3 -  A2 A2 - A2 B2 B2 - B2  E3 - - - B2 - - - ',
  },
  // 엔딩: 밝고 신나는 축하곡 (C장조)
  ending: {
    bpm: 126,
    lead: 'C5 - E5 G5 C6 - G5 -  A5 - G5 E5 F5 - D5 -  E5 - G5 C6 E6 - D6 C6  B5 - G5 - C6 - - - ' +
          'A5 - C6 A5 G5 - E5 -  F5 - A5 F5 E5 - C5 -  D5 - F5 A5 G5 - B5 -  C6 - G5 - C6 - - - ',
    bass: 'C3 G3 C4 G3 C3 G3 C4 G3  F2 C3 F3 C3 G2 D3 G3 D3  C3 G3 C4 G3 E3 B3 E4 B3  F3 C4 G3 D4 C3 G3 C4 - ' +
          'F2 C3 F3 C3 C3 G3 C4 G3  F2 C3 F3 C3 C3 G3 C4 G3  D3 A3 D4 A3 G2 D3 G3 D3  C3 G3 C4 G3 C3 - C3 - ',
  },
  // 엔딩 크레딧: 지난 여행을 돌아보는 따뜻한 곡 (F장조)
  credits: {
    bpm: 92,
    lead: 'C5 ~ F5 ~ A5 ~ G5 F5  E5 ~ G5 ~ C6 ~ ~ ~  A#5 ~ A5 ~ G5 ~ F5 ~  G5 ~ ~ ~ ~ ~ - - ' +
          'A5 ~ G5 F5 E5 ~ F5 G5  A5 ~ C6 ~ A5 ~ F5 ~  G5 ~ ~ E5 C5 ~ E5 G5  F5 ~ ~ ~ ~ ~ - - ',
    bass: 'F3 ~ C4 ~ F3 ~ C4 ~  C3 ~ G3 ~ C3 ~ G3 ~  A#2 ~ F3 ~ A#2 ~ F3 ~  C3 ~ G3 ~ C3 ~ E3 ~ ' +
          'F3 ~ C4 ~ D3 ~ A3 ~  F3 ~ C4 ~ F3 ~ C4 ~  C3 ~ G3 ~ C3 ~ G3 ~  F3 ~ C4 ~ F3 ~ - - ',
  },
  // 다음 원정 예고: 신비롭고 느리게 (D단조)
  teaser: {
    bpm: 72,
    lead: 'D5 ~ ~ ~ A4 ~ ~ ~  F5 ~ ~ ~ E5 ~ ~ ~  D5 ~ ~ ~ C#5 ~ ~ ~  A4 ~ ~ ~ ~ ~ ~ ~ ',
    bass: 'D3 ~ ~ ~ ~ ~ ~ ~  A#2 ~ ~ ~ ~ ~ ~ ~  G2 ~ ~ ~ ~ ~ ~ ~  A2 ~ ~ ~ ~ ~ ~ ~ ',
  },

  // ── 마을별 ──
  // 1족 알칼리 금속 마을: 고향 마을, 따뜻하고 밝게 (C장조)
  g1: {
    bpm: 112,
    lead: 'E5 ~ G5 ~ C6 ~ G5 ~  A5 ~ G5 E5 D5 ~ ~ -  E5 ~ G5 ~ A5 G5 E5 C5  D5 ~ ~ ~ ~ - - - ' +
          'F5 ~ A5 ~ C6 ~ A5 ~  G5 ~ E5 C5 D5 ~ E5 ~  F5 E5 D5 C5 D5 ~ G4 ~  C5 ~ ~ ~ ~ - - - ',
    bass: 'C3 - G3 - C3 - G3 -  F3 - C4 - G3 - D4 -  C3 - G3 - A3 - E3 -  G3 - D4 - G3 - B3 - ' +
          'F3 - C4 - F3 - A3 -  C3 - G3 - A3 - E3 -  F3 - G3 - G3 - B3 -  C3 - G3 - C4 - - - ',
  },
  // 2족 조개 해변: 파도처럼 살랑살랑 흔들리는 리듬 (G장조)
  g2: {
    bpm: 100,
    lead: 'D5 ~ ~ B4 D5 ~ G5 ~  F#5 ~ E5 ~ D5 ~ ~ -  C5 ~ ~ A4 C5 ~ E5 ~  D5 ~ ~ ~ ~ - - - ' +
          'B4 ~ D5 ~ G5 ~ B5 ~  A5 ~ G5 ~ E5 ~ F#5 ~  G5 ~ ~ D5 B4 ~ A4 ~  G4 ~ ~ ~ ~ - - - ',
    bass: 'G3 ~ ~ D4 G3 ~ ~ D4  D3 ~ ~ A3 D3 ~ ~ A3  C3 ~ ~ G3 C3 ~ ~ G3  D3 ~ ~ A3 D3 ~ ~ A3 ' +
          'G3 ~ ~ D4 G3 ~ ~ D4  C3 ~ ~ G3 D3 ~ ~ A3  E3 ~ ~ B3 D3 ~ ~ A3  G3 ~ ~ D4 G3 ~ - - ',
  },
  // 3~12족 전이 금속 광산: 망치질처럼 같은 음을 두드리는 리듬 (A단조)
  g3_12: {
    bpm: 104,
    lead: 'A4 A4 - A4 C5 - B4 A4  G4 G4 - G4 B4 - A4 G4  A4 A4 - A4 C5 - E5 D5  C5 ~ B4 ~ A4 ~ - - ' +
          'E5 E5 - E5 F5 - E5 D5  C5 C5 - C5 D5 - C5 B4  A4 ~ C5 ~ B4 ~ G#4 ~  A4 ~ ~ ~ - - - - ',
    bass: 'A2 - A3 - A2 - A3 -  G2 - G3 - G2 - G3 -  F2 - F3 - F2 - F3 -  E2 - E3 - E2 - E3 - ' +
          'A2 - A3 - A2 - A3 -  F2 - F3 - F2 - F3 -  D3 - D4 - E3 - E4 -  A2 - A3 - A2 - - - ',
  },
  // 13족 공업 단지: 기계가 돌아가듯 톡톡 끊어지는 분산화음 (D 도리안)
  g13: {
    bpm: 132,
    lead: 'D5 F5 A5 F5 D5 F5 A5 -  C5 E5 G5 E5 C5 E5 G5 -  D5 F5 A5 F5 B5 A5 F5 D5  E5 ~ ~ ~ C5 - - - ' +
          'D5 - D5 - F5 - A5 -  G5 - E5 - C5 - E5 -  F5 E5 D5 C5 B4 C5 D5 E5  D5 ~ - - D6 - - - ',
    bass: 'D3 - D3 - D3 - D3 -  C3 - C3 - C3 - C3 -  D3 - D3 - G3 - G3 -  A2 - A2 - A2 - A2 - ' +
          'D3 - D3 - D3 - D3 -  C3 - C3 - C3 - C3 -  G2 - G2 - A2 - A2 -  D3 - - - D3 - - - ',
  },
  // 14족 탄소 숲: 나무 사이로 흐르는 평화로운 곡 (G장조)
  g14: {
    bpm: 96,
    lead: 'B4 ~ D5 ~ G5 ~ ~ F#5  E5 ~ D5 ~ B4 ~ ~ -  C5 ~ E5 ~ A5 ~ ~ G5  F#5 ~ ~ ~ D5 ~ ~ - ' +
          'B4 ~ D5 ~ G5 ~ B5 ~  A5 ~ G5 ~ E5 ~ C5 ~  D5 ~ ~ B4 A4 ~ D5 ~  G4 ~ ~ ~ ~ ~ - - ',
    bass: 'G3 ~ D4 ~ G3 ~ D4 ~  E3 ~ B3 ~ E3 ~ B3 ~  C3 ~ G3 ~ C3 ~ G3 ~  D3 ~ A3 ~ D3 ~ A3 ~ ' +
          'G3 ~ D4 ~ G3 ~ D4 ~  C3 ~ G3 ~ A3 ~ E3 ~  D3 ~ A3 ~ D3 ~ F#3 ~  G3 ~ D4 ~ G3 ~ - - ',
  },
  // 15족 농장: 깡충깡충 경쾌한 시골 노래 (F장조)
  g15: {
    bpm: 120,
    lead: 'C5 - F5 - F5 G5 A5 -  G5 - E5 - C5 - - -  D5 - G5 - G5 A5 A#5 -  A5 - F5 - C5 - - - ' +
          'F5 F5 A5 - C6 - A5 -  A#5 A5 G5 - E5 - C5 -  D5 - E5 - F5 - G5 -  F5 ~ ~ - F4 - - - ',
    bass: 'F3 - C4 - F3 - C4 -  C3 - G3 - C3 - G3 -  A#2 - F3 - A#2 - F3 -  F3 - C4 - F3 - C4 - ' +
          'F3 - C4 - F3 - C4 -  A#2 - F3 - C3 - G3 -  A#2 - F3 - C3 - G3 -  F3 - C4 - F3 - - - ',
  },
  // 16족 화산: 낮게 꿈틀대는 긴장감 (E 프리지안)
  g16: {
    bpm: 92,
    lead: 'E4 ~ F4 ~ E4 ~ - -  E4 ~ G4 ~ F4 ~ E4 ~  D4 ~ E4 ~ F4 ~ A4 ~  G4 ~ F4 ~ E4 ~ ~ ~ ' +
          'B4 ~ C5 ~ B4 ~ A4 ~  G4 ~ A4 ~ F4 ~ E4 ~  E4 F4 G4 A4 B4 C5 B4 A4  F4 ~ ~ ~ E4 ~ ~ ~ ',
    bass: 'E2 - E2 - E2 - F2 -  E2 - E2 - E2 - F2 -  D2 - D2 - D2 - F2 -  E2 - E2 - E2 - E2 - ' +
          'E2 - E2 - E2 - F2 -  C2 - C2 - D2 - D2 -  E2 - E2 - E2 - F2 -  E2 - - - E2 - - - ',
  },
  // 17족 염전: 햇볕 쨍쨍, 맑고 여유로운 곡 (D장조)
  g17: {
    bpm: 108,
    lead: 'F#5 ~ A5 ~ D6 ~ ~ ~  C#6 ~ A5 ~ B5 ~ A5 ~  G5 ~ B5 ~ A5 ~ F#5 ~  E5 ~ ~ ~ ~ - - - ' +
          'F#5 ~ A5 ~ D6 ~ E6 ~  F#6 ~ E6 ~ D6 ~ B5 ~  A5 ~ G5 ~ F#5 ~ E5 ~  D5 ~ ~ ~ ~ - - - ',
    bass: 'D3 ~ A3 ~ D4 ~ A3 ~  A2 ~ E3 ~ A3 ~ E3 ~  G2 ~ D3 ~ G3 ~ D3 ~  A2 ~ E3 ~ A3 ~ C#4 ~ ' +
          'D3 ~ A3 ~ D4 ~ A3 ~  B2 ~ F#3 ~ B3 ~ F#3 ~  G2 ~ D3 ~ A2 ~ E3 ~  D3 ~ A3 ~ D3 ~ - - ',
  },
  // 18족 네온 도시: 반짝이는 밤거리, 엇박자 신스 (C단조)
  g18: {
    bpm: 140,
    lead: 'C5 - D#5 - G5 - D#5 G5  - A#5 - G5 F5 - D#5 -  C5 - D#5 - G5 - C6 -  A#5 ~ G5 ~ - - - - ' +
          'G#5 - G5 - F5 - D#5 F5  - G5 - F5 D#5 - D5 -  C5 D5 D#5 F5 G5 A#5 G5 F5  G5 ~ ~ ~ - - C5 - ',
    bass: 'C3 C3 - C3 - C3 C3 -  A#2 A#2 - A#2 - A#2 A#2 -  G#2 G#2 - G#2 - G#2 G#2 -  G2 G2 - G2 - G2 G2 - ' +
          'F2 F2 - F2 - F2 F2 -  G#2 G#2 - G#2 - G#2 G#2 -  G2 G2 - G2 - G2 G2 -  C3 C3 - C3 - - - - ',
  },

  // ── 짧은 효과 음악(징글) — 한 번만 연주 ──
  caught: { bpm: 200, loop: false, lead: 'C5 E5 G5 C6 ~ ~ G5 C6 ~ ~ ~ ~', bass: 'C3 ~ ~ ~ ~ ~ G3 C4 ~ ~ ~ ~' },
  fled:   { bpm: 160, loop: false, lead: 'A4 G#4 G4 F#4 ~ ~ ~ ~', bass: 'A2 ~ ~ D3 ~ ~ ~ ~' },
  clear:  { bpm: 180, loop: false, lead: 'G4 C5 E5 G5 ~ E5 G5 C6 ~ ~ ~ ~', bass: 'C3 ~ ~ ~ ~ ~ ~ C4 ~ ~ ~ ~' },
  win:    { bpm: 180, loop: false, lead: 'C5 C5 C5 G5 ~ E5 G5 C6 ~ ~ ~ ~', bass: 'C3 ~ ~ G3 ~ ~ ~ C4 ~ ~ ~ ~' },
  lose:   { bpm: 140, loop: false, lead: 'E5 D5 C5 B4 ~ A4 ~ ~ ~ ~', bass: 'A2 ~ ~ E3 ~ A2 ~ ~ ~ ~' },
};

interface NoteEv { f: number; len: number }
interface Parsed { lead: Map<number, NoteEv>; bass: Map<number, NoteEv>; len: number; step: number; loop: boolean }

function parseTrack(s: string | undefined, transpose: number): { map: Map<number, NoteEv>; len: number } {
  const map = new Map<number, NoteEv>();
  if (!s) return { map, len: 0 };
  const toks = s.trim().split(/\s+/);
  let last: NoteEv | null = null;
  toks.forEach((tk, i) => {
    if (tk === '~') { if (last) last.len++; }
    else if (tk === '-') last = null;
    else { last = { f: freq(tk, transpose), len: 1 }; map.set(i, last); }
  });
  return { map, len: toks.length };
}

const PARSED: Record<string, Parsed> = {};
function parsed(name: string): Parsed | null {
  const s = SONGS[name];
  if (!s) return null;
  if (!PARSED[name]) {
    const lead = parseTrack(s.lead, 0);
    const bass = parseTrack(s.bass, 12); // 베이스는 한 옥타브 위에서 (작은 스피커에서도 들리게)
    PARSED[name] = { lead: lead.map, bass: bass.map, len: Math.max(lead.len, bass.len), step: 60 / s.bpm / 2, loop: s.loop !== false };
  }
  return PARSED[name];
}

/** 배경음 음표 하나: 빠르게 올라가 유지했다가 끝에서 줄어든다 (끊김 없는 또렷한 소리) */
function musicNote(f: number, start: number, dur: number, voice: 'lead' | 'bass') {
  const a = ctx;
  if (!a || !musicBus || !f) return;
  const o = a.createOscillator();
  const g = a.createGain();
  if (voice === 'lead' && pulse) o.setPeriodicWave(pulse);
  else o.type = 'triangle';
  o.frequency.setValueAtTime(f, start);
  const vol = voice === 'lead' ? 0.34 : 0.3;
  const end = start + dur;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.008);
  g.gain.setValueAtTime(vol * 0.85, Math.max(start + 0.01, end - 0.04));
  g.gain.linearRampToValueAtTime(0, end);
  o.connect(g).connect(musicBus);
  o.start(start);
  o.stop(end + 0.02);
}

let current = '';
let timer: number | null = null;
let jingleTimer: number | null = null;

function startSong(name: string) {
  const a = ac();
  const p = parsed(name);
  if (!a || !p) return;
  let i = 0;
  let next = a.currentTime + 0.06;
  const tick = () => {
    // 화면이 잠깐 멈췄다 돌아오면 밀린 음을 몰아서 치지 않고 지금부터 다시
    if (next < a.currentTime - 0.2) next = a.currentTime + 0.05;
    while (next < a.currentTime + 0.25) {
      const l = p.lead.get(i), b = p.bass.get(i);
      if (l) musicNote(l.f, next, l.len * p.step * 0.95, 'lead');
      if (b) musicNote(b.f, next, b.len * p.step * 0.95, 'bass');
      next += p.step;
      i++;
      if (i >= p.len) {
        if (!p.loop) {
          if (timer !== null) clearInterval(timer);
          timer = null;
          return;
        }
        i = 0;
      }
    }
  };
  tick();
  timer = window.setInterval(tick, 50);
}

/** 배경음 재생 (같은 곡이 이미 나오고 있으면 그대로 둔다) */
export function playBgm(name: string) {
  if (jingleTimer !== null) { clearTimeout(jingleTimer); jingleTimer = null; }
  if (name === current) return;
  stopBgm();
  if (!SONGS[name]) return;
  current = name;
  startSong(name);
}

export function stopBgm() {
  if (timer !== null) clearInterval(timer);
  timer = null;
  current = '';
}

/** 짧은 효과 음악을 한 번 연주한다. resume 이 주어지면 끝난 뒤 그 곡으로 돌아간다 */
export function playJingle(name: string, resume?: string): Promise<void> {
  if (jingleTimer !== null) { clearTimeout(jingleTimer); jingleTimer = null; }
  stopBgm();
  const p = parsed(name);
  if (!p) return Promise.resolve();
  startSong(name);
  return new Promise(res => {
    jingleTimer = window.setTimeout(() => {
      jingleTimer = null;
      if (resume) playBgm(resume);
      res();
    }, (p.len * p.step + 0.25) * 1000);
  });
}
