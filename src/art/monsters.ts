import type { ElementData } from '../data/elements';
import { ELEMENTS } from '../data/elements';
import { makeCanvas, px, shade, luminance, crispText } from './pixel';

// 원소 몬스터 "엘리몬" 도트 그림을 코드로 생성한다.
//  - 몸 모양 = 원소 분류(타입)
//  - 몸 크기 = 원자 반지름 (칼륨은 크고, 플루오린은 작다)
//  - 몸 색   = 실제 원소의 색 / 포인트 색 = 불꽃 반응색·대표 화합물 색
//  - 궤도 위의 점 개수 = 가장 바깥 껍질 전자 수(원자가 전자)

const S = 64;

const radii = ELEMENTS.map(e => e.radius);
const rMin = Math.min(...radii), rMax = Math.max(...radii);

type Shape = (u: number, v: number) => boolean;

const SHAPES: Record<string, Shape> = {
  alkali: (u, v) => u * u + (v * 1.1) ** 2 <= 1 && v <= 0.85,
  alkaline: (u, v) => u ** 4 + v ** 4 <= 1,
  transition: (u, v) =>
    (Math.abs(u) ** 6 + Math.abs(v * 1.05) ** 6 <= 0.95) ||
    (v >= -1.3 && v <= -0.9 && Math.abs(u) <= 0.16 + (v + 1.3) * 0.5),
  // 전이후 금속(알루미늄·갈륨): 실온에서 고체이므로 금속 주괴(잉곳) 모양 — 위가 좁고 아래가 넓은 덩어리
  post: (u, v) => v >= -0.78 && v <= 0.88 && Math.abs(u) <= 0.6 + 0.32 * ((v + 0.78) / 1.66),
  metalloid: (u, v) => Math.abs(u) <= 0.8 && Math.abs(v) <= 1.08 - 0.55 * Math.abs(u),
  nonmetal: (u, v) =>
    v <= 0.95 && (
      (u + 0.42) ** 2 + (v - 0.15) ** 2 <= 0.62 ** 2 ||
      (u - 0.42) ** 2 + (v - 0.15) ** 2 <= 0.62 ** 2 ||
      u * u + (v + 0.3) ** 2 <= 0.68 ** 2 ||
      u * u + (v - 0.3) ** 2 <= 0.7 ** 2),
  halogen: (u, v) => {
    const r = Math.hypot(u, v);
    const th = Math.atan2(v, u);
    const k = 0.5 + 0.5 * Math.cos(7 * th + Math.PI / 2 * 7);
    return r <= 0.66 + 0.42 * k ** 3;
  },
  noble: (u, v) =>
    v < 0 ? u * u + v * v <= 0.9 : Math.abs(u) <= 0.95 && v <= 0.82 + 0.13 * Math.sin(u * Math.PI * 2.6),
};

export function drawElement(e: ElementData, back: boolean): HTMLCanvasElement {
  const { c, ctx } = makeCanvas(S, S);
  const s = 13 + 11 * ((e.radius - rMin) / (rMax - rMin));
  const cx = 32;
  const cy = 60 - s * 1.05;
  const shape = SHAPES[e.type];
  const inside = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= S || y >= S) return false;
    return shape((x + 0.5 - cx) / s, (y + 0.5 - cy) / s);
  };

  const body = e.color;
  const outline = shade(body, luminance(body) > 0.5 ? -0.68 : -0.55);
  const light = luminance(body) < 0.3;

  // 궤도(뒤쪽 절반) + 전자
  const orbit = {
    cx, cy: cy + s * 0.55, rx: s + 7, ry: Math.max(4, s * 0.3),
  };
  const drawOrbit = (front: boolean) => {
    const ring = shade(e.accent, 0.35);
    for (let i = 0; i < 120; i++) {
      const th = (i / 120) * Math.PI * 2;
      const isFront = Math.sin(th) >= 0;
      if (isFront !== front || i % 3 === 0) continue;
      const x = Math.round(orbit.cx + orbit.rx * Math.cos(th));
      const y = Math.round(orbit.cy + orbit.ry * Math.sin(th));
      if (!front && inside(x, y)) continue;
      px(ctx, x, y, ring);
    }
    const n = e.valence;
    for (let k = 0; k < n; k++) {
      const th = (k / n) * Math.PI * 2 + 0.4;
      if ((Math.sin(th) >= 0) !== front) continue;
      const x = Math.round(orbit.cx + orbit.rx * Math.cos(th)) - 1;
      const y = Math.round(orbit.cy + orbit.ry * Math.sin(th)) - 1;
      px(ctx, x - 1, y, outline, 5, 3);
      px(ctx, x, y - 1, outline, 3, 5);
      px(ctx, x, y, e.accent, 3, 3);
      px(ctx, x, y, '#ffffff');
    }
  };
  drawOrbit(false);

  // 비활성 기체: 은은한 빛
  if (e.type === 'noble') {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (inside(x, y)) continue;
      let near = false;
      for (let dy = -3; dy <= 3 && !near; dy++) for (let dx = -3; dx <= 3; dx++) {
        if (dx * dx + dy * dy <= 9 && inside(x + dx, y + dy)) { near = true; break; }
      }
      if (near && (x + y) % 2 === 0) px(ctx, x, y, shade(e.accent, 0.3));
    }
  }

  // 몸통
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (inside(x, y)) {
      const v = (y + 0.5 - cy) / s;
      let col = body;
      if (!inside(x + 2, y + 2)) col = shade(body, -0.28);
      else if (!inside(x - 2, y - 2)) col = shade(body, 0.4);
      else if (v > 0.45 && (x + y) % 2 === 0) col = shade(body, -0.12);
      px(ctx, x, y, col);
    } else if (inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1) || inside(x, y - 1)) {
      px(ctx, x, y, outline);
    }
  }

  // 반짝임
  const hx = Math.round(cx - s * 0.45), hy = Math.round(cy - s * 0.55);
  if (inside(hx, hy) && inside(hx + 2, hy + 1)) {
    px(ctx, hx, hy, '#ffffff', 3, 1);
    px(ctx, hx, hy + 1, '#ffffff', 1, 1);
  }

  // 분류별 장식
  const acc = e.accent;
  const accD = shade(acc, -0.4);
  if (e.type === 'alkali') {
    // 머리 위 불꽃 (불꽃 반응!)
    const fx = Math.round(cx + s * 0.1), fy = Math.round(cy - s * 1.0) - 2;
    const flame = ['..o..', '.oao.', '.oao.', 'oayao', 'oayao', '.ooo.'];
    flame.forEach((row, yy) => [...row].forEach((ch, xx) => {
      const col = ch === 'o' ? accD : ch === 'a' ? acc : ch === 'y' ? '#fff7c0' : null;
      if (col) px(ctx, fx - 2 + xx, fy - 6 + yy, col);
    }));
  } else if (e.type === 'alkaline') {
    const by = Math.round(cy + s * 0.5);
    for (let x = 0; x < S; x++) for (let yy = 0; yy < 2; yy++) if (inside(x, by + yy) && inside(x, by + yy + 2)) px(ctx, x, by + yy, acc);
  } else if (e.type === 'transition') {
    const by = Math.round(cy + s * 0.48);
    for (let x = 0; x < S; x++) if (inside(x - 2, by) && inside(x + 2, by)) px(ctx, x, by, shade(body, -0.35));
    for (const sx of [-1, 1]) {
      const rx = Math.round(cx + sx * s * 0.68), ry = Math.round(cy - s * 0.55);
      if (inside(rx, ry)) { px(ctx, rx, ry, accD, 2, 2); px(ctx, rx, ry, acc); }
    }
  } else if (e.type === 'metalloid') {
    for (let y = 0; y < S; y++) {
      const x = Math.round(cx + (y - cy) * 0.12);
      if (inside(x, y) && inside(x, y - 2) && inside(x, y + 2)) px(ctx, x, y, shade(body, 0.25));
    }
  } else if (e.type === 'post') {
    // 주괴 윗면(밝은 띠)과 앞면 경계선
    const topY = Math.round(cy - s * 0.78);
    const edgeY = Math.round(cy - s * 0.5);
    for (let y = topY + 1; y < edgeY; y++) for (let x = 0; x < S; x++) {
      if (inside(x, y) && inside(x - 1, y) && inside(x + 1, y)) px(ctx, x, y, shade(body, 0.32));
    }
    for (let x = 0; x < S; x++) if (inside(x - 1, edgeY) && inside(x + 1, edgeY)) px(ctx, x, edgeY, shade(body, -0.3));
    // 금속 광택: 오른쪽 아래 사선 두 줄
    for (let k = 0; k < 2; k++) {
      for (let t = 0; t < Math.round(s * 0.3); t++) {
        const x = Math.round(cx + s * (0.62 + k * 0.12)) - t;
        const y = Math.round(cy + s * 0.2) + t;
        if (inside(x, y) && inside(x + 2, y) && inside(x, y + 2)) px(ctx, x, y, shade(body, 0.45));
      }
    }
  }

  drawOrbit(true);

  const textCol = luminance(body) > 0.55 ? shade(body, -0.72) : shade(body, 0.85);
  const big = s >= 17;
  if (!back) {
    // 얼굴
    const ey = Math.round(cy - s * 0.18);
    const dx = Math.max(4, Math.round(s * 0.36));
    const eyeDark = light ? '#f8f8f8' : '#202030';
    for (const sx of [-1, 1]) {
      const ex = Math.round(cx + sx * dx) - 1;
      px(ctx, ex, ey, eyeDark, 3, 4);
      px(ctx, ex + (sx < 0 ? 1 : 0), ey, light ? '#202030' : '#ffffff', 1, 1);
      if (e.type === 'halogen') {
        // 전자를 노리는 눈썹
        px(ctx, ex - (sx < 0 ? 0 : 1), ey - 3 + (sx < 0 ? 0 : 1), outline, 2, 1);
        px(ctx, ex + (sx < 0 ? 2 : 1), ey - 2 + (sx < 0 ? 0 : -1), outline, 2, 1);
      }
      if (!light) px(ctx, ex - (sx < 0 ? 1 : 0), ey + 5, shade('#ff8090', 0.2), 3, 1);
    }
    // 입 (작은 원소는 기호와 겹치므로 생략)
    if (big) {
      const my = ey + 5;
      px(ctx, cx - 2, my, outline, 1, 1);
      px(ctx, cx - 1, my + 1, outline, 3, 1);
      px(ctx, cx + 2, my, outline, 1, 1);
    }
    // 원소 기호
    crispText(ctx, e.sym, cx, Math.round(cy + s * (big ? 0.12 : 0.22)), big ? 'bold 12px Galmuri11' : '10px Galmuri9', textCol);
  } else {
    crispText(ctx, e.sym, cx, Math.round(cy - s * 0.25), big ? 'bold 12px Galmuri11' : '10px Galmuri9', textCol);
  }
  return c;
}

/** 실루엣 (아직 못 본 원소용) */
export function silhouette(src: HTMLCanvasElement): HTMLCanvasElement {
  const { c, ctx } = makeCanvas(src.width, src.height);
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 0) { img.data[i] = 72; img.data[i + 1] = 72; img.data[i + 2] = 96; }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}
