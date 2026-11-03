// 20 mẫu quảng cáo sản phẩm theo xu hướng bài đăng mạng xã hội: vùng ảnh tròn / vòm / blob / lục giác,
// bục trưng bày, nhãn giảm giá, ruy băng "bán chạy", nút "Mua ngay", dải liên hệ… cho nhiều ngành hàng.
import type { Preset } from './presets';
import { arch, blob, circle, frameSvg, hexagon, leaf, roundRect, seeded, sparkle, starburst, torn } from './svg';
import { fixed, input } from './text';

const box = (cx: number, cy: number, r: number) => ({ x: cx - r, y: cy - r, width: r * 2, height: r * 2, radius: 0 });
const linear = (id: string, stops: string[], x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">` +
  stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('') +
  `</linearGradient>`;
const shadow = (id: string, color: string, opacity = 0.25, dy = 12, blur = 16) =>
  `<filter id="${id}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="${color}" flood-opacity="${opacity}"/></filter>`;
const leafAt = (x: number, y: number, deg: number, len: number, w: number, fill: string) =>
  `<path d="${leaf(len, w)}" fill="${fill}" transform="translate(${x} ${y}) rotate(${deg})"/>`;

// 1. Bục trưng bày pastel ----------------------------------------------------
const podium: Preset = (() => {
  const W = 1080, H = 1350;
  const cx = 540, cy = 540, r = 320;
  return {
    id: 'promo-podium',
    name: 'Bục trưng bày pastel',
    category: 'Làm đẹp',
    description: 'Ảnh tròn đặt trên bục trụ tông hồng đất – kiểu ảnh "sản phẩm mới" của các thương hiệu mỹ phẩm.',
    width: W,
    height: H,
    background: '#f6e7e1',
    photoSlot: box(cx, cy, r),
    svg: frameSvg({
      width: W,
      height: H,
      hole: circle(cx, cy, r),
      defs: linear('bg', ['#fbefe9', '#f1d9cf']) + linear('pd', ['#f7e3da', '#e7c3b5'], 1, 0),
      back:
        `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
        `<circle cx="${cx}" cy="${cy}" r="${r + 70}" fill="#ffffff" opacity="0.45"/>` +
        `<circle cx="150" cy="1180" r="220" fill="#e9c9bc" opacity="0.5"/><circle cx="960" cy="160" r="120" fill="#e9c9bc" opacity="0.5"/>`,
      front:
        `<rect x="280" y="870" width="520" height="110" fill="url(#pd)"/>` +
        `<ellipse cx="540" cy="980" rx="260" ry="42" fill="#e2b8a8"/>` +
        `<ellipse cx="540" cy="870" rx="260" ry="42" fill="#fbeee8"/>` +
        `<path d="${sparkle(905, 300, 34)}" fill="#b4746a"/><path d="${sparkle(180, 420, 22)}" fill="#b4746a"/><path d="${sparkle(860, 760, 18)}" fill="#ffffff"/>` +
        `<path d="${roundRect(380, 1142, 320, 84, 42)}" fill="#b4746a"/>`,
    }),
    texts: [
      fixed('t1', { text: 'NEW ARRIVAL', x: 0, y: 92, width: W, fontSize: 30, fontFamily: 'Montserrat', fill: '#b4746a', align: 'center', letterSpacing: 12 }),
      input('t2', 'Tên sản phẩm', { text: 'Serum Hoa Hồng', x: 60, y: 1050, width: 960, fontSize: 66, fontFamily: 'Playfair Display', fill: '#5b3a36', align: 'center' }),
      input('t3', 'Giá', { text: '450.000đ', x: 380, y: 1162, width: 320, fontSize: 40, fill: '#ffffff', align: 'center' }),
      input('t4', 'Tên shop', { text: '@tenshop', x: 0, y: 1272, width: W, fontSize: 26, fontStyle: 'normal', fill: '#9a7b74', align: 'center' }),
    ],
    sample: { from: '#fde7e2', to: '#f3c1b6', emoji: '🧴' },
  };
})();

// 2. Blob thiên nhiên ----------------------------------------------------------
const organic: Preset = (() => {
  const W = 1080, H = 1350;
  const offsets = [0.02, 0.1, -0.04, 0.08, -0.02, 0.12, -0.06, 0.06];
  return {
    id: 'promo-organic-blob',
    name: 'Blob thiên nhiên',
    category: 'Sức khoẻ',
    description: 'Vùng ảnh dạng giọt mềm, lá xanh ôm quanh – hợp trà, thảo mộc, thực phẩm sạch.',
    width: W,
    height: H,
    background: '#eef3e8',
    photoSlot: { x: 100, y: 120, width: 880, height: 900, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: blob(540, 570, 390, offsets),
      back:
        `<rect width="${W}" height="${H}" fill="#eef3e8"/>` +
        `<path d="${blob(540, 580, 430, offsets.map((o) => o * 0.6))}" fill="#dbe7cf"/>`,
      front:
        leafAt(150, 930, -40, 230, 52, '#4f7a43') + leafAt(170, 960, -75, 170, 40, '#7aa66a') +
        leafAt(930, 210, 140, 220, 50, '#4f7a43') + leafAt(900, 190, 175, 150, 36, '#7aa66a') +
        `<path d="${roundRect(80, 1228, 320, 80, 40)}" fill="#2f4a2a"/>`,
    }),
    texts: [
      input('t1', 'Tên sản phẩm', { text: 'Trà thảo mộc an nhiên', x: 80, y: 1060, width: 920, fontSize: 58, fill: '#2f4a2a' }),
      input('t2', 'Mô tả', { text: '100% hữu cơ · Không chất bảo quản', x: 80, y: 1142, width: 920, fontSize: 30, fontStyle: 'normal', fill: '#5d7652' }),
      fixed('t3', { text: 'ĐẶT NGAY', x: 80, y: 1252, width: 320, fontSize: 30, fill: '#ffffff', align: 'center', letterSpacing: 3 }),
      input('t4', 'Hotline', { text: '0909 123 456', x: 420, y: 1246, width: 580, fontSize: 38, fill: '#2f4a2a', align: 'right' }),
    ],
    sample: { from: '#e4efd8', to: '#a9c79a', emoji: '🍵' },
  };
})();

// 3. Sale cắt chéo -------------------------------------------------------------
const diagonalSale: Preset = (() => {
  const W = 1080, H = 1350;
  return {
    id: 'promo-diagonal-sale',
    name: 'Sale cắt chéo',
    category: 'Sản phẩm',
    description: 'Ảnh lớn cắt chéo, nền đen chữ vàng: % giảm cực to và nút "Mua ngay".',
    width: W,
    height: H,
    background: '#111111',
    photoSlot: { x: 0, y: 0, width: W, height: 1000, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V820L0 1000Z`,
      back: `<rect width="${W}" height="${H}" fill="#111111"/><path d="M0 1000L${W} 820V870L0 1050Z" fill="#ffd400"/>`,
      front:
        `<path d="${roundRect(48, 48, 250, 64, 32)}" fill="#111111" fill-opacity="0.7"/>` +
        `<path d="${roundRect(700, 1234, 320, 78, 39)}" fill="#ffd400"/>`,
    }),
    texts: [
      input('t1', 'Tên shop', { text: '@tenshop', x: 48, y: 66, width: 250, fontSize: 26, fill: '#ffffff', align: 'center' }),
      fixed('t2', { text: 'GIẢM ĐẾN', x: 60, y: 1082, width: 400, fontSize: 40, fontFamily: 'Oswald', fill: '#ffd400', letterSpacing: 4 }),
      input('t3', 'Giảm giá', { text: '50%', x: 52, y: 1128, width: 460, fontSize: 180, fontFamily: 'Oswald', fill: '#ffffff' }),
      input('t4', 'Tên sản phẩm', { text: 'Giày chạy bộ X1', x: 480, y: 1050, width: 540, fontSize: 42, fill: '#ffffff', align: 'right' }),
      input('t5', 'Giá', { text: '690.000đ', x: 480, y: 1120, width: 540, fontSize: 62, fontFamily: 'Oswald', fill: '#ffd400', align: 'right' }),
      fixed('t6', { text: 'MUA NGAY  →', x: 700, y: 1256, width: 320, fontSize: 32, fill: '#111111', align: 'center' }),
    ],
    sample: { from: '#e9eef5', to: '#9fb2c8', emoji: '👟' },
  };
})();

// 4. Ảnh tròn & nhãn giảm giá (vuông) -------------------------------------------
const circleBadge: Preset = (() => {
  const W = 1080, H = 1080;
  const cx = 540, cy = 490, r = 370;
  return {
    id: 'promo-circle-badge',
    name: 'Ảnh tròn – Nhãn giảm giá',
    category: 'Sản phẩm',
    description: 'Khung vuông, ảnh tròn viền trắng và nhãn răng cưa đỏ báo % giảm giá.',
    width: W,
    height: H,
    background: '#ffefe0',
    photoSlot: box(cx, cy, r),
    svg: frameSvg({
      width: W,
      height: H,
      hole: circle(cx, cy, r),
      defs: linear('bg', ['#fff4ea', '#ffd9bf']) + shadow('sh', '#a3360f', 0.3, 8, 10),
      back:
        `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
        Array.from({ length: 9 }, (_, i) => `<circle cx="${70 + (i % 3) * 36}" cy="${70 + Math.floor(i / 3) * 36}" r="7" fill="#ff8a5b"/>`).join('') +
        Array.from({ length: 9 }, (_, i) => `<circle cx="${938 + (i % 3) * 36}" cy="${938 + Math.floor(i / 3) * 36}" r="7" fill="#ff8a5b"/>`).join(''),
      front:
        `<circle cx="${cx}" cy="${cy}" r="${r + 8}" fill="none" stroke="#ffffff" stroke-width="16"/>` +
        `<path d="${starburst(860, 230, 140, 118, 20)}" fill="#ff3b30" filter="url(#sh)"/>`,
    }),
    texts: [
      fixed('t1', { text: 'GIẢM', x: 760, y: 168, width: 200, fontSize: 30, fill: '#ffffff', align: 'center', letterSpacing: 4 }),
      input('t2', 'Giảm giá', { text: '-30%', x: 750, y: 202, width: 220, fontSize: 76, fontFamily: 'Oswald', fill: '#ffffff', align: 'center' }),
      input('t3', 'Tên sản phẩm', { text: 'Bình giữ nhiệt 500ml', x: 60, y: 895, width: 960, fontSize: 50, fill: '#2a1c14', align: 'center' }),
      input('t4', 'Giá', { text: '189.000đ', x: 60, y: 966, width: 960, fontSize: 46, fill: '#ff3b30', align: 'center' }),
    ],
    sample: { from: '#e7f1ff', to: '#a8c6ef', emoji: '🥤' },
  };
})();

// 5. Sóng mát – Đồ uống ----------------------------------------------------------
const wave: Preset = (() => {
  const W = 1080, H = 1350;
  const waveD = (y: number) => `M${W} ${y}C900 ${y + 80} 720 ${y - 80} 540 ${y}C360 ${y + 80} 180 ${y - 80} 0 ${y}`;
  return {
    id: 'promo-wave-drink',
    name: 'Sóng mát – Đồ uống',
    category: 'Ẩm thực',
    description: 'Ảnh tràn phía trên với mép lượn sóng, tên món chữ viết tay – hợp quán trà, cà phê, nước ép.',
    width: W,
    height: H,
    background: '#fff6ea',
    photoSlot: { x: 0, y: 0, width: W, height: 940, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V860C900 940 720 780 540 860C360 940 180 780 0 860Z`,
      back:
        `<rect width="${W}" height="${H}" fill="#fff6ea"/>` +
        `<circle cx="80" cy="1200" r="40" fill="#ffd8b8"/><circle cx="150" cy="1290" r="18" fill="#ffd8b8"/>` +
        `<circle cx="1000" cy="1130" r="30" fill="#ffd8b8"/><circle cx="950" cy="1240" r="14" fill="#ffd8b8"/>`,
      front: `<path d="${waveD(884)}" fill="none" stroke="#ff8a3d" stroke-width="10" stroke-linecap="round"/>`,
    }),
    texts: [
      fixed('t1', { text: 'MENU MỚI', x: 0, y: 975, width: W, fontSize: 28, fontFamily: 'Montserrat', fill: '#ff8a3d', align: 'center', letterSpacing: 10 }),
      input('t2', 'Tên món', { text: 'Trà đào cam sả', x: 40, y: 1012, width: 1000, fontSize: 78, fontFamily: 'Pacifico', fontStyle: 'normal', fill: '#3b2316', align: 'center' }),
      input('t3', 'Giá', { text: '45.000đ', x: 0, y: 1150, width: W, fontSize: 54, fill: '#ff8a3d', align: 'center' }),
      input('t4', 'Hotline', { text: 'Giao tận nơi: 0909 123 456', x: 0, y: 1250, width: W, fontSize: 30, fontStyle: 'normal', fill: '#7a6a5d', align: 'center' }),
    ],
    sample: { from: '#ffe0c2', to: '#ff9f68', emoji: '🧋' },
  };
})();

// 6. Giấy xé – Món ngon --------------------------------------------------------------
const tornPaper: Preset = (() => {
  const W = 1080, H = 1350;
  return {
    id: 'promo-torn-paper',
    name: 'Giấy xé – Món ngon',
    category: 'Ẩm thực',
    description: 'Ảnh dán trên mảnh giấy xé, băng dính giấy và nền nâu đậm ấm cúng.',
    width: W,
    height: H,
    background: '#2a211c',
    photoSlot: { x: 70, y: 70, width: 940, height: 930, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: torn(90, 90, 900, 890, 6, 22, 7),
      back:
        `<rect width="${W}" height="${H}" fill="#2a211c"/>` +
        Array.from({ length: 60 }, (_, i) => {
          const rnd = seeded(100 + i);
          return `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(1 + rnd() * 2).toFixed(1)}" fill="#ffffff" opacity="0.06"/>`;
        }).join('') +
        `<path d="${torn(60, 60, 960, 950, 9, 26, 3)}" fill="#f4ecdf"/>`,
      front:
        `<rect x="430" y="36" width="220" height="64" fill="#e9dcc2" opacity="0.85" transform="rotate(-4 540 68)"/>` +
        `<rect x="420" y="1180" width="240" height="3" fill="#e9b44c"/>`,
    }),
    texts: [
      input('t1', 'Tên món', { text: 'Bánh mì chảo', x: 40, y: 1050, width: 1000, fontSize: 76, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#f4ecdf', align: 'center' }),
      input('t2', 'Giá', { text: '55.000đ', x: 0, y: 1200, width: W, fontSize: 54, fontFamily: 'Oswald', fill: '#e9b44c', align: 'center' }),
      input('t3', 'Địa chỉ', { text: '12 Lê Lợi, Q.1 · 0909 123 456', x: 0, y: 1282, width: W, fontSize: 28, fontStyle: 'normal', fill: '#bfb3a5', align: 'center' }),
    ],
    sample: { from: '#f3d2a2', to: '#b5651d', emoji: '🥖' },
  };
})();

// 7. Memphis rực rỡ -------------------------------------------------------------------
const memphis: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 140, y: 200, width: 800, height: 860, radius: 40 };
  const squiggle = (x: number, y: number, c: string) =>
    `<path d="M${x} ${y}q25 -30 50 0t50 0t50 0t50 0" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`;
  return {
    id: 'promo-memphis',
    name: 'Memphis rực rỡ',
    category: 'Thời trang',
    description: 'Hoạ tiết hình học vui mắt, viền đen bóng đổ cứng – trẻ trung cho thời trang, phụ kiện.',
    width: W,
    height: H,
    background: '#fff3c4',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back:
        `<rect width="${W}" height="${H}" fill="#fff3c4"/>` +
        squiggle(40, 170, '#ff5c8a') + squiggle(800, 1300, '#2ec4b6') +
        `<path d="M980 260l60 100h-120z" fill="#6c4cff"/><path d="M60 1000l50 86h-100z" fill="#2ec4b6"/>` +
        `<circle cx="1010" cy="760" r="44" fill="#ff5c8a"/><path d="M40 560a60 60 0 0 1 120 0z" fill="#6c4cff"/>` +
        Array.from({ length: 12 }, (_, i) => `<circle cx="${40 + (i % 4) * 26}" cy="${300 + Math.floor(i / 4) * 26}" r="5" fill="#111"/>`).join('') +
        `<path d="${roundRect(slot.x + 24, slot.y + 24, slot.width, slot.height, slot.radius)}" fill="#111111"/>`,
      front: `<path d="${roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius)}" fill="none" stroke="#111111" stroke-width="6"/>`,
    }),
    texts: [
      fixed('t1', { text: 'NEW COLLECTION', x: 0, y: 70, width: W, fontSize: 84, fontFamily: 'Oswald', fill: '#111111', align: 'center', letterSpacing: 4 }),
      input('t2', 'Tên sản phẩm', { text: 'Áo thun Basic', x: 140, y: 1110, width: 560, fontSize: 54, fill: '#111111' }),
      input('t3', 'Giá', { text: '259K', x: 640, y: 1100, width: 300, fontSize: 86, fontFamily: 'Oswald', fill: '#ff5c8a', align: 'right' }),
      input('t4', 'Tên shop', { text: '@tenshop', x: 140, y: 1190, width: 560, fontSize: 30, fontStyle: 'normal', fill: '#5a4a2a' }),
    ],
    sample: { from: '#ffd6e3', to: '#ff8fb1', emoji: '👕' },
  };
})();

// 8. Vòm boho – Nội thất ----------------------------------------------------------------
const boho: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 190, y: 140, width: 700, height: 860, radius: 0 };
  const ring = (r: number, c: string) => `<path d="M${120 - r} 1350a${r} ${r} 0 0 1 ${r * 2} 0" fill="none" stroke="${c}" stroke-width="34"/>`;
  return {
    id: 'promo-boho-arch',
    name: 'Vòm boho – Nội thất',
    category: 'Nội thất',
    description: 'Khung vòm tông đất nung, mặt trời và cầu vồng boho – ấm áp cho đồ nội thất, decor.',
    width: W,
    height: H,
    background: '#efe4d6',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: arch(slot.x, slot.y, slot.width, slot.height),
      back:
        `<rect width="${W}" height="${H}" fill="#efe4d6"/>` +
        `<circle cx="900" cy="210" r="140" fill="#d9825b"/>` +
        ring(190, '#c86b48') + ring(150, '#e3a77d') + ring(110, '#9aa58a'),
      front:
        `<path d="${arch(slot.x - 22, slot.y - 22, slot.width + 44, slot.height + 44)}" fill="none" stroke="#c86b48" stroke-width="4"/>` +
        leafAt(930, 900, -120, 160, 34, '#7d8a63') + leafAt(940, 900, -80, 140, 30, '#9aa58a') +
        `<path d="${roundRect(390, 1192, 300, 84, 42)}" fill="#c86b48"/>`,
    }),
    texts: [
      input('t1', 'Tên sản phẩm', { text: 'Ghế mây Bali', x: 60, y: 1030, width: 960, fontSize: 68, fontFamily: 'Playfair Display', fill: '#4a3426', align: 'center' }),
      input('t2', 'Mô tả', { text: 'Mây tự nhiên · Đan thủ công', x: 60, y: 1122, width: 960, fontSize: 30, fontStyle: 'normal', fill: '#8a6e5a', align: 'center' }),
      input('t3', 'Giá', { text: '2.450.000đ', x: 390, y: 1214, width: 300, fontSize: 38, fill: '#ffffff', align: 'center' }),
    ],
    sample: { from: '#f1dcc4', to: '#c99a72', emoji: '🪑' },
  };
})();

// 9. Lục giác công nghệ ----------------------------------------------------------------------
const hexTech: Preset = (() => {
  const W = 1080, H = 1350;
  const cx = 540, cy = 555, r = 415;
  const w = Math.round(r * Math.sqrt(3));
  const circuits = [
    'M0 220H120L170 270H260', 'M0 900H90L140 850H230', 'M1080 300H960L910 350H820', 'M1080 980H990L940 930H860',
    'M60 0V80L110 130', 'M1020 1350V1270L970 1220',
  ]
    .map((d) => `<path d="${d}" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.45"/>`)
    .join('');
  return {
    id: 'promo-hex-tech',
    name: 'Lục giác công nghệ',
    category: 'Công nghệ',
    description: 'Nền tối mạch điện, ảnh lục giác viền phát sáng – hợp điện thoại, tai nghe, đồ điện tử.',
    width: W,
    height: H,
    background: '#0b1020',
    photoSlot: { x: cx - w / 2, y: cy - r, width: w, height: r * 2, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: hexagon(cx, cy, r),
      defs:
        linear('bg', ['#0b1020', '#111a35']) +
        `<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
      back:
        `<rect width="${W}" height="${H}" fill="url(#bg)"/>${circuits}` +
        Array.from({ length: 6 }, (_, i) => `<circle cx="${[260, 230, 820, 860, 110, 970][i]}" cy="${[270, 850, 350, 930, 130, 1220][i]}" r="7" fill="#22d3ee" opacity="0.7"/>`).join(''),
      front: `<path d="${hexagon(cx, cy, r + 20)}" fill="none" stroke="#22d3ee" stroke-width="6" filter="url(#glow)"/>`,
    }),
    texts: [
      fixed('t1', { text: 'CÔNG NGHỆ MỚI', x: 0, y: 64, width: W, fontSize: 26, fontFamily: 'Montserrat', fill: '#22d3ee', align: 'center', letterSpacing: 10 }),
      input('t2', 'Tên sản phẩm', { text: 'Tai nghe ANC Pro', x: 40, y: 1012, width: 1000, fontSize: 60, fill: '#ffffff', align: 'center' }),
      input('t3', 'Thông số', { text: 'Chống ồn · Pin 40 giờ · Bluetooth 5.3', x: 40, y: 1092, width: 1000, fontSize: 28, fontStyle: 'normal', fill: '#94a3b8', align: 'center' }),
      input('t4', 'Giá', { text: '1.290.000đ', x: 0, y: 1150, width: W, fontSize: 66, fontFamily: 'Oswald', fill: '#22d3ee', align: 'center' }),
      input('t5', 'Hotline', { text: 'Hotline: 0909 123 456', x: 0, y: 1268, width: W, fontSize: 28, fontStyle: 'normal', fill: '#64748b', align: 'center' }),
    ],
    sample: { from: '#1e293b', to: '#334155', emoji: '🎧' },
  };
})();

// 10. Big Sale – băng cảnh báo -------------------------------------------------------------
const bigSale: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 60, y: 230, width: 960, height: 760, radius: 24 };
  return {
    id: 'promo-big-sale',
    name: 'Big Sale – Băng vàng đen',
    category: 'Sản phẩm',
    description: 'Đen – vàng mạnh mẽ, dải băng sọc chạy ngang cho các đợt xả kho, giảm giá lớn.',
    width: W,
    height: H,
    background: '#111111',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: `<pattern id="tape" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="24" height="48" fill="#111111"/></pattern>`,
      back: `<rect width="${W}" height="${H}" fill="#111111"/>`,
      front:
        `<rect x="0" y="1024" width="${W}" height="84" fill="#ffd400"/>` +
        `<rect x="0" y="1024" width="110" height="84" fill="url(#tape)"/><rect x="${W - 110}" y="1024" width="110" height="84" fill="url(#tape)"/>` +
        `<rect x="0" y="0" width="${W}" height="18" fill="#ffd400"/><rect x="0" y="0" width="${W}" height="18" fill="url(#tape)"/>` +
        `<rect x="0" y="${H - 18}" width="${W}" height="18" fill="#ffd400"/><rect x="0" y="${H - 18}" width="${W}" height="18" fill="url(#tape)"/>`,
    }),
    texts: [
      fixed('t1', { text: 'BIG SALE', x: 0, y: 44, width: W, fontSize: 160, fontFamily: 'Oswald', fill: '#ffd400', align: 'center', letterSpacing: 8 }),
      input('t2', 'Khuyến mãi', { text: 'GIẢM ĐẾN 70% · CHỈ HÔM NAY', x: 110, y: 1040, width: 860, fontSize: 46, fontFamily: 'Oswald', fill: '#111111', align: 'center' }),
      input('t3', 'Tên sản phẩm', { text: 'Đồng hồ thể thao', x: 60, y: 1150, width: 600, fontSize: 44, fill: '#ffffff' }),
      input('t4', 'Hotline', { text: '0909 123 456', x: 60, y: 1222, width: 600, fontSize: 30, fontStyle: 'normal', fill: '#a3a3a3' }),
      input('t5', 'Giá', { text: '399.000đ', x: 560, y: 1146, width: 460, fontSize: 84, fontFamily: 'Oswald', fill: '#ffd400', align: 'right' }),
    ],
    sample: { from: '#e5e7eb', to: '#9ca3af', emoji: '⌚' },
  };
})();

// 11. Ruy băng "Bán chạy" ----------------------------------------------------------------
const bestSeller: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 90, y: 90, width: 900, height: 960, radius: 48 };
  const stars = Array.from({ length: 5 }, (_, i) => `<path d="${starburst(110 + i * 44, 1276, 19, 8, 5)}" fill="#f5a524"/>`).join('');
  // Chữ "BÁN CHẠY" xoay 45°: tính góc trên trái để tâm chữ nằm giữa dải chéo
  const tw = 260, th = 30, a = Math.PI / 4;
  const tcx = 893, tcy = 187;
  const tx = tcx - ((tw / 2) * Math.cos(a) - (th / 2) * Math.sin(a));
  const ty = tcy - ((tw / 2) * Math.sin(a) + (th / 2) * Math.cos(a));
  return {
    id: 'promo-best-seller',
    name: 'Ruy băng bán chạy',
    category: 'Sản phẩm',
    description: 'Dải chéo "Bán chạy" ở góc ảnh, đánh giá 5 sao và nút mua – tăng niềm tin cho sản phẩm hot.',
    width: W,
    height: H,
    background: '#f3efe9',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: `<clipPath id="slot"><path d="${roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius)}"/></clipPath>`,
      back: `<rect width="${W}" height="${H}" fill="#f3efe9"/>`,
      front:
        `<path d="M740 90H850L990 230V340Z" fill="#c8102e" clip-path="url(#slot)"/>` +
        stars +
        `<path d="${roundRect(690, 1180, 300, 84, 42)}" fill="#1d1d1f"/>`,
    }),
    texts: [
      fixed('t1', { text: 'BÁN CHẠY', x: tx, y: ty, width: tw, fontSize: th, fontFamily: 'Oswald', fill: '#ffffff', align: 'center', letterSpacing: 4, rotation: 45 }),
      input('t2', 'Tên sản phẩm', { text: 'Nồi chiên không dầu 6L', x: 90, y: 1082, width: 900, fontSize: 50, fill: '#1d1d1f' }),
      input('t3', 'Giá', { text: '1.590.000đ', x: 90, y: 1166, width: 580, fontSize: 60, fill: '#c8102e' }),
      input('t4', 'Đánh giá', { text: '4.9/5 · 2,3k đã bán', x: 340, y: 1262, width: 340, fontSize: 26, fontStyle: 'normal', fill: '#6b6b6b' }),
      fixed('t5', { text: 'MUA NGAY', x: 690, y: 1204, width: 300, fontSize: 34, fill: '#ffffff', align: 'center', letterSpacing: 2 }),
    ],
    sample: { from: '#f1f5f9', to: '#cbd5e1', emoji: '🍳' },
  };
})();

// 12. Thẻ treo giá – Thời trang ------------------------------------------------------------------
const hangTag: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 60, y: 60, width: 960, height: 1000, radius: 12 };
  return {
    id: 'promo-hang-tag',
    name: 'Thẻ treo giá',
    category: 'Thời trang',
    description: 'Ảnh lớn trên nền vải lanh, thẻ giá treo bằng dây – như tag mác quần áo thật.',
    width: W,
    height: H,
    background: '#e9e4dc',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: shadow('sh', '#3b3530', 0.3, 10, 12),
      back:
        `<rect width="${W}" height="${H}" fill="#e9e4dc"/>` +
        Array.from({ length: 34 }, (_, i) => `<rect x="0" y="${i * 40}" width="${W}" height="1" fill="#000" opacity="0.03"/>`).join(''),
      front:
        `<path d="M610 1040C560 1010 540 950 560 900" fill="none" stroke="#8a7f72" stroke-width="3"/>` +
        `<path d="M560 1040L640 950H1010V1130H640Z" fill="#fffaf0" filter="url(#sh)"/>` +
        `<circle cx="612" cy="1040" r="13" fill="#e9e4dc" stroke="#cfc6b8" stroke-width="2"/>`,
    }),
    texts: [
      fixed('t1', { text: 'GIÁ BÁN', x: 660, y: 972, width: 330, fontSize: 22, fontFamily: 'Montserrat', fill: '#8a7f72', letterSpacing: 6 }),
      input('t2', 'Giá', { text: '389.000đ', x: 660, y: 1006, width: 340, fontSize: 64, fontFamily: 'Playfair Display', fill: '#2b2b2b' }),
      input('t3', 'Mã sản phẩm', { text: 'Mã: AC-989', x: 660, y: 1088, width: 330, fontSize: 24, fontStyle: 'normal', fill: '#8a7f72' }),
      input('t4', 'Tên sản phẩm', { text: 'Váy linen mùa hè', x: 70, y: 1150, width: 600, fontSize: 64, fontFamily: 'Dancing Script', fill: '#3b3530' }),
      input('t5', 'Tên shop', { text: '@tenshop', x: 70, y: 1256, width: 600, fontSize: 28, fontStyle: 'normal', fill: '#8a7f72' }),
    ],
    sample: { from: '#f3ede4', to: '#cdbfae', emoji: '👗' },
  };
})();

// 13. Mây xanh – Mẹ & bé ----------------------------------------------------------------------------
const babyCloud: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 120, y: 170, width: 840, height: 840, radius: 120 };
  const cloud = (x: number, y: number, s: number, op = 1) =>
    `<g fill="#ffffff" opacity="${op}" transform="translate(${x} ${y}) scale(${s})">` +
    `<circle cx="0" cy="0" r="46"/><circle cx="52" cy="-22" r="58"/><circle cx="112" cy="0" r="44"/><rect x="0" y="0" width="112" height="44"/></g>`;
  return {
    id: 'promo-baby-cloud',
    name: 'Mây xanh – Mẹ & bé',
    category: 'Mẹ & bé',
    description: 'Xanh pastel dịu, mây trắng và sao nhỏ – dễ thương cho đồ sơ sinh, đồ chơi, sữa.',
    width: W,
    height: H,
    background: '#e8f4fb',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back:
        `<rect width="${W}" height="${H}" fill="#e8f4fb"/>` + cloud(820, 1240, 1.1, 0.8) + cloud(40, 1300, 0.9, 0.8) +
        `<path d="${sparkle(80, 260, 22)}" fill="#ffd166"/><path d="${sparkle(1010, 150, 26)}" fill="#ffd166"/><path d="${sparkle(1020, 640, 16)}" fill="#ffffff"/>`,
      front: cloud(80, 980, 1.3) + cloud(820, 990, 1.1) + `<path d="${roundRect(380, 1215, 320, 84, 42)}" fill="#ff9f8a"/>`,
    }),
    texts: [
      fixed('t1', { text: 'Dành cho bé yêu', x: 0, y: 46, width: W, fontSize: 60, fontFamily: 'Pacifico', fontStyle: 'normal', fill: '#5b8fb9', align: 'center' }),
      input('t2', 'Tên sản phẩm', { text: 'Bộ body cotton', x: 60, y: 1080, width: 960, fontSize: 56, fill: '#34506b', align: 'center' }),
      input('t3', 'Mô tả', { text: 'Size 0–24 tháng · Vải organic', x: 60, y: 1154, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#6b8aa3', align: 'center' }),
      input('t4', 'Giá', { text: '199.000đ', x: 380, y: 1236, width: 320, fontSize: 40, fill: '#ffffff', align: 'center' }),
    ],
    sample: { from: '#fdf2e9', to: '#bfe0f5', emoji: '🧸' },
  };
})();

// 14. Nhà thuốc – Sức khoẻ ------------------------------------------------------------------------
const pharmacy: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 60, y: 230, width: 960, height: 760, radius: 28 };
  const teal = '#0fa3a3';
  return {
    id: 'promo-pharmacy',
    name: 'Nhà thuốc – Sức khoẻ',
    category: 'Sức khoẻ',
    description: 'Đầu trang xanh ngọc có biểu tượng chữ thập, bố cục sạch sẽ cho nhà thuốc, thực phẩm chức năng.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back:
        `<rect width="${W}" height="${H}" fill="#ffffff"/><rect width="${W}" height="200" fill="${teal}"/>` +
        `<circle cx="1000" cy="40" r="120" fill="#ffffff" opacity="0.08"/>` +
        `<path d="M92 68h36v36h36v36h-36v36h-36v-36h-36v-36h36z" fill="#ffffff"/>` +
        `<rect y="1250" width="${W}" height="100" fill="#e6f6f6"/>`,
    }),
    texts: [
      input('t1', 'Tên nhà thuốc', { text: 'Nhà thuốc An Tâm', x: 200, y: 54, width: 840, fontSize: 50, fill: '#ffffff' }),
      fixed('t2', { text: 'Chăm sóc sức khoẻ gia đình bạn', x: 200, y: 118, width: 840, fontSize: 28, fontStyle: 'normal', fill: '#d8f3f3' }),
      input('t3', 'Tên sản phẩm', { text: 'Vitamin tổng hợp', x: 60, y: 1022, width: 600, fontSize: 52, fill: '#0d3b3b' }),
      input('t4', 'Giá', { text: '320.000đ', x: 600, y: 1022, width: 420, fontSize: 52, fill: teal, align: 'right' }),
      input('t5', 'Mô tả', { text: 'Hộp 60 viên · Dùng trong 2 tháng', x: 60, y: 1100, width: 960, fontSize: 30, fontStyle: 'normal', fill: '#5c7474' }),
      fixed('t6', { text: 'HOTLINE', x: 60, y: 1288, width: 160, fontSize: 24, fontFamily: 'Montserrat', fill: teal, letterSpacing: 4 }),
      input('t7', 'Hotline', { text: '1900 1234', x: 210, y: 1280, width: 380, fontSize: 36, fill: '#0d3b3b' }),
      fixed('t8', { text: 'Tư vấn miễn phí 24/7', x: 600, y: 1286, width: 420, fontSize: 28, fontStyle: 'normal', fill: '#5c7474', align: 'right' }),
    ],
    sample: { from: '#e0f7f4', to: '#9fdcd3', emoji: '💊' },
  };
})();

// 15. Chia đôi – Nội thất (vuông) -------------------------------------------------------------------
const splitFurniture: Preset = (() => {
  const W = 1080, H = 1080;
  const gold = '#c9b79c';
  return {
    id: 'promo-split-furniture',
    name: 'Chia đôi – Nội thất',
    category: 'Nội thất',
    description: 'Ảnh bên trái, bảng thông tin xanh rêu bên phải – sang trọng cho sofa, bàn ghế, đèn.',
    width: W,
    height: H,
    background: '#2f3e36',
    photoSlot: { x: 0, y: 0, width: 620, height: H, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H620V${H}H0Z`,
      back: `<rect width="${W}" height="${H}" fill="#2f3e36"/><rect x="660" y="330" width="60" height="3" fill="${gold}"/>`,
      front: `<rect x="620" y="0" width="6" height="${H}" fill="${gold}"/><path d="${roundRect(660, 820, 300, 76, 38)}" fill="none" stroke="${gold}" stroke-width="3"/>`,
    }),
    texts: [
      fixed('t1', { text: 'BỘ SƯU TẬP', x: 660, y: 120, width: 380, fontSize: 22, fontFamily: 'Montserrat', fill: gold, letterSpacing: 6 }),
      input('t2', 'Tên sản phẩm', { text: 'Sofa Nordic', x: 660, y: 160, width: 390, fontSize: 66, fontFamily: 'Playfair Display', fill: '#f3ede4' }),
      input('t3', 'Mô tả', { text: 'Khung gỗ sồi tự nhiên, vải bố chống thấm, bảo hành 5 năm', x: 660, y: 370, width: 380, fontSize: 28, fontStyle: 'normal', fill: '#d4cbbd' }),
      fixed('t4', { text: 'GIÁ CHỈ TỪ', x: 660, y: 620, width: 380, fontSize: 22, fontFamily: 'Montserrat', fill: gold, letterSpacing: 4 }),
      input('t5', 'Giá', { text: '12.900.000đ', x: 660, y: 656, width: 400, fontSize: 60, fontFamily: 'Oswald', fill: '#f3ede4' }),
      fixed('t6', { text: 'XEM NGAY', x: 660, y: 842, width: 300, fontSize: 28, fill: gold, align: 'center', letterSpacing: 4 }),
      input('t7', 'Tên shop', { text: '@tenshop', x: 660, y: 990, width: 380, fontSize: 26, fontStyle: 'normal', fill: '#9aa79f' }),
    ],
    sample: { from: '#e8e2d8', to: '#b5a690', emoji: '🛋️' },
  };
})();

// 16. Đĩa đá – Nhà hàng (vuông) ---------------------------------------------------------------------
const slateDish: Preset = (() => {
  const W = 1080, H = 1080;
  const cx = 540, cy = 450, r = 330;
  return {
    id: 'promo-slate-dish',
    name: 'Đĩa đá – Nhà hàng',
    category: 'Ẩm thực',
    description: 'Món ăn trong đĩa tròn trên nền đá đen, lá thơm trang trí – cao cấp cho nhà hàng.',
    width: W,
    height: H,
    background: '#1f2326',
    photoSlot: box(cx, cy, r),
    svg: frameSvg({
      width: W,
      height: H,
      hole: circle(cx, cy, r),
      back:
        `<rect width="${W}" height="${H}" fill="#1f2326"/>` +
        Array.from({ length: 80 }, (_, i) => {
          const rnd = seeded(500 + i);
          return `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(1 + rnd() * 3).toFixed(1)}" fill="#ffffff" opacity="0.05"/>`;
        }).join(''),
      front:
        `<circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="none" stroke="#f5f1ea" stroke-width="22"/>` +
        `<circle cx="${cx}" cy="${cy}" r="${r + 38}" fill="none" stroke="#f5f1ea" stroke-width="2" opacity="0.35"/>` +
        leafAt(820, 700, -30, 140, 30, '#6a994e') + leafAt(830, 705, 10, 110, 24, '#8bbf6a') + leafAt(250, 200, 200, 120, 26, '#6a994e'),
    }),
    texts: [
      fixed('t1', { text: 'MÓN MỚI', x: 0, y: 34, width: W, fontSize: 26, fontFamily: 'Montserrat', fill: '#e9b44c', align: 'center', letterSpacing: 10 }),
      input('t2', 'Tên món', { text: 'Bò lúc lắc', x: 40, y: 838, width: 1000, fontSize: 66, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#f5f1ea', align: 'center' }),
      input('t3', 'Giá', { text: '149.000đ', x: 0, y: 924, width: W, fontSize: 50, fontFamily: 'Oswald', fill: '#e9b44c', align: 'center' }),
      input('t4', 'Hotline', { text: 'Đặt bàn: 0909 123 456', x: 0, y: 1008, width: W, fontSize: 28, fontStyle: 'normal', fill: '#a3a8ab', align: 'center' }),
    ],
    sample: { from: '#f6d3a8', to: '#a0522d', emoji: '🥩' },
  };
})();

// 17. Nhà phố – Thông số ---------------------------------------------------------------------------------
const estateSpecs: Preset = (() => {
  const W = 1080, H = 1350;
  const navy = '#1b263b', accent = '#e4572e';
  const cell = (x: number, icon: string) => `<path d="${roundRect(x, 1094, 300, 96, 18)}" fill="#f1f4f8"/>${icon}`;
  const bed = (x: number) => `<path d="M${x} 1162V1124M${x} 1146H${x + 52}V1162M${x + 8} 1146V1132H${x + 26}V1146" fill="none" stroke="${navy}" stroke-width="5" stroke-linejoin="round"/>`;
  const bath = (x: number) => `<path d="M${x} 1142H${x + 52}V1150A12 12 0 0 1 ${x + 40} 1162H${x + 12}A12 12 0 0 1 ${x} 1150ZM${x + 8} 1142V1122A8 8 0 0 1 ${x + 24} 1122" fill="none" stroke="${navy}" stroke-width="5" stroke-linejoin="round"/>`;
  const area = (x: number) => `<path d="M${x} 1120H${x + 48}V1166H${x}ZM${x + 10} 1156L${x + 38} 1130M${x + 26} 1130H${x + 38}V1142" fill="none" stroke="${navy}" stroke-width="5" stroke-linejoin="round"/>`;
  return {
    id: 'promo-estate-specs',
    name: 'Nhà phố – Thông số',
    category: 'Bất động sản',
    description: 'Ảnh lớn, nhãn giá cam và hàng thông số phòng ngủ / phòng tắm / diện tích kèm biểu tượng.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: { x: 0, y: 0, width: W, height: 860, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V860H0Z`,
      back:
        `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
        cell(60, bed(90)) + cell(390, bath(420)) + cell(720, area(752)) +
        `<rect y="1230" width="${W}" height="120" fill="${navy}"/>`,
      front: `<path d="${roundRect(60, 800, 380, 120, 20)}" fill="${accent}"/>`,
    }),
    texts: [
      input('t1', 'Giá', { text: '3,2 tỷ', x: 60, y: 826, width: 380, fontSize: 68, fontFamily: 'Oswald', fill: '#ffffff', align: 'center' }),
      input('t2', 'Tiêu đề', { text: 'Nhà phố 3 tầng Quận 7', x: 60, y: 948, width: 960, fontSize: 50, fill: navy }),
      input('t3', 'Địa chỉ', { text: 'Đường Nguyễn Thị Thập, Q.7, TP.HCM', x: 60, y: 1020, width: 960, fontSize: 30, fontStyle: 'normal', fill: '#6b7a90' }),
      input('t4', 'Phòng ngủ', { text: '4 PN', x: 160, y: 1124, width: 190, fontSize: 36, fill: navy }),
      input('t5', 'Phòng tắm', { text: '3 WC', x: 490, y: 1124, width: 190, fontSize: 36, fill: navy }),
      input('t6', 'Diện tích', { text: '120 m²', x: 820, y: 1124, width: 190, fontSize: 36, fill: navy }),
      fixed('t7', { text: 'LIÊN HỆ', x: 60, y: 1278, width: 160, fontSize: 24, fontFamily: 'Montserrat', fill: '#9fb3c8', letterSpacing: 4 }),
      input('t8', 'Hotline', { text: '0909 123 456', x: 210, y: 1266, width: 400, fontSize: 44, fill: '#ffffff' }),
      input('t9', 'Môi giới', { text: 'Anh Minh', x: 600, y: 1274, width: 420, fontSize: 32, fill: accent, align: 'right' }),
    ],
    sample: { from: '#cfe3f7', to: '#7ea6cf', emoji: '🏡' },
  };
})();

// 18. Story ra mắt – 9:16 ----------------------------------------------------------------------------------
const storyLaunch: Preset = (() => {
  const W = 1080, H = 1920;
  const slot = { x: 120, y: 320, width: 840, height: 1180, radius: 0 };
  const lilac = '#c7a6ff';
  return {
    id: 'promo-story-launch',
    name: 'Story ra mắt 9:16',
    category: 'Thời trang',
    description: 'Khổ dọc cho Story / Reels: ảnh vòm lớn, chữ NEW DROP nổi bật và nút "Mua ngay".',
    width: W,
    height: H,
    background: '#111111',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: arch(slot.x, slot.y, slot.width, slot.height),
      defs: linear('bg', ['#1a1625', '#0d0d0f']),
      back: `<rect width="${W}" height="${H}" fill="url(#bg)"/><circle cx="960" cy="1700" r="260" fill="${lilac}" opacity="0.08"/>`,
      front:
        `<path d="${arch(slot.x - 24, slot.y - 24, slot.width + 48, slot.height + 48)}" fill="none" stroke="${lilac}" stroke-width="3"/>` +
        `<path d="${sparkle(130, 340, 30)}" fill="${lilac}"/><path d="${sparkle(960, 1460, 24)}" fill="#ffffff"/>` +
        `<path d="${roundRect(340, 1760, 400, 96, 48)}" fill="#ffffff"/>`,
    }),
    texts: [
      fixed('t1', { text: 'NEW DROP', x: 0, y: 80, width: W, fontSize: 150, fontFamily: 'Oswald', fill: '#ffffff', align: 'center', letterSpacing: 10 }),
      fixed('t2', { text: 'BỘ SƯU TẬP MỚI ĐÃ CÓ MẶT', x: 0, y: 246, width: W, fontSize: 26, fontFamily: 'Montserrat', fill: lilac, align: 'center', letterSpacing: 6 }),
      input('t3', 'Tên sản phẩm', { text: 'Áo khoác Bomber', x: 40, y: 1548, width: 1000, fontSize: 64, fill: '#ffffff', align: 'center' }),
      input('t4', 'Giá', { text: '890.000đ', x: 0, y: 1636, width: W, fontSize: 76, fontFamily: 'Oswald', fill: lilac, align: 'center' }),
      fixed('t5', { text: 'MUA NGAY', x: 340, y: 1790, width: 400, fontSize: 36, fill: '#111111', align: 'center', letterSpacing: 4 }),
    ],
    sample: { from: '#d9c8ff', to: '#6d4ab8', emoji: '🧥' },
  };
})();

// 19. Cực quang – Nước hoa ------------------------------------------------------------------------------------
const aurora: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 110, y: 110, width: 860, height: 900, radius: 60 };
  return {
    id: 'promo-aurora-glass',
    name: 'Cực quang – Kính mờ',
    category: 'Làm đẹp',
    description: 'Nền loang hồng tím mơ màng, thẻ thông tin kính mờ – hợp nước hoa, mỹ phẩm cao cấp.',
    width: W,
    height: H,
    background: '#f3e8ff',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: `<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>`,
      back:
        `<rect width="${W}" height="${H}" fill="#f3e8ff"/>` +
        `<g filter="url(#blur)"><circle cx="160" cy="220" r="300" fill="#ffb3d1"/><circle cx="980" cy="520" r="320" fill="#b9a2ff"/>` +
        `<circle cx="300" cy="1200" r="300" fill="#ffd3b0"/><circle cx="900" cy="1260" r="240" fill="#a5d8ff"/></g>`,
      front:
        `<path d="${roundRect(110, 1050, 860, 230, 40)}" fill="#ffffff" fill-opacity="0.45" stroke="#ffffff" stroke-opacity="0.8" stroke-width="2"/>`,
    }),
    texts: [
      fixed('t1', { text: 'LIMITED EDITION', x: 150, y: 1084, width: 500, fontSize: 22, fontFamily: 'Montserrat', fill: '#6b3fa0', letterSpacing: 8 }),
      input('t2', 'Tên sản phẩm', { text: 'Nước hoa Aurora', x: 150, y: 1120, width: 560, fontSize: 56, fontFamily: 'Playfair Display', fill: '#2d1b4e' }),
      input('t3', 'Dung tích', { text: '50ml · Eau de Parfum', x: 150, y: 1206, width: 500, fontSize: 28, fontStyle: 'normal', fill: '#5b4a75' }),
      input('t4', 'Giá', { text: '1.250.000đ', x: 600, y: 1180, width: 330, fontSize: 52, fontFamily: 'Oswald', fill: '#6b3fa0', align: 'right' }),
    ],
    sample: { from: '#fbe3f0', to: '#c9b6ff', emoji: '🌸' },
  };
})();

// 20. Tem bưu thiếp – Du lịch -----------------------------------------------------------------------------------
const postcard: Preset = (() => {
  const W = 1080, H = 1350;
  const sea = '#2a6f97';
  const slot = { x: 120, y: 120, width: 840, height: 780, radius: 0 };
  // Răng cưa của tem: các chấm tròn màu nền dọc 4 cạnh tờ tem (80..1000 × 80..1080)
  const holes: string[] = [];
  for (let x = 80; x <= 1000; x += 40) holes.push(`<circle cx="${x}" cy="80" r="13"/><circle cx="${x}" cy="1080" r="13"/>`);
  for (let y = 120; y < 1080; y += 40) holes.push(`<circle cx="80" cy="${y}" r="13"/><circle cx="1000" cy="${y}" r="13"/>`);
  const postmark =
    `<g fill="none" stroke="#1f2933" stroke-opacity="0.55" stroke-width="4" transform="rotate(-12 870 230)">` +
    `<circle cx="870" cy="230" r="96"/><circle cx="870" cy="230" r="72"/>` +
    [0, 1, 2, 3].map((i) => `<path d="M600 ${180 + i * 30}q30 -16 60 0t60 0t60 0t60 0"/>`).join('') +
    `</g>`;
  return {
    id: 'promo-postcard',
    name: 'Tem bưu thiếp – Du lịch',
    category: 'Du lịch',
    description: 'Ảnh như con tem có răng cưa và dấu bưu điện – lạ mắt cho tour, khách sạn, homestay.',
    width: W,
    height: H,
    background: sea,
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M120 120H960V900H120Z`,
      defs: shadow('sh', '#0b2a3d', 0.35, 10, 14),
      back:
        `<rect width="${W}" height="${H}" fill="${sea}"/>` +
        `<rect x="80" y="80" width="920" height="1000" fill="#fffdf7" filter="url(#sh)"/><g fill="${sea}">${holes.join('')}</g>`,
      front: postmark,
    }),
    texts: [
      input('t1', 'Điểm đến', { text: 'ĐÀ NẴNG', x: 120, y: 936, width: 520, fontSize: 84, fontFamily: 'Oswald', fill: sea }),
      input('t2', 'Gói tour', { text: 'Tour 3 ngày 2 đêm', x: 120, y: 1030, width: 520, fontSize: 28, fontStyle: 'normal', fill: '#5a6670' }),
      fixed('t3', { text: 'CHỈ TỪ', x: 600, y: 944, width: 360, fontSize: 22, fontFamily: 'Montserrat', fill: '#5a6670', align: 'right', letterSpacing: 4 }),
      input('t4', 'Giá', { text: '3.990.000đ', x: 560, y: 976, width: 400, fontSize: 56, fontFamily: 'Oswald', fill: '#e76f51', align: 'right' }),
      input('t5', 'Lịch khởi hành', { text: 'Khởi hành hằng tuần · Đã gồm vé máy bay', x: 40, y: 1130, width: 1000, fontSize: 30, fontStyle: 'normal', fill: '#ffffff', align: 'center' }),
      input('t6', 'Hotline', { text: 'Hotline: 1900 1234', x: 0, y: 1196, width: W, fontSize: 40, fill: '#ffffff', align: 'center' }),
      input('t7', 'Tên công ty', { text: '@tenshop', x: 0, y: 1268, width: W, fontSize: 28, fontStyle: 'normal', fill: '#cfe3ef', align: 'center' }),
    ],
    sample: { from: '#bde4f4', to: '#4aa3c7', emoji: '🏖️' },
  };
})();

export const PROMO_PRESETS: Preset[] = [
  podium,
  organic,
  diagonalSale,
  circleBadge,
  wave,
  tornPaper,
  memphis,
  boho,
  hexTech,
  bigSale,
  bestSeller,
  hangTag,
  babyCloud,
  pharmacy,
  splitFurniture,
  slateDish,
  estateSpecs,
  storyLaunch,
  aurora,
  postcard,
];
