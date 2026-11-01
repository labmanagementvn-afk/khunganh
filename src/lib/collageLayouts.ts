// Các kiểu bố cục ghép ảnh. Toạ độ theo tỉ lệ 0..1 của vùng ghép (đã trừ lề ngoài).
// Ô có thể là hình chữ nhật, đa giác (chia chéo, kim cương…) hoặc hình tròn.

export type Cell = [number, number, number, number];
type Pt = [number, number];

export type Shape =
  | { kind: 'poly'; points: Pt[]; /** đa giác nhiều điểm (trái tim…) – không bo góc */ smooth?: boolean }
  /** r tính theo cạnh ngắn của vùng ghép để luôn tròn */
  | { kind: 'circle'; cx: number; cy: number; r: number };

export interface CollageLayout {
  id: string;
  name: string;
  /** Khung bao của từng ô (dùng để đặt ảnh, đếm số ô, vẽ hình minh hoạ) */
  cells: Cell[];
  /** Hình dạng ô; không có = ô chữ nhật theo `cells` */
  shapes?: Shape[];
  /** Kiểu hiện đại: khoảng cách giữa ô vẽ bằng viền màu nền */
  styled?: boolean;
}

const poly = (...points: Pt[]): Shape => ({ kind: 'poly', points });
const circ = (cx: number, cy: number, r: number): Shape => ({ kind: 'circle', cx, cy, r });

/** Trái tim (đường cong tham số) nằm gọn trong hộp (x, y, w, h) */
function heart(x: number, y: number, w: number, h: number): Shape {
  const pts: Pt[] = [];
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(a), 3);
    const hy = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
    pts.push([x + ((hx + 16) / 32) * w, y + ((12 - hy) / 29) * h]);
  }
  return { kind: 'poly', points: pts, smooth: true };
}

/** Hình vòm (nửa trên tròn) nằm trong hộp */
function arch(x: number, y: number, w: number, h: number, aspect: number): Shape {
  const pts: Pt[] = [[x, y + h]];
  const ry = (w / 2) * aspect;
  for (let i = 0; i <= 24; i++) {
    const a = Math.PI - (i / 24) * Math.PI;
    pts.push([x + w / 2 + (Math.cos(a) * w) / 2, y + ry - Math.sin(a) * ry]);
  }
  pts.push([x + w, y + h]);
  return { kind: 'poly', points: pts, smooth: true };
}

/** Khung bao của một hình (theo tỉ lệ vùng ghép), `ratio` = cao/rộng của vùng ghép */
function bbox(s: Shape, ratio: number): Cell {
  if (s.kind === 'circle') {
    const rx = s.r * Math.min(1, ratio);
    const ry = s.r * Math.min(1, 1 / ratio);
    return [s.cx - rx, s.cy - ry, rx * 2, ry * 2];
  }
  const xs = s.points.map((p) => p[0]);
  const ys = s.points.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}

function styled(id: string, name: string, shapes: Shape[]): CollageLayout {
  // Khung bao tính cho tỉ lệ 4:5 – chỉ dùng cho hình minh hoạ; khi vẽ sẽ tính lại theo tỉ lệ thật
  return { id, name, shapes, styled: true, cells: shapes.map((s) => bbox(s, 1.25)) };
}

const t = 1 / 3;

export const COLLAGE_LAYOUTS: CollageLayout[] = [
  // 2 ảnh
  { id: '2-cols', name: '2 cột', cells: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] },
  { id: '2-rows', name: '2 hàng', cells: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]] },
  { id: '2-big-left', name: 'Lớn – nhỏ', cells: [[0, 0, 0.62, 1], [0.62, 0, 0.38, 1]] },
  // 3 ảnh
  { id: '3-left-big', name: '1 lớn trái', cells: [[0, 0, 0.6, 1], [0.6, 0, 0.4, 0.5], [0.6, 0.5, 0.4, 0.5]] },
  { id: '3-top-big', name: '1 lớn trên', cells: [[0, 0, 1, 0.6], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]] },
  { id: '3-cols', name: '3 cột', cells: [[0, 0, t, 1], [t, 0, t, 1], [2 * t, 0, t, 1]] },
  { id: '3-rows', name: '3 hàng', cells: [[0, 0, 1, t], [0, t, 1, t], [0, 2 * t, 1, t]] },
  // 4 ảnh
  { id: '4-grid', name: 'Lưới 2×2', cells: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
  { id: '4-top-big', name: '1 lớn + 3', cells: [[0, 0, 1, 0.65], [0, 0.65, t, 0.35], [t, 0.65, t, 0.35], [2 * t, 0.65, t, 0.35]] },
  { id: '4-left-big', name: '1 lớn + 3 dọc', cells: [[0, 0, 0.66, 1], [0.66, 0, 0.34, t], [0.66, t, 0.34, t], [0.66, 2 * t, 0.34, t]] },
  // 5 ảnh
  { id: '5-2-3', name: '2 trên – 3 dưới', cells: [[0, 0, 0.5, 0.55], [0.5, 0, 0.5, 0.55], [0, 0.55, t, 0.45], [t, 0.55, t, 0.45], [2 * t, 0.55, t, 0.45]] },
  { id: '5-top-big', name: '1 lớn + 4', cells: [[0, 0, 1, 0.55], [0, 0.55, 0.5, 0.225], [0.5, 0.55, 0.5, 0.225], [0, 0.775, 0.5, 0.225], [0.5, 0.775, 0.5, 0.225]] },
  { id: '5-left-2-right-3', name: '2 trái – 3 phải', cells: [[0, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0, 0.5, t], [0.5, t, 0.5, t], [0.5, 2 * t, 0.5, t]] },
  // 6 ảnh
  { id: '6-grid-3x2', name: 'Lưới 3×2', cells: [[0, 0, t, 0.5], [t, 0, t, 0.5], [2 * t, 0, t, 0.5], [0, 0.5, t, 0.5], [t, 0.5, t, 0.5], [2 * t, 0.5, t, 0.5]] },
  { id: '6-grid-2x3', name: 'Lưới 2×3', cells: [[0, 0, 0.5, t], [0.5, 0, 0.5, t], [0, t, 0.5, t], [0.5, t, 0.5, t], [0, 2 * t, 0.5, t], [0.5, 2 * t, 0.5, t]] },
  { id: '6-big', name: '1 lớn + 5', cells: [[0, 0, 2 * t, 2 * t], [2 * t, 0, t, t], [2 * t, t, t, t], [0, 2 * t, t, t], [t, 2 * t, t, t], [2 * t, 2 * t, t, t]] },
  // ---- Kiểu hiện đại: chéo, tròn, trái tim… ----
  styled('2-diag', 'Chéo dọc', [poly([0, 0], [0.62, 0], [0.38, 1], [0, 1]), poly([0.62, 0], [1, 0], [1, 1], [0.38, 1])]),
  styled('2-diag-h', 'Chéo ngang', [poly([0, 0], [1, 0], [1, 0.38], [0, 0.62]), poly([0, 0.62], [1, 0.38], [1, 1], [0, 1])]),
  styled('2-circle-inset', 'Tròn góc', [poly([0, 0], [1, 0], [1, 1], [0, 1]), circ(0.7, 0.76, 0.27)]),
  styled('2-circles', '2 vòng tròn', [circ(0.32, 0.4, 0.3), circ(0.68, 0.62, 0.3)]),
  styled('2-heart', 'Trái tim', [poly([0, 0], [1, 0], [1, 1], [0, 1]), heart(0.2, 0.3, 0.6, 0.42)]),
  styled('2-arches', '2 vòm', [arch(0.02, 0.12, 0.46, 0.76, 0.8), arch(0.52, 0.12, 0.46, 0.76, 0.8)]),

  styled('3-diag', 'Sọc chéo', [
    poly([0, 0], [0.4, 0], [0.27, 1], [0, 1]),
    poly([0.4, 0], [0.73, 0], [0.6, 1], [0.27, 1]),
    poly([0.73, 0], [1, 0], [1, 1], [0.6, 1]),
  ]),
  styled('3-y', 'Chữ Y', [
    poly([0, 0], [1, 0], [1, 0.3], [0.5, 0.55], [0, 0.3]),
    poly([0, 0.3], [0.5, 0.55], [0.5, 1], [0, 1]),
    poly([1, 0.3], [1, 1], [0.5, 1], [0.5, 0.55]),
  ]),
  styled('3-bubbles', 'Bong bóng', [circ(0.37, 0.3, 0.34), circ(0.72, 0.58, 0.26), circ(0.36, 0.8, 0.2)]),
  styled('3-circle-center', 'Tròn giữa', [poly([0, 0], [1, 0], [1, 0.5], [0, 0.5]), poly([0, 0.5], [1, 0.5], [1, 1], [0, 1]), circ(0.5, 0.5, 0.26)]),

  styled('4-x', 'Chữ X', [
    poly([0, 0], [1, 0], [0.5, 0.5]),
    poly([1, 0], [1, 1], [0.5, 0.5]),
    poly([1, 1], [0, 1], [0.5, 0.5]),
    poly([0, 1], [0, 0], [0.5, 0.5]),
  ]),
  styled('4-diag-grid', 'Lưới chéo', [
    poly([0, 0], [0.58, 0], [0.5, 0.5], [0, 0.42]),
    poly([0.58, 0], [1, 0], [1, 0.58], [0.5, 0.5]),
    poly([0, 0.42], [0.5, 0.5], [0.42, 1], [0, 1]),
    poly([0.5, 0.5], [1, 0.58], [1, 1], [0.42, 1]),
  ]),
  styled('4-circle-center', '3 + tròn giữa', [
    poly([0, 0], [1, 0], [1, 0.5], [0, 0.5]),
    poly([0, 0.5], [0.5, 0.5], [0.5, 1], [0, 1]),
    poly([0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]),
    circ(0.5, 0.5, 0.25),
  ]),
  styled('4-diag-stripes', 'Sọc chéo 4', [
    poly([0, 0], [0.32, 0], [0.18, 1], [0, 1]),
    poly([0.32, 0], [0.57, 0], [0.43, 1], [0.18, 1]),
    poly([0.57, 0], [0.82, 0], [0.68, 1], [0.43, 1]),
    poly([0.82, 0], [1, 0], [1, 1], [0.68, 1]),
  ]),

  styled('5-diamond', 'Kim cương giữa', [
    poly([0, 0], [0.5, 0], [0.5, 0.2], [0.2, 0.5], [0, 0.5]),
    poly([0.5, 0], [1, 0], [1, 0.5], [0.8, 0.5], [0.5, 0.2]),
    poly([1, 0.5], [1, 1], [0.5, 1], [0.5, 0.8], [0.8, 0.5]),
    poly([0, 0.5], [0.2, 0.5], [0.5, 0.8], [0.5, 1], [0, 1]),
    poly([0.5, 0.2], [0.8, 0.5], [0.5, 0.8], [0.2, 0.5]),
  ]),
  styled('5-circle-center', '4 + tròn giữa', [
    poly([0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5]),
    poly([0.5, 0], [1, 0], [1, 0.5], [0.5, 0.5]),
    poly([0, 0.5], [0.5, 0.5], [0.5, 1], [0, 1]),
    poly([0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]),
    circ(0.5, 0.5, 0.24),
  ]),
  styled('5-bubbles', 'Bong bóng 5', [circ(0.3, 0.22, 0.27), circ(0.74, 0.3, 0.22), circ(0.5, 0.52, 0.2), circ(0.26, 0.78, 0.22), circ(0.72, 0.78, 0.25)]),

  styled('6-diag-grid', 'Lưới chéo 6', [
    poly([0, 0], [0.38, 0], [0.33, 0.47], [0, 0.42]),
    poly([0.38, 0], [0.72, 0], [0.67, 0.52], [0.33, 0.47]),
    poly([0.72, 0], [1, 0], [1, 0.57], [0.67, 0.52]),
    poly([0, 0.42], [0.33, 0.47], [0.28, 1], [0, 1]),
    poly([0.33, 0.47], [0.67, 0.52], [0.62, 1], [0.28, 1]),
    poly([0.67, 0.52], [1, 0.57], [1, 1], [0.62, 1]),
  ]),
  styled('6-bubbles', 'Bong bóng 6', [circ(0.22, 0.2, 0.2), circ(0.62, 0.17, 0.17), circ(0.82, 0.42, 0.17), circ(0.42, 0.47, 0.22), circ(0.2, 0.78, 0.2), circ(0.66, 0.8, 0.2)]),
  styled('6-center-circle', '5 + tròn giữa', [
    poly([0, 0], [0.5, 0], [0.5, 0.4], [0, 0.4]),
    poly([0.5, 0], [1, 0], [1, 0.4], [0.5, 0.4]),
    poly([0, 0.4], [0.5, 0.4], [0.5, 1], [0, 1]),
    poly([0.5, 0.4], [1, 0.4], [1, 0.7], [0.5, 0.7]),
    poly([0.5, 0.7], [1, 0.7], [1, 1], [0.5, 1]),
    circ(0.5, 0.42, 0.2),
  ]),
];

export const COLLAGE_COUNTS = [2, 3, 4, 5, 6];

export const layoutById = (id: string) => COLLAGE_LAYOUTS.find((l) => l.id === id) ?? COLLAGE_LAYOUTS[0];
export const firstLayoutFor = (n: number) => COLLAGE_LAYOUTS.find((l) => l.cells.length === n) ?? COLLAGE_LAYOUTS[0];

export const ASPECTS = [
  { id: '1:1', label: 'Vuông 1:1', w: 1080, h: 1080 },
  { id: '4:5', label: 'Dọc 4:5', w: 1080, h: 1350 },
  { id: '3:4', label: 'Dọc 3:4', w: 1080, h: 1440 },
  { id: '9:16', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: '16:9', label: 'Ngang 16:9', w: 1920, h: 1080 },
] as const;
export type AspectId = (typeof ASPECTS)[number]['id'];

/** Toạ độ pixel của các ô, đã trừ lề ngoài và khoảng cách giữa các ô */
export function cellRects(layout: CollageLayout, W: number, H: number, padding: number, gap: number) {
  const iw = W - 2 * padding;
  const ih = H - 2 * padding;
  const eps = 1e-6;
  return layout.cells.map(([x, y, w, h]) => {
    const left = padding + x * iw + (x > eps ? gap / 2 : 0);
    const top = padding + y * ih + (y > eps ? gap / 2 : 0);
    const right = padding + (x + w) * iw - (x + w < 1 - eps ? gap / 2 : 0);
    const bottom = padding + (y + h) * ih - (y + h < 1 - eps ? gap / 2 : 0);
    return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
  });
}


/** Hình học thực tế (pixel) của một ô */
export interface CellGeom {
  /** Khung bao – dùng để đặt / thu phóng ảnh */
  box: { x: number; y: number; width: number; height: number };
  /** Điểm để hiện chữ gợi ý khi ô trống */
  center: { x: number; y: number };
  /** Vẽ đường viền hình dạng ô lên context (để cắt ảnh, vẽ viền chọn, vẽ khoảng cách) */
  trace: (ctx: { beginPath(): void; moveTo(x: number, y: number): void; lineTo(x: number, y: number): void; arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void; arc(x: number, y: number, r: number, a: number, b: number): void; closePath(): void }) => void;
}

export function layoutGeometry(layout: CollageLayout, W: number, H: number, padding: number, gap: number, radius: number): CellGeom[] {
  if (!layout.shapes) {
    return cellRects(layout, W, H, padding, gap).map((b) => ({
      box: b,
      center: { x: b.x + b.width / 2, y: b.y + b.height / 2 },
      trace: (ctx) => roundRectPath(ctx, b.x, b.y, b.width, b.height, radius),
    }));
  }
  const iw = W - 2 * padding;
  const ih = H - 2 * padding;
  const m = Math.min(iw, ih);
  return layout.shapes.map((s) => {
    if (s.kind === 'circle') {
      const cx = padding + s.cx * iw;
      const cy = padding + s.cy * ih;
      const r = s.r * m;
      return {
        box: { x: cx - r, y: cy - r, width: 2 * r, height: 2 * r },
        center: { x: cx, y: cy },
        trace: (ctx) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.closePath();
        },
      };
    }
    const pts = s.points.map(([x, y]) => [padding + x * iw, padding + y * ih] as Pt);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const box = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
    const center = { x: xs.reduce((a, b) => a + b, 0) / xs.length, y: ys.reduce((a, b) => a + b, 0) / ys.length };
    return { box, center, trace: (ctx) => polygonPath(ctx, pts, s.smooth ? 0 : radius) };
  });
}

type PathCtx = Parameters<CellGeom['trace']>[0];

function roundRectPath(ctx: PathCtx, x: number, y: number, w: number, h: number, r: number) {
  polygonPath(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r);
}

/** Đa giác bo góc (bán kính tự thu nhỏ theo độ dài cạnh) */
function polygonPath(ctx: PathCtx, pts: Pt[], r: number) {
  const n = pts.length;
  ctx.beginPath();
  if (r <= 0) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    return;
  }
  const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const lim = Math.min(Math.hypot(p[0] - prev[0], p[1] - prev[1]), Math.hypot(next[0] - p[0], next[1] - p[1])) / 2;
    ctx.arcTo(p[0], p[1], next[0], next[1], Math.min(r, lim));
  }
  ctx.closePath();
}
