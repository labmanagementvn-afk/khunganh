// Bộ lọc & chỉnh sửa ảnh sản phẩm, xử lý trực tiếp trên điểm ảnh (chạy được trên mọi trình duyệt).
// Các thông số nằm trong khoảng -100..100 (hoặc 0..100) giống các ứng dụng chỉnh ảnh trên điện thoại.

export interface PhotoAdjust {
  filter: FilterId;
  /** Độ mạnh của bộ lọc 0..100 */
  filterStrength: number;
  brightness: number;
  contrast: number;
  saturation: number;
  /** Ấm (+) / lạnh (−) */
  warmth: number;
  /** Vùng sáng: âm = giảm chói */
  highlights: number;
  shadows: number;
  /** Làm mịn (ưu tiên vùng da), 0..100 */
  smooth: number;
  /** Độ nét, 0..100 */
  sharpen: number;
  /** Tối 4 góc, 0..100 */
  vignette: number;
}

export const DEFAULT_ADJUST: PhotoAdjust = {
  filter: 'none',
  filterStrength: 100,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  highlights: 0,
  shadows: 0,
  smooth: 0,
  sharpen: 0,
  vignette: 0,
};

type RGB = [number, number, number];

interface FilterDef {
  name: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  warmth?: number;
  /** Nâng điểm đen – ảnh "bạc màu" kiểu film, 0..1 */
  fade?: number;
  grayscale?: number;
  sepia?: number;
  /** Phủ màu nhẹ */
  tint?: { color: RGB; amount: number };
  /** Nhuộm vùng tối / vùng sáng khác màu (kiểu điện ảnh) */
  split?: { shadow: RGB; highlight: RGB; amount: number };
  vignette?: number;
}

export const FILTERS = {
  none: { name: 'Gốc' },
  bright: { name: 'Sáng trong', brightness: 18, contrast: -6, saturation: 6, fade: 0.06 },
  vivid: { name: 'Rực rỡ', contrast: 16, saturation: 32, brightness: 4 },
  warm: { name: 'Ấm áp', warmth: 30, saturation: 8, brightness: 4 },
  cool: { name: 'Mát lạnh', warmth: -30, contrast: 6, brightness: 4 },
  food: { name: 'Món ngon', warmth: 18, saturation: 26, contrast: 12, brightness: 6 },
  pink: { name: 'Hồng mộng', brightness: 10, contrast: -8, saturation: -4, fade: 0.08, tint: { color: [255, 170, 200], amount: 0.12 } },
  vintage: { name: 'Cổ điển', sepia: 0.35, fade: 0.16, contrast: -6, saturation: -18, vignette: 0.35 },
  cinema: { name: 'Điện ảnh', contrast: 14, saturation: -6, split: { shadow: [0, 110, 130], highlight: [255, 170, 90], amount: 0.22 }, vignette: 0.25 },
  bw: { name: 'Đen trắng', grayscale: 1, contrast: 14 },
} satisfies Record<string, FilterDef>;

export type FilterId = keyof typeof FILTERS;
export const FILTER_IDS = Object.keys(FILTERS) as FilterId[];

const SLIDER_KEYS = ['brightness', 'contrast', 'saturation', 'warmth', 'highlights', 'shadows', 'smooth', 'sharpen', 'vignette'] as const;

export function isIdentity(a: PhotoAdjust): boolean {
  return (a.filter === 'none' || a.filterStrength === 0) && SLIDER_KEYS.every((k) => a[k] === 0);
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Làm mờ hộp (box blur) `passes` lượt trên mảng `ch` kênh, bán kính r. Trả về mảng mới. */
function boxBlur(src: Float32Array, w: number, h: number, ch: number, r: number, passes = 1): Float32Array {
  const a = src.slice();
  const b = new Float32Array(src.length);
  const pass = (from: Float32Array, to: Float32Array, horizontal: boolean) => {
    const len = horizontal ? w : h;
    const lines = horizontal ? h : w;
    const step = horizontal ? ch : w * ch;
    const rr = Math.min(r, len - 1);
    const inv = 1 / (2 * rr + 1);
    for (let line = 0; line < lines; line++) {
      const base = horizontal ? line * w * ch : line * ch;
      for (let c = 0; c < ch; c++) {
        let acc = from[base + c] * (rr + 1);
        for (let k = 1; k <= rr; k++) acc += from[base + k * step + c];
        for (let i = 0; i < len; i++) {
          to[base + i * step + c] = acc * inv;
          acc += from[base + Math.min(i + rr + 1, len - 1) * step + c] - from[base + Math.max(i - rr, 0) * step + c];
        }
      }
    }
  };
  for (let k = 0; k < passes; k++) {
    pass(a, b, true);
    pass(b, a, false);
  }
  return a;
}

/**
 * Bộ lọc dẫn hướng (guided filter, tự dẫn hướng theo từng kênh): làm mịn vùng phẳng
 * nhưng giữ nguyên cạnh, không tạo quầng sáng/tối như làm mờ thông thường.
 */
function guidedSmooth(rgb: Float32Array, w: number, h: number, r: number, eps: number): Float32Array {
  const sq = new Float32Array(rgb.length);
  for (let i = 0; i < rgb.length; i++) sq[i] = rgb[i] * rgb[i];
  const mean = boxBlur(rgb, w, h, 3, r);
  const meanSq = boxBlur(sq, w, h, 3, r);
  const A = sq; // dùng lại bộ nhớ
  const B = new Float32Array(rgb.length);
  for (let i = 0; i < rgb.length; i++) {
    const v = meanSq[i] - mean[i] * mean[i];
    const a = v / (v + eps);
    A[i] = a;
    B[i] = mean[i] * (1 - a);
  }
  const mA = boxBlur(A, w, h, 3, r);
  const mB = boxBlur(B, w, h, 3, r);
  const out = mean; // dùng lại bộ nhớ
  for (let i = 0; i < rgb.length; i++) out[i] = mA[i] * rgb[i] + mB[i];
  return out;
}

/** Xác suất điểm ảnh là màu da (không gian YCbCr) */
function skinWeight(r: number, g: number, b: number): number {
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  const dCb = Math.max(0, Math.abs(cb - 102) - 18) / 12;
  const dCr = Math.max(0, Math.abs(cr - 153) - 16) / 12;
  return Math.max(0, 1 - Math.hypot(dCb, dCr));
}

/** Gộp chỉnh sửa của người dùng với bộ lọc (theo độ mạnh) */
function effective(a: PhotoAdjust) {
  const f: FilterDef = FILTERS[a.filter] ?? FILTERS.none;
  const k = a.filterStrength / 100;
  return {
    brightness: (a.brightness + (f.brightness ?? 0) * k) / 100,
    contrast: (a.contrast + (f.contrast ?? 0) * k) / 100,
    saturation: (a.saturation + (f.saturation ?? 0) * k) / 100,
    warmth: (a.warmth + (f.warmth ?? 0) * k) / 100,
    highlights: a.highlights / 100,
    shadows: a.shadows / 100,
    fade: (f.fade ?? 0) * k,
    grayscale: (f.grayscale ?? 0) * k,
    sepia: (f.sepia ?? 0) * k,
    tint: f.tint ? { color: f.tint.color.map((c) => c / 255) as RGB, amount: f.tint.amount * k } : null,
    split: f.split
      ? {
          shadow: f.split.shadow.map((c) => c / 255) as RGB,
          highlight: f.split.highlight.map((c) => c / 255) as RGB,
          amount: f.split.amount * k,
        }
      : null,
    vignette: clamp01(a.vignette / 100 + (f.vignette ?? 0) * k),
    smooth: a.smooth / 100,
    sharpen: a.sharpen / 100,
  };
}

/** Bảng tra cho từng kênh: độ sáng, tương phản, vùng sáng/tối, ấm/lạnh, bạc màu */
function buildLuts(e: ReturnType<typeof effective>): [Float32Array, Float32Array, Float32Array] {
  const gamma = Math.pow(2, -e.brightness * 0.9);
  const contrast = 1 + e.contrast * (e.contrast > 0 ? 0.9 : 0.7);
  const luts: [Float32Array, Float32Array, Float32Array] = [new Float32Array(256), new Float32Array(256), new Float32Array(256)];
  const shift = [e.warmth * 0.09, e.warmth * 0.015, -e.warmth * 0.09];
  for (let i = 0; i < 256; i++) {
    let v = Math.pow(i / 255, gamma);
    v = (v - 0.5) * contrast + 0.5;
    v += e.highlights * 0.32 * smoothstep(0.5, 1, v);
    v += e.shadows * 0.3 * (1 - smoothstep(0, 0.5, v));
    v = clamp01(v);
    v = e.fade * 0.14 + v * (1 - e.fade * 0.2);
    for (let c = 0; c < 3; c++) luts[c][i] = clamp01(v + shift[c]);
  }
  return luts;
}

/** Áp dụng toàn bộ chỉnh sửa lên dữ liệu điểm ảnh (sửa trực tiếp `data`) */
export function processImageData(data: ImageData, a: PhotoAdjust): ImageData {
  const { width: w, height: h } = data;
  const px = data.data;
  const e = effective(a);

  // 1. Làm mịn (giữ cạnh, ưu tiên vùng da) rồi tăng nét (chỉ ở đường nét rõ, bỏ qua hạt nhiễu)
  if (e.smooth > 0 || e.sharpen > 0) {
    const n = w * h;
    let rgb = new Float32Array(n * 3);
    for (let i = 0, j = 0; j < rgb.length; i += 4, j += 3) {
      rgb[j] = px[i];
      rgb[j + 1] = px[i + 1];
      rgb[j + 2] = px[i + 2];
    }
    const minSide = Math.min(w, h);
    if (e.smooth > 0) {
      const r = Math.max(1, Math.round(minSide * (0.004 + 0.01 * e.smooth)));
      const eps = Math.pow(255 * (0.03 + 0.07 * e.smooth), 2);
      const sm = guidedSmooth(rgb, w, h, r, eps);
      for (let i = 0, j = 0; j < rgb.length; i += 4, j += 3) {
        const wgt = Math.min(1, e.smooth * 1.2) * (0.35 + 0.65 * skinWeight(px[i], px[i + 1], px[i + 2]));
        rgb[j] += (sm[j] - rgb[j]) * wgt;
        rgb[j + 1] += (sm[j + 1] - rgb[j + 1]) * wgt;
        rgb[j + 2] += (sm[j + 2] - rgb[j + 2]) * wgt;
      }
    }
    if (e.sharpen > 0) {
      const blur = boxBlur(rgb, w, h, 3, Math.max(1, Math.round(minSide * 0.0015)), 2);
      const amt = e.sharpen * 1.6;
      const out = new Float32Array(rgb.length);
      for (let j = 0; j < rgb.length; j += 3) {
        const d = (rgb[j] - blur[j]) * 0.299 + (rgb[j + 1] - blur[j + 1]) * 0.587 + (rgb[j + 2] - blur[j + 2]) * 0.114;
        const k = amt * smoothstep(3, 10, Math.abs(d));
        out[j] = rgb[j] + (rgb[j] - blur[j]) * k;
        out[j + 1] = rgb[j + 1] + (rgb[j + 1] - blur[j + 1]) * k;
        out[j + 2] = rgb[j + 2] + (rgb[j + 2] - blur[j + 2]) * k;
      }
      rgb = out;
    }
    for (let i = 0, j = 0; j < rgb.length; i += 4, j += 3) {
      px[i] = rgb[j];
      px[i + 1] = rgb[j + 1];
      px[i + 2] = rgb[j + 2];
    }
  }

  // 2. Màu sắc
  const [lr, lg, lb] = buildLuts(e);
  const sat = 1 + e.saturation;
  const cx = w / 2, cy = h / 2;
  const maxD = Math.hypot(cx, cy);
  for (let y = 0, i = 0; y < h; y++) {
    const dy = (y - cy) * (y - cy);
    for (let x = 0; x < w; x++, i += 4) {
      let r = lr[px[i]], g = lg[px[i + 1]], b = lb[px[i + 2]];
      let l = 0.299 * r + 0.587 * g + 0.114 * b;
      if (sat !== 1) {
        r = l + (r - l) * sat;
        g = l + (g - l) * sat;
        b = l + (b - l) * sat;
      }
      if (e.sepia > 0) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b;
        const sg = 0.349 * r + 0.686 * g + 0.168 * b;
        const sb = 0.272 * r + 0.534 * g + 0.131 * b;
        r += (sr - r) * e.sepia;
        g += (sg - g) * e.sepia;
        b += (sb - b) * e.sepia;
      }
      if (e.grayscale > 0) {
        l = 0.299 * r + 0.587 * g + 0.114 * b;
        r += (l - r) * e.grayscale;
        g += (l - g) * e.grayscale;
        b += (l - b) * e.grayscale;
      }
      if (e.split) {
        l = clamp01(0.299 * r + 0.587 * g + 0.114 * b);
        const ws = (1 - l) * e.split.amount, wh = l * e.split.amount;
        r += (e.split.shadow[0] - r) * ws * 0.5 + (e.split.highlight[0] - r) * wh * 0.5;
        g += (e.split.shadow[1] - g) * ws * 0.5 + (e.split.highlight[1] - g) * wh * 0.5;
        b += (e.split.shadow[2] - b) * ws * 0.5 + (e.split.highlight[2] - b) * wh * 0.5;
      }
      if (e.tint) {
        r += (e.tint.color[0] - r) * e.tint.amount;
        g += (e.tint.color[1] - g) * e.tint.amount;
        b += (e.tint.color[2] - b) * e.tint.amount;
      }
      if (e.vignette > 0) {
        const d = Math.sqrt((x - cx) * (x - cx) + dy) / maxD;
        const v = 1 - e.vignette * 0.65 * smoothstep(0.35, 1.05, d);
        r *= v;
        g *= v;
        b *= v;
      }
      px[i] = r * 255;
      px[i + 1] = g * 255;
      px[i + 2] = b * 255;
    }
  }
  return data;
}

/** Ảnh nguồn → canvas đã xử lý, thu nhỏ để cạnh dài tối đa `maxSide` (0 = giữ nguyên) */
export function renderAdjusted(src: CanvasImageSource & { width: number; height: number }, a: PhotoAdjust, maxSide = 0): HTMLCanvasElement {
  const sw = (src as HTMLImageElement).naturalWidth || src.width;
  const sh = (src as HTMLImageElement).naturalHeight || src.height;
  const k = maxSide ? Math.min(1, maxSide / Math.max(sw, sh)) : 1;
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw * k));
  c.height = Math.max(1, Math.round(sh * k));
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0, c.width, c.height);
  if (!isIdentity(a)) {
    const data = ctx.getImageData(0, 0, c.width, c.height);
    ctx.putImageData(processImageData(data, a), 0, 0);
  }
  return c;
}

/** Phân tích ảnh để đề xuất thông số "Làm đẹp tự động" */
export function autoBeautify(src: HTMLImageElement, current: PhotoAdjust): PhotoAdjust {
  const c = renderAdjusted(src, DEFAULT_ADJUST, 160);
  const px = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
  let sumL = 0, bright = 0, skin = 0;
  const n = px.length / 4;
  for (let i = 0; i < px.length; i += 4) {
    const l = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
    sumL += l;
    if (l > 0.92) bright++;
    if (skinWeight(px[i], px[i + 1], px[i + 2]) > 0.5) skin++;
  }
  const mean = sumL / n;
  const skinRatio = skin / n;
  const glare = bright / n;
  const round = (v: number) => Math.round(Math.max(-100, Math.min(100, v)));
  return {
    ...current,
    brightness: round(Math.max(-20, Math.min(30, (0.52 - mean) * 110))),
    contrast: 10,
    saturation: skinRatio > 0.05 ? 6 : 14,
    warmth: skinRatio > 0.05 ? 8 : 4,
    highlights: round(-10 - glare * 120),
    shadows: mean < 0.4 ? 18 : 8,
    smooth: skinRatio > 0.05 ? 60 : 20,
    sharpen: skinRatio > 0.05 ? 10 : 22,
  };
}
