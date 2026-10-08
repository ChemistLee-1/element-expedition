// 아주 작은 칩튠 사운드 엔진 (WebAudio). 외부 음원 파일 없이 효과음과 배경음을 만든다.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ac(): AudioContext | null {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.18;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function toggleMute(): boolean {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.18;
  return muted;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.5, slideTo?: number) {
  const a = ac();
  if (!a || !master) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g).connect(master);
  o.start(start);
  o.stop(start + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.4) {
  const a = ac();
  if (!a || !master) return;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource();
  const g = a.createGain();
  s.buffer = buf;
  g.gain.setValueAtTime(vol, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  s.connect(g).connect(master);
  s.start(start);
}

export type Sfx = 'move' | 'select' | 'back' | 'hit' | 'super' | 'weak' | 'shake' | 'catch' | 'levelup' | 'bump' | 'heal' | 'faint' | 'encounter';

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
  }
}

// ── 배경음 ──────────────────────────────────────────
// 음표: 'C4', 'D#5' 형식, '-' 는 쉼표. 한 칸 = 8분음표
const NOTE: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(n: string): number {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 0;
  const semi = NOTE[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (semi - 69) / 12);
}

interface Song { bpm: number; lead: string; bass: string }
const SONGS: Record<string, Song> = {
  town: {
    bpm: 112,
    lead: 'E5 - G5 - C6 - G5 - A5 - G5 E5 - D5 - - - E5 - G5 - A5 - G5 E5 C5 - D5 - E5 - C5 - - - ' +
          'F5 - A5 - C6 - A5 - G5 - E5 C5 - D5 - - - E5 D5 C5 - D5 - E5 - G5 - - - C5 - - - ',
    bass: 'C3 - G3 - C3 - G3 - F3 - C4 - F3 - C4 - G3 - D4 - G3 - D4 - C3 - G3 - C3 - G3 - ' +
          'F3 - C4 - F3 - C4 - C3 - G3 - C3 - G3 - G3 - D4 - G3 - D4 - C3 - G3 - C3 - - - ',
  },
  route: {
    bpm: 132,
    lead: 'G4 - B4 D5 G5 - F#5 E5 D5 - B4 - G4 - - - A4 - C5 E5 A5 - G5 F#5 E5 - C5 - A4 - - - ' +
          'B4 - D5 G5 B5 - A5 G5 F#5 - D5 - A4 - D5 - G5 - - - D5 - B4 - G4 - - - - - - - ',
    bass: 'G2 - G3 - G2 - G3 - G2 - G3 - G2 - G3 - A2 - A3 - A2 - A3 - D3 - D4 - D3 - D4 - ' +
          'G2 - G3 - G2 - G3 - D3 - D4 - D3 - D4 - G2 - G3 - D3 - D4 - G2 - G3 - G2 - - - ',
  },
  cave: {
    bpm: 96,
    lead: 'A4 - - C5 - - E5 - D5 - - B4 - - G4 - A4 - - C5 - - E5 - F5 - - E5 - - D5 - ' +
          'C5 - - B4 - - A4 - G#4 - - B4 - - E4 - A4 - - - - - - - - - - - - - - - ',
    bass: 'A2 - - - A2 - - - G2 - - - G2 - - - F2 - - - F2 - - - E2 - - - E2 - - - ' +
          'A2 - - - A2 - - - E2 - - - E2 - - - A2 - - - - - - - - - - - - - - - ',
  },
  battle: {
    bpm: 168,
    lead: 'A4 A4 C5 A4 D5 A4 E5 A4 G5 - F5 E5 D5 - E5 - A4 A4 C5 A4 D5 A4 E5 A4 C6 - B5 A5 G5 - E5 - ' +
          'F5 - E5 - D5 - C5 - D5 - C5 - B4 - G4 - A4 - - - E5 - - - A5 - - - - - - - ',
    bass: 'A2 A3 A2 A3 A2 A3 A2 A3 G2 G3 G2 G3 G2 G3 G2 G3 F2 F3 F2 F3 F2 F3 F2 F3 E2 E3 E2 E3 E2 E3 E2 E3 ' +
          'D3 D4 D3 D4 D3 D4 D3 D4 E2 E3 E2 E3 E2 E3 E2 E3 A2 A3 A2 A3 E2 E3 E2 E3 A2 - A2 - A2 - - - ',
  },
};

let current = '';
let timer: number | null = null;

export function playBgm(name: string) {
  if (name === current) return;
  stopBgm();
  const song = SONGS[name];
  const a = ac();
  if (!song || !a) return;
  current = name;
  const lead = song.lead.trim().split(/\s+/);
  const bass = song.bass.trim().split(/\s+/);
  const step = 60 / song.bpm / 2;
  const len = Math.max(lead.length, bass.length);
  let i = 0;
  let next = a.currentTime + 0.05;
  const schedule = () => {
    // 0.3초 앞까지 미리 예약
    while (next < a.currentTime + 0.3) {
      const l = lead[i % lead.length];
      const b = bass[i % bass.length];
      if (l && l !== '-') tone(freq(l), next, step * 1.6, 'square', 0.13);
      if (b && b !== '-') tone(freq(b), next, step * 1.8, 'triangle', 0.35);
      next += step;
      i = (i + 1) % len;
    }
  };
  schedule();
  timer = window.setInterval(schedule, 100);
}

export function stopBgm() {
  if (timer !== null) clearInterval(timer);
  timer = null;
  current = '';
}
