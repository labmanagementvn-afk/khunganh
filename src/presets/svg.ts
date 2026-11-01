// Các hàm nhỏ để vẽ khung mẫu bằng SVG. Khung là ảnh trong suốt ở vùng "lỗ" để ảnh sản phẩm hiện ra bên dưới.

export function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}` +
    `A${k} ${k} 0 0 1 ${x + w - k} ${y + h}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`
  );
}

export function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`;
}

/** Hình vòm: nửa trên là nửa đường tròn, đáy vuông */
export function arch(x: number, y: number, w: number, h: number): string {
  const r = w / 2;
  return `M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}Z`;
}

/** Chiếc lá cách điệu, gốc tại (0,0), dài `len` theo trục x */
export function leaf(len: number, width: number): string {
  return `M0 0C${len * 0.25} ${-width} ${len * 0.75} ${-width} ${len} 0C${len * 0.75} ${width} ${len * 0.25} ${width} 0 0Z`;
}

/** Ngôi sao 4 cánh lấp lánh tại (cx,cy) */
export function sparkle(cx: number, cy: number, r: number): string {
  const k = r * 0.22;
  return `M${cx} ${cy - r}Q${cx + k} ${cy - k} ${cx + r} ${cy}Q${cx + k} ${cy + k} ${cx} ${cy + r}Q${cx - k} ${cy + k} ${cx - r} ${cy}Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`;
}

interface FrameParts {
  width: number;
  height: number;
  /** Đường viền vùng trong suốt (nơi ảnh sản phẩm hiện ra) */
  hole: string;
  /** <defs> bổ sung: gradient, pattern… */
  defs?: string;
  /** Nền và hoạ tiết – bị khoét theo `hole` */
  back: string;
  /** Hoạ tiết vẽ đè lên cả ảnh sản phẩm (viền, nhãn giá…) */
  front?: string;
}

export function frameSvg({ width, height, hole, defs = '', back, front = '' }: FrameParts): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<defs>${defs}<mask id="cut" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="#fff"/><path d="${hole}" fill="#000"/></mask></defs>` +
    `<g mask="url(#cut)">${back}</g>${front}</svg>`
  );
}
