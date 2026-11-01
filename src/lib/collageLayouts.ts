// Các kiểu bố cục ghép ảnh. Mỗi ô là [x, y, rộng, cao] theo tỉ lệ 0..1 của vùng ghép.

export type Cell = [number, number, number, number];

export interface CollageLayout {
  id: string;
  name: string;
  cells: Cell[];
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
