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

/** Ngôi sao / nhãn giảm giá răng cưa: `n` cánh, bán kính ngoài `r1`, trong `r2` */
export function starburst(cx: number, cy: number, r1: number, r2: number, n: number, rotate = -90): string {
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const a = ((rotate + (i * 180) / n) * Math.PI) / 180;
    const r = i % 2 ? r2 : r1;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join('L')}Z`;
}

/** Lục giác đứng (đỉnh nhọn ở trên) */
export function hexagon(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + i * 60) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join('L')}Z`;
}

/** Hình giọt mềm (blob) đi qua các điểm quanh tâm, bán kính r × (1 + lệch[i]) – nối mượt bằng Catmull-Rom */
export function blob(cx: number, cy: number, r: number, offsets: number[]): string {
  const n = offsets.length;
  const p = offsets.map((o, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * (1 + o) * Math.cos(a), cy + r * (1 + o) * Math.sin(a)];
  });
  const at = (i: number) => p[(i + n) % n];
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/** Số ngẫu nhiên có hạt giống – để hoạ tiết "ngẫu nhiên" luôn giống nhau mỗi lần vẽ */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hình chữ nhật mép giấy xé: các cạnh răng cưa ngẫu nhiên biên độ `amp` */
export function torn(x: number, y: number, w: number, h: number, amp: number, step: number, seed: number): string {
  const rnd = seeded(seed);
  const j = () => (rnd() * 2 - 1) * amp;
  const pts: string[] = [];
  for (let t = 0; t < w; t += step) pts.push(`${(x + t).toFixed(1)} ${(y + j()).toFixed(1)}`);
  for (let t = 0; t < h; t += step) pts.push(`${(x + w + j()).toFixed(1)} ${(y + t).toFixed(1)}`);
  for (let t = w; t > 0; t -= step) pts.push(`${(x + t).toFixed(1)} ${(y + h + j()).toFixed(1)}`);
  for (let t = h; t > 0; t -= step) pts.push(`${(x + j()).toFixed(1)} ${(y + t).toFixed(1)}`);
  return `M${pts.join('L')}Z`;
}

