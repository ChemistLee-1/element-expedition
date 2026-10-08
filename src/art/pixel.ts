// 픽셀 아트 생성용 도우미

export function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

/** 시드 고정 난수 (같은 원소/타일은 항상 같은 모양) */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** amt > 0 밝게, < 0 어둡게 */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, w = 1, h = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** 문자열 도트 그림을 그린다. pal 의 키 문자 → 색, '.' 은 투명 */
export function drawPattern(ctx: CanvasRenderingContext2D, ox: number, oy: number, rows: string[], pal: Record<string, string>, flip = false) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const col = pal[ch];
      if (!col) continue;
      px(ctx, ox + (flip ? row.length - 1 - x : x), oy + y, col);
    }
  }
}

/** 캔버스에 글자를 쓴 뒤 알파를 0/255 로 잘라 또렷한 도트 글씨로 만든다 */
export function crispText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, color: string, outline?: string) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const { ctx: t } = makeCanvas(w, h);
  t.font = font;
  t.textBaseline = 'top';
  t.textAlign = 'center';
  t.fillStyle = '#000';
  t.fillText(s, x, y);
  const img = t.getImageData(0, 0, w, h);
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = img.data[i * 4 + 3] > 110 ? 1 : 0;
  if (outline) {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
      if (mask[yy * w + xx]) continue;
      let near = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = xx + dx, ny = yy + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) near = true;
      }
      if (near) px(ctx, xx, yy, outline);
    }
  }
  for (let i = 0; i < w * h; i++) if (mask[i]) px(ctx, i % w, Math.floor(i / w), color);
}
