// 10 mẫu tối giản: khung mỏng, ít chữ – ảnh sản phẩm chiếm gần hết khung hình.
import type { Preset } from './presets';
import { circle, frameSvg, roundRect } from './svg';
import { fixed, input } from './text';

const FULL = (W: number, H: number) => ({ x: 0, y: 0, width: W, height: H, radius: 0 });
/** Lớp chuyển màu tối ở đáy ảnh để chữ trắng luôn đọc được */
const bottomShade = (H: number, from: number, opacity = 0.65) =>
  `<linearGradient id="shade" x1="0" y1="${from}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">` +
  `<stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${opacity}"/></linearGradient>`;

// 11. Viền trắng mỏng ---------------------------------------------------------
const thinWhite: Preset = (() => {
  const W = 1080, H = 1350;
  return {
    id: 'mini-thin-white',
    name: 'Viền trắng mỏng',
    category: 'Sản phẩm',
    photoFirst: true,
    description: 'Ảnh tràn gần hết khung, viền trắng mảnh và 2 nhãn nhỏ: mã & giá.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: FULL(W, H),
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(24, 24, W - 48, H - 48, 28),
      back: `<rect width="${W}" height="${H}" fill="#ffffff"/>`,
      front:
        `<path d="${roundRect(56, 1196, 400, 98, 49)}" fill="#ffffff" fill-opacity="0.94"/>` +
        `<path d="${roundRect(744, 1196, 280, 98, 49)}" fill="#111111"/>`,
    }),
    texts: [
      fixed('t1', { text: 'MÃ SP', x: 92, y: 1230, width: 100, fontSize: 22, fontFamily: 'Montserrat', fill: '#8b8fa3', letterSpacing: 3 }),
      input('t2', 'Mã sản phẩm', { text: 'AC-989VN', x: 188, y: 1224, width: 260, fontSize: 36, fontFamily: 'Montserrat', fill: '#111111' }),
      input('t3', 'Giá', { text: '599K', x: 744, y: 1223, width: 280, fontSize: 40, fill: '#ffffff', align: 'center' }),
    ],
    sample: { from: '#dfe7ef', to: '#b7c6d6', emoji: '⌚' },
  };
})();

// 12. Tràn viền – chữ trên nền tối mờ -----------------------------------------
const fullBleed: Preset = (() => {
  const W = 1080, H = 1350;
  return {
    id: 'mini-full-bleed',
    name: 'Tràn viền – Chữ nổi',
    category: 'Sản phẩm',
    photoFirst: true,
    description: '100% là ảnh, chỉ một lớp tối nhẹ ở đáy cho tên shop, mã và giá.',
    width: W,
    height: H,
    background: '#000000',
    photoSlot: FULL(W, H),
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V${H}H0Z`,
      defs: bottomShade(H, 1020),
      back: '',
      front:
        `<rect x="0" y="1020" width="${W}" height="${H - 1020}" fill="url(#shade)"/>` +
        `<path d="${roundRect(48, 48, 250, 64, 32)}" fill="#000000" fill-opacity="0.45"/>`,
    }),
    texts: [
      input('t1', 'Tên shop', { text: '@tenshop', x: 48, y: 66, width: 250, fontSize: 28, fill: '#ffffff', align: 'center' }),
      input('t2', 'Mã sản phẩm', { text: 'AC-989VN', x: 56, y: 1214, width: 600, fontSize: 56, fontFamily: 'Montserrat', fill: '#ffffff' }),
      input('t3', 'Giá', { text: '599.000đ', x: 560, y: 1220, width: 464, fontSize: 52, fill: '#ffe066', align: 'right' }),
    ],
    sample: { from: '#f5d0a9', to: '#8d5b4c', emoji: '🎧' },
  };
})();

// 13. Polaroid --------------------------------------------------------------
const polaroid: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 54, y: 54, width: 972, height: 1060, radius: 0 };
  return {
    id: 'mini-polaroid',
    name: 'Polaroid',
    category: 'Thời trang',
    photoFirst: true,
    description: 'Khung ảnh lấy liền cổ điển, một dòng chú thích viết tay bên dưới.',
    width: W,
    height: H,
    background: '#fbfaf7',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M54 54H1026V1114H54Z`,
      back: `<rect width="${W}" height="${H}" fill="#fbfaf7"/>`,
      front: `<rect x="54" y="54" width="972" height="1060" fill="none" stroke="#000" stroke-opacity="0.08" stroke-width="2"/>`,
    }),
    texts: [
      input('t1', 'Chú thích', { text: 'Bộ sưu tập mùa hè', x: 54, y: 1160, width: 700, fontSize: 64, fontFamily: 'Dancing Script', fill: '#2b2b2b' }),
      input('t2', 'Mã sản phẩm', { text: '#AC989', x: 726, y: 1186, width: 300, fontSize: 34, fontFamily: 'Montserrat', fontStyle: 'normal', fill: '#8a8a8a', align: 'right' }),
    ],
    sample: { from: '#fde2c8', to: '#c9e4de', emoji: '👒' },
  };
})();

// 14. Khung mảnh vàng --------------------------------------------------------
const goldLine: Preset = (() => {
  const W = 1080, H = 1350;
  const gold = '#d6b06a';
  const corner = (x: number, y: number, sx: number, sy: number) =>
    `<path d="M${x} ${y + sy * 70}V${y}H${x + sx * 70}" fill="none" stroke="${gold}" stroke-width="5"/>`;
  return {
    id: 'mini-gold-line',
    name: 'Viền mảnh vàng',
    category: 'Làm đẹp',
    photoFirst: true,
    description: 'Ảnh tràn viền, đường chỉ vàng thanh mảnh – sang trọng cho mỹ phẩm, trang sức.',
    width: W,
    height: H,
    background: '#000000',
    photoSlot: FULL(W, H),
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V${H}H0Z`,
      defs: bottomShade(H, 1080, 0.55),
      back: '',
      front:
        `<rect x="0" y="1080" width="${W}" height="${H - 1080}" fill="url(#shade)"/>` +
        `<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${gold}" stroke-width="2"/>` +
        corner(52, 52, 1, 1) + corner(W - 52, 52, -1, 1) + corner(52, H - 52, 1, -1) + corner(W - 52, H - 52, -1, -1) +
        `<rect x="500" y="1260" width="80" height="2" fill="${gold}"/>`,
    }),
    texts: [
      input('t1', 'Tên sản phẩm', { text: 'Son lì Velvet', x: 60, y: 1170, width: 960, fontSize: 64, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#ffffff', align: 'center' }),
      input('t2', 'Giá', { text: '320.000đ', x: 60, y: 1276, width: 960, fontSize: 30, fontFamily: 'Montserrat', fill: gold, align: 'center', letterSpacing: 4 }),
    ],
    sample: { from: '#f3c6c6', to: '#7b2d3b', emoji: '💄' },
  };
})();

// 15. Dải thông tin đáy – Bất động sản ------------------------------------------
const estateBand: Preset = (() => {
  const W = 1080, H = 1350;
  const navy = '#111827';
  return {
    id: 'mini-estate-band',
    name: 'BĐS – Dải thông tin',
    category: 'Bất động sản',
    photoFirst: true,
    description: 'Ảnh căn nhà chiếm 85%, một dải tối gọn ở đáy: giá, diện tích, hotline.',
    width: W,
    height: H,
    background: navy,
    photoSlot: { x: 0, y: 0, width: W, height: 1170, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V1170H0Z`,
      back: `<rect width="${W}" height="${H}" fill="${navy}"/>`,
      front:
        `<rect x="0" y="1166" width="${W}" height="6" fill="#f59e0b"/>` +
        `<rect x="372" y="1206" width="1.5" height="110" fill="#ffffff" opacity="0.18"/>` +
        `<rect x="708" y="1206" width="1.5" height="110" fill="#ffffff" opacity="0.18"/>`,
    }),
    texts: [
      fixed('t1', { text: 'GIÁ', x: 40, y: 1206, width: 332, fontSize: 22, fontFamily: 'Montserrat', fill: '#9ca3af', align: 'center', letterSpacing: 5 }),
      input('t2', 'Giá', { text: '3,2 tỷ', x: 40, y: 1244, width: 332, fontSize: 52, fill: '#f59e0b', align: 'center' }),
      fixed('t3', { text: 'DIỆN TÍCH', x: 374, y: 1206, width: 334, fontSize: 22, fontFamily: 'Montserrat', fill: '#9ca3af', align: 'center', letterSpacing: 5 }),
      input('t4', 'Diện tích', { text: '85 m²', x: 374, y: 1244, width: 334, fontSize: 52, fill: '#ffffff', align: 'center' }),
      fixed('t5', { text: 'HOTLINE', x: 710, y: 1206, width: 330, fontSize: 22, fontFamily: 'Montserrat', fill: '#9ca3af', align: 'center', letterSpacing: 5 }),
      input('t6', 'Hotline', { text: '0909 123 456', x: 710, y: 1252, width: 330, fontSize: 38, fill: '#ffffff', align: 'center' }),
    ],
    sample: { from: '#a8c8e8', to: '#e8d8b8', emoji: '🏡' },
  };
})();

// 16. Story 9:16 -------------------------------------------------------------
const story: Preset = (() => {
  const W = 1080, H = 1920;
  return {
    id: 'mini-story',
    name: 'Story 9:16',
    category: 'Thời trang',
    photoFirst: true,
    description: 'Khổ dọc cho Story/Reels/TikTok: ảnh toàn màn hình, thẻ giá nhỏ ở đáy.',
    width: W,
    height: H,
    background: '#000000',
    photoSlot: FULL(W, H),
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V${H}H0Z`,
      defs: `<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`,
      back: '',
      front:
        `<rect x="0" y="0" width="${W}" height="260" fill="url(#top)"/>` +
        `<path d="${roundRect(80, 1640, 920, 150, 36)}" fill="#ffffff"/>`,
    }),
    texts: [
      fixed('t1', { text: 'NEW IN', x: 0, y: 110, width: W, fontSize: 34, fontFamily: 'Montserrat', fill: '#ffffff', align: 'center', letterSpacing: 16 }),
      input('t2', 'Tên sản phẩm', { text: 'Áo khoác denim', x: 120, y: 1666, width: 560, fontSize: 40, fill: '#111111' }),
      input('t3', 'Mã sản phẩm', { text: 'Mã: AC-989VN', x: 120, y: 1726, width: 560, fontSize: 28, fontStyle: 'normal', fill: '#6b7280' }),
      input('t4', 'Giá', { text: '459K', x: 640, y: 1684, width: 320, fontSize: 64, fontFamily: 'Oswald', fill: '#111111', align: 'right' }),
    ],
    sample: { from: '#9bb3d1', to: '#2f3e5c', emoji: '🧥' },
  };
})();

// 17. Bo góc trên nền kem – Ẩm thực -------------------------------------------
const creamCard: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 40, y: 40, width: 1000, height: 1150, radius: 48 };
  return {
    id: 'mini-cream-card',
    name: 'Ẩm thực – Thẻ kem',
    category: 'Ẩm thực',
    photoFirst: true,
    description: 'Ảnh món ăn bo góc lớn trên nền kem, một dòng tên món & giá gọn gàng.',
    width: W,
    height: H,
    background: '#f4efe6',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back: `<rect width="${W}" height="${H}" fill="#f4efe6"/>`,
      front: `<path d="${roundRect(800, 1150, 200, 80, 40)}" fill="#e85d04"/>`,
    }),
    texts: [
      input('t1', 'Tên món', { text: 'Bánh mì chảo', x: 48, y: 1238, width: 700, fontSize: 58, fontFamily: 'Playfair Display', fill: '#2d1e12' }),
      input('t2', 'Giá', { text: '45K', x: 800, y: 1166, width: 200, fontSize: 46, fontFamily: 'Oswald', fill: '#ffffff', align: 'center' }),
      input('t3', 'Tên quán', { text: '@quanngon', x: 700, y: 1262, width: 332, fontSize: 28, fontStyle: 'normal', fill: '#9a8574', align: 'right' }),
    ],
    sample: { from: '#f9c74f', to: '#f3722c', emoji: '🍳' },
  };
})();

// 18. Tem giá tròn -----------------------------------------------------------
const priceSticker: Preset = (() => {
  const W = 1080, H = 1350;
  const cx = 880, cy = 200;
  return {
    id: 'mini-price-sticker',
    name: 'Tem giá tròn',
    category: 'Sản phẩm',
    photoFirst: true,
    description: 'Ảnh tràn viền hoàn toàn, chỉ một con tem giá đỏ nổi bật ở góc.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: FULL(W, H),
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V${H}H0Z`,
      defs: `<filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity="0.3"/></filter>`,
      back: '',
      front:
        `<path d="${circle(cx, cy, 150)}" fill="#e11d48" filter="url(#sh)"/>` +
        `<circle cx="${cx}" cy="${cy}" r="132" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="8 10"/>`,
    }),
    texts: [
      fixed('t1', { text: 'CHỈ CÒN', x: cx - 150, y: cy - 78, width: 300, fontSize: 26, fontFamily: 'Montserrat', fill: '#ffe4e6', align: 'center', letterSpacing: 4 }),
      input('t2', 'Giá', { text: '299K', x: cx - 150, y: cy - 40, width: 300, fontSize: 90, fontFamily: 'Oswald', fill: '#ffffff', align: 'center' }),
      input('t3', 'Mã sản phẩm', { text: 'AC-989VN', x: cx - 150, y: cy + 66, width: 300, fontSize: 24, fontFamily: 'Montserrat', fill: '#ffe4e6', align: 'center' }),
    ],
    sample: { from: '#e0f2fe', to: '#bae6fd', emoji: '🧸' },
  };
})();

// 19. Viền đen vuông – Streetwear (1:1) ----------------------------------------
const blackSquare: Preset = (() => {
  const W = 1080, H = 1080;
  const lime = '#c6ff3d';
  return {
    id: 'mini-black-square',
    name: 'Viền đen – Streetwear',
    category: 'Thời trang',
    photoFirst: true,
    description: 'Khổ vuông 1:1, viền đen dày cá tính, tab mã sản phẩm màu neon.',
    width: W,
    height: H,
    background: '#0a0a0a',
    photoSlot: FULL(W, H),
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M28 28H${W - 28}V${H - 28}H28Z`,
      back: `<rect width="${W}" height="${H}" fill="#0a0a0a"/>`,
      front: `<path d="M28 ${H - 120}H420L460 ${H - 28}H28Z" fill="#0a0a0a"/><rect x="28" y="${H - 124}" width="8" height="96" fill="${lime}"/>`,
    }),
    texts: [
      input('t1', 'Mã sản phẩm', { text: 'DROP #07', x: 60, y: H - 104, width: 360, fontSize: 40, fontFamily: 'Oswald', fill: '#ffffff', letterSpacing: 2 }),
      input('t2', 'Giá', { text: '390K', x: 60, y: H - 58, width: 360, fontSize: 28, fontFamily: 'Montserrat', fill: lime, letterSpacing: 2 }),
    ],
    sample: { from: '#d4d4d4', to: '#525252', emoji: '🧢' },
  };
})();

// 20. Thẻ trong suốt – Công nghệ ------------------------------------------------
const glassCard: Preset = (() => {
  const W = 1080, H = 1350;
  return {
    id: 'mini-glass-card',
    name: 'Thẻ trong suốt',
    category: 'Công nghệ',
    photoFirst: true,
    description: 'Ảnh tràn viền, thẻ thông tin trắng mờ nổi phía dưới – hiện đại, tinh tế.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: FULL(W, H),
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V${H}H0Z`,
      defs: `<filter id="sh" x="-10%" y="-30%" width="120%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="16" flood-opacity="0.18"/></filter>`,
      back: '',
      front: `<path d="${roundRect(48, 1110, 984, 192, 40)}" fill="#ffffff" fill-opacity="0.82" stroke="#ffffff" stroke-opacity="0.9" stroke-width="2" filter="url(#sh)"/>`,
    }),
    texts: [
      input('t1', 'Tên sản phẩm', { text: 'Tai nghe Air Pro 2', x: 92, y: 1146, width: 620, fontSize: 46, fontFamily: 'Montserrat', fill: '#0f172a' }),
      input('t2', 'Thông số', { text: 'Chống ồn • Pin 30h • BH 12 tháng', x: 92, y: 1214, width: 620, fontSize: 28, fontStyle: 'normal', fill: '#475569' }),
      input('t3', 'Giá', { text: '2.490K', x: 700, y: 1172, width: 290, fontSize: 60, fill: '#2563eb', align: 'right' }),
    ],
    sample: { from: '#e2e8f0', to: '#94a3b8', emoji: '🎧' },
  };
})();

export const MINIMAL_PRESETS: Preset[] = [
  thinWhite,
  fullBleed,
  polaroid,
  goldLine,
  estateBand,
  story,
  creamCard,
  priceSticker,
  blackSquare,
  glassCard,
];
