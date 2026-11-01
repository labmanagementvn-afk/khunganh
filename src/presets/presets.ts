import type { PhotoSlot, TextElement } from '../types';
import { arch, circle, frameSvg, leaf, roundRect, sparkle } from './svg';

export const PRESET_CATEGORIES = ['Sản phẩm', 'Bất động sản', 'Ẩm thực', 'Thời trang', 'Làm đẹp', 'Công nghệ'] as const;
export type PresetCategory = (typeof PRESET_CATEGORIES)[number];

export interface Preset {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  width: number;
  height: number;
  background: string;
  photoSlot: PhotoSlot;
  /** Ảnh khung SVG (vùng ảnh sản phẩm trong suốt) */
  svg: string;
  texts: TextElement[];
  /** Ảnh minh hoạ dùng cho ảnh xem trước của mẫu */
  sample: { from: string; to: string; emoji: string };
}

type TextOpts = Partial<TextElement> & Pick<TextElement, 'text' | 'x' | 'y' | 'width' | 'fontSize'>;

function fixed(id: string, o: TextOpts): TextElement {
  return {
    id,
    kind: 'fixed',
    label: '',
    rotation: 0,
    fontFamily: 'Be Vietnam Pro',
    fontStyle: 'bold',
    fill: '#111111',
    align: 'left',
    stroke: '#ffffff',
    strokeWidth: 0,
    uppercase: false,
    letterSpacing: 0,
    ...o,
  };
}

function input(id: string, label: string, o: TextOpts): TextElement {
  return { ...fixed(id, o), kind: 'input', label };
}

// ---------------------------------------------------------------------------
// 1. Sản phẩm – Tối giản
// ---------------------------------------------------------------------------
const minimal: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 60, y: 60, width: 960, height: 960, radius: 40 };
  return {
    id: 'minimal-product',
    name: 'Tối giản – Sản phẩm',
    category: 'Sản phẩm',
    description: 'Nền trắng, bo góc mềm, chữ rõ ràng – hợp mọi loại sản phẩm.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back:
        `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
        `<rect x="72" y="1066" width="56" height="6" rx="3" fill="#4f46e5"/>` +
        `<rect x="72" y="1238" width="936" height="2" fill="#ececf2"/>`,
    }),
    texts: [
      fixed('t1', { text: 'MÃ SẢN PHẨM', x: 72, y: 1092, width: 600, fontSize: 26, fontFamily: 'Montserrat', fill: '#8b8fa3', letterSpacing: 6 }),
      input('t2', 'Mã sản phẩm', { text: 'AC-989VN', x: 72, y: 1128, width: 560, fontSize: 72, fontFamily: 'Montserrat', fill: '#14151f' }),
      input('t3', 'Giá', { text: '599.000đ', x: 560, y: 1138, width: 448, fontSize: 60, fill: '#4f46e5', align: 'right' }),
      fixed('t4', { text: 'HOTLINE', x: 72, y: 1274, width: 160, fontSize: 22, fontFamily: 'Montserrat', fill: '#8b8fa3', letterSpacing: 4 }),
      input('t5', 'Hotline', { text: '0909 123 456', x: 236, y: 1266, width: 380, fontSize: 32, fill: '#14151f' }),
      input('t6', 'Tên shop', { text: '@tenshop', x: 600, y: 1270, width: 408, fontSize: 28, fontStyle: 'normal', fill: '#8b8fa3', align: 'right' }),
    ],
    sample: { from: '#e0e7ff', to: '#c7d2fe', emoji: '👜' },
  };
})();

// ---------------------------------------------------------------------------
// 2. Flash Sale
// ---------------------------------------------------------------------------
const flashSale: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 110, y: 290, width: 860, height: 760, radius: 32 };
  const bolt = (x: number) => `<path d="M${x + 18} 64l-40 86h33l-24 70 70-100h-35l28-56z" fill="#ffe66d"/>`;
  const stripes = Array.from({ length: 16 }, (_, i) => {
    const x = -400 + i * 120;
    return `<path d="M${x} ${H}L${x + 700} 0H${x + 760}L${x + 60} ${H}Z" fill="#ffffff" opacity="0.06"/>`;
  }).join('');
  return {
    id: 'flash-sale',
    name: 'Flash Sale – Bùng nổ',
    category: 'Sản phẩm',
    description: 'Gradient đỏ cam rực rỡ, nhãn giá vàng nổi bật cho chương trình khuyến mãi.',
    width: W,
    height: H,
    background: '#ff512f',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs:
        `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6a3d"/><stop offset="1" stop-color="#e0115f"/></linearGradient>` +
        `<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#5a0020" flood-opacity="0.35"/></filter>`,
      back:
        `<rect width="${W}" height="${H}" fill="url(#g)"/>${stripes}` +
        `<circle cx="980" cy="120" r="160" fill="#ffffff" opacity="0.08"/><circle cx="80" cy="1260" r="200" fill="#ffffff" opacity="0.07"/>` +
        `<path d="${roundRect(80, 260, 920, 820, 52)}" fill="#ffffff" filter="url(#sh)"/>`,
      front:
        bolt(96) + bolt(984) +
        `<path d="${roundRect(270, 1110, 540, 136, 68)}" fill="#ffe66d" filter="url(#sh)"/>`,
    }),
    texts: [
      fixed('t1', { text: 'FLASH SALE', x: 0, y: 48, width: W, fontSize: 140, fontFamily: 'Oswald', fill: '#ffffff', align: 'center', letterSpacing: 6 }),
      fixed('t2', { text: 'GIẢM GIÁ SỐC – SỐ LƯỢNG CÓ HẠN', x: 0, y: 214, width: W, fontSize: 30, fontFamily: 'Montserrat', fill: '#ffe66d', align: 'center', letterSpacing: 3 }),
      input('t3', 'Giá', { text: '199.000đ', x: 270, y: 1140, width: 540, fontSize: 76, fill: '#d4145a', align: 'center' }),
      fixed('t4', { text: 'MÃ SP:', x: 0, y: 1278, width: 520, fontSize: 34, fontFamily: 'Montserrat', fill: '#ffffff', align: 'right' }),
      input('t5', 'Mã sản phẩm', { text: 'AC-989VN', x: 536, y: 1278, width: 500, fontSize: 34, fontFamily: 'Montserrat', fill: '#ffffff' }),
    ],
    sample: { from: '#fff1e6', to: '#ffd8c2', emoji: '👟' },
  };
})();

// ---------------------------------------------------------------------------
// 3. Bất động sản – Sang trọng
// ---------------------------------------------------------------------------
const realEstateLux: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 0, y: 0, width: W, height: 860, radius: 0 };
  const gold = '#c9a45c';
  return {
    id: 'real-estate-luxury',
    name: 'Bất động sản – Sang trọng',
    category: 'Bất động sản',
    description: 'Xanh navy & vàng đồng, bố cục thông tin dự án rõ ràng, đẳng cấp.',
    width: W,
    height: H,
    background: '#0d1b2a',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V860H0Z`,
      defs: `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1b2a" stop-opacity="0"/><stop offset="1" stop-color="#0d1b2a"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="#0d1b2a"/>`,
      front:
        `<rect x="0" y="660" width="${W}" height="201" fill="url(#fade)"/>` +
        `<rect x="40" y="40" width="1000" height="780" fill="none" stroke="${gold}" stroke-width="2" opacity="0.9"/>` +
        `<rect x="373" y="1062" width="1.5" height="100" fill="${gold}" opacity="0.4"/>` +
        `<rect x="706" y="1062" width="1.5" height="100" fill="${gold}" opacity="0.4"/>` +
        `<rect x="0" y="1220" width="${W}" height="130" fill="${gold}"/>` +
        `<rect x="490" y="912" width="100" height="2" fill="${gold}"/>`,
    }),
    texts: [
      fixed('t1', { text: 'BẤT ĐỘNG SẢN CAO CẤP', x: 0, y: 872, width: W, fontSize: 24, fontFamily: 'Montserrat', fill: gold, align: 'center', letterSpacing: 8 }),
      input('t2', 'Tên dự án', { text: 'Sunrise Riverside', x: 40, y: 940, width: 1000, fontSize: 66, fontFamily: 'Playfair Display', fill: '#ffffff', align: 'center' }),
      fixed('t3', { text: 'DIỆN TÍCH', x: 40, y: 1066, width: 333, fontSize: 22, fontFamily: 'Montserrat', fill: '#8fa3b8', align: 'center', letterSpacing: 4 }),
      fixed('t4', { text: 'PHÒNG NGỦ', x: 373, y: 1066, width: 333, fontSize: 22, fontFamily: 'Montserrat', fill: '#8fa3b8', align: 'center', letterSpacing: 4 }),
      fixed('t5', { text: 'GIÁ BÁN', x: 706, y: 1066, width: 333, fontSize: 22, fontFamily: 'Montserrat', fill: '#8fa3b8', align: 'center', letterSpacing: 4 }),
      input('t6', 'Diện tích', { text: '120 m²', x: 40, y: 1104, width: 333, fontSize: 42, fill: '#ffffff', align: 'center' }),
      input('t7', 'Phòng ngủ', { text: '3 PN', x: 373, y: 1104, width: 333, fontSize: 42, fill: '#ffffff', align: 'center' }),
      input('t8', 'Giá bán', { text: '8,5 tỷ', x: 706, y: 1104, width: 333, fontSize: 42, fill: gold, align: 'center' }),
      fixed('t9', { text: 'HOTLINE', x: 80, y: 1272, width: 300, fontSize: 26, fontFamily: 'Montserrat', fill: '#0d1b2a', letterSpacing: 6 }),
      input('t10', 'Hotline', { text: '0909 123 456', x: 400, y: 1256, width: 600, fontSize: 54, fill: '#0d1b2a', align: 'right' }),
    ],
    sample: { from: '#9fb8cf', to: '#f3d9b1', emoji: '🏙️' },
  };
})();

// ---------------------------------------------------------------------------
// 4. Bất động sản – Cho thuê hiện đại
// ---------------------------------------------------------------------------
const realEstateRent: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 0, y: 0, width: W, height: 840, radius: 0 };
  const teal = '#0f766e';
  const chip = (x: number) => `<path d="${roundRect(x, 1124, 220, 70, 35)}" fill="#f0fdfa" stroke="#99f6e4" stroke-width="2"/>`;
  return {
    id: 'real-estate-rent',
    name: 'Cho thuê – Hiện đại',
    category: 'Bất động sản',
    description: 'Đường cắt chéo trẻ trung, thẻ thông tin diện tích – phòng ngủ – phòng tắm.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V700L0 820Z`,
      back:
        `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
        `<path d="M0 790L${W} 670V700L0 820Z" fill="#14b8a6"/>`,
      front:
        `<path d="M0 778L${W} 658V676L0 796Z" fill="${teal}"/>` +
        `<path d="${roundRect(60, 60, 280, 80, 40)}" fill="${teal}"/>` +
        chip(60) + chip(300) + chip(540) +
        `<rect x="60" y="1240" width="960" height="2" fill="#e2e8f0"/>`,
    }),
    texts: [
      fixed('t1', { text: 'CHO THUÊ', x: 60, y: 84, width: 280, fontSize: 32, fontFamily: 'Montserrat', fill: '#ffffff', align: 'center', letterSpacing: 4 }),
      input('t2', 'Tiêu đề', { text: 'Căn hộ 2PN view sông', x: 60, y: 852, width: 960, fontSize: 58, fill: '#0f172a' }),
      input('t3', 'Địa chỉ', { text: 'Thảo Điền, TP. Thủ Đức', x: 60, y: 930, width: 960, fontSize: 32, fontStyle: 'normal', fill: '#64748b' }),
      input('t4', 'Giá thuê', { text: '15 triệu/tháng', x: 60, y: 1010, width: 960, fontSize: 70, fill: teal }),
      input('t5', 'Diện tích', { text: '75 m²', x: 60, y: 1143, width: 220, fontSize: 30, fill: teal, align: 'center' }),
      input('t6', 'Phòng ngủ', { text: '2 PN', x: 300, y: 1143, width: 220, fontSize: 30, fill: teal, align: 'center' }),
      input('t7', 'Phòng tắm', { text: '2 WC', x: 540, y: 1143, width: 220, fontSize: 30, fill: teal, align: 'center' }),
      fixed('t8', { text: 'Liên hệ:', x: 60, y: 1275, width: 160, fontSize: 30, fontStyle: 'normal', fill: '#64748b' }),
      input('t9', 'Số điện thoại', { text: '0909 123 456', x: 190, y: 1268, width: 420, fontSize: 38, fill: '#0f172a' }),
      input('t10', 'Người liên hệ', { text: 'Mr. Minh', x: 620, y: 1274, width: 400, fontSize: 32, fontStyle: 'normal', fill: '#64748b', align: 'right' }),
    ],
    sample: { from: '#bfe8e2', to: '#f6efe2', emoji: '🛋️' },
  };
})();

// ---------------------------------------------------------------------------
// 5. Ẩm thực – Ấm áp
// ---------------------------------------------------------------------------
const foodWarm: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 200, y: 250, width: 680, height: 680, radius: 340 };
  const cx = 540, cy = 590;
  const orange = '#e07a2f';
  const leaves =
    `<g transform="translate(250 870) rotate(-150)"><path d="${leaf(150, 46)}" fill="#6f8f3e"/><path d="M0 0L150 0" stroke="#4f6b29" stroke-width="3"/></g>` +
    `<g transform="translate(250 870) rotate(-110)"><path d="${leaf(120, 38)}" fill="#86a84f"/></g>` +
    `<g transform="translate(830 300) rotate(-40)"><path d="${leaf(130, 40)}" fill="#86a84f"/><path d="M0 0L130 0" stroke="#5c7a33" stroke-width="3"/></g>`;
  const dots = [
    [120, 340], [960, 520], [150, 700], [930, 760], [90, 520], [990, 340],
  ].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${orange}" opacity="0.35"/>`).join('');
  const scallops = Array.from({ length: 19 }, (_, i) => `<circle cx="${i * 60}" cy="${H}" r="34" fill="${orange}"/>`).join('');
  return {
    id: 'food-warm',
    name: 'Ẩm thực – Ấm áp',
    category: 'Ẩm thực',
    description: 'Đĩa tròn trung tâm, lá xanh và tông cam ấm – cho quán ăn, nhà hàng, món nhà làm.',
    width: W,
    height: H,
    background: '#fbf3e4',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: circle(cx, cy, 340),
      back: `<rect width="${W}" height="${H}" fill="#fbf3e4"/>${dots}${scallops}`,
      front:
        `<circle cx="${cx}" cy="${cy}" r="352" fill="none" stroke="#ffffff" stroke-width="18"/>` +
        `<circle cx="${cx}" cy="${cy}" r="380" fill="none" stroke="#e9c46a" stroke-width="4" stroke-dasharray="4 14" stroke-linecap="round"/>` +
        leaves +
        `<circle cx="850" cy="850" r="104" fill="${orange}"/><circle cx="850" cy="850" r="88" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="6 8"/>`,
    }),
    texts: [
      fixed('t1', { text: 'Món ngon mỗi ngày', x: 0, y: 56, width: W, fontSize: 76, fontFamily: 'Dancing Script', fill: '#c2410c', align: 'center' }),
      fixed('t2', { text: 'THỰC ĐƠN HÔM NAY', x: 0, y: 168, width: W, fontSize: 24, fontFamily: 'Montserrat', fill: '#8a6a4a', align: 'center', letterSpacing: 8 }),
      input('t3', 'Giá', { text: '65K', x: 746, y: 818, width: 208, fontSize: 64, fontFamily: 'Oswald', fill: '#ffffff', align: 'center' }),
      input('t4', 'Tên món', { text: 'Phở bò đặc biệt', x: 40, y: 1004, width: 1000, fontSize: 72, fontFamily: 'Playfair Display', fill: '#3d2817', align: 'center' }),
      fixed('t5', { text: 'ĐẶT MÓN:', x: 40, y: 1120, width: 470, fontSize: 28, fontFamily: 'Montserrat', fill: '#8a6a4a', align: 'right', letterSpacing: 3 }),
      input('t6', 'Hotline', { text: '0909 123 456', x: 530, y: 1110, width: 500, fontSize: 40, fill: '#c2410c' }),
      input('t7', 'Địa chỉ', { text: '123 Lê Lợi, Quận 1', x: 40, y: 1186, width: 1000, fontSize: 28, fontStyle: 'normal', fill: '#8a6a4a', align: 'center' }),
    ],
    sample: { from: '#f6d365', to: '#fda085', emoji: '🍜' },
  };
})();

// ---------------------------------------------------------------------------
// 6. Ẩm thực – Menu tối (vuông)
// ---------------------------------------------------------------------------
const foodDark: Preset = (() => {
  const W = 1080, H = 1080;
  const slot = { x: 0, y: 0, width: W, height: 700, radius: 0 };
  const orange = '#ff7a1a';
  return {
    id: 'food-dark',
    name: 'Ẩm thực – Menu tối',
    category: 'Ẩm thực',
    description: 'Nền tối sang, điểm nhấn cam – hợp quán nướng, café, đồ uống. Khổ vuông 1:1.',
    width: W,
    height: H,
    background: '#121212',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M0 0H${W}V700H0Z`,
      defs: `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121212" stop-opacity="0"/><stop offset="1" stop-color="#121212"/></linearGradient>`,
      back: `<rect width="${W}" height="${H}" fill="#121212"/>`,
      front:
        `<rect x="0" y="480" width="${W}" height="221" fill="url(#fade)"/>` +
        `<path d="${roundRect(760, 560, 280, 116, 22)}" fill="${orange}"/>` +
        `<rect x="60" y="988" width="960" height="2" fill="#2a2a2a"/>` +
        `<rect x="60" y="748" width="8" height="40" fill="${orange}"/>`,
    }),
    texts: [
      fixed('t1', { text: 'MENU HÔM NAY', x: 84, y: 750, width: 600, fontSize: 34, fontFamily: 'Oswald', fill: orange, letterSpacing: 8 }),
      input('t2', 'Tên món', { text: 'Cơm tấm sườn bì', x: 60, y: 800, width: 960, fontSize: 84, fontFamily: 'Oswald', fill: '#ffffff', uppercase: true }),
      input('t3', 'Mô tả', { text: 'Sườn nướng than hoa • Trứng ốp la • Nước mắm nhà làm', x: 60, y: 918, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#a3a3a3' }),
      input('t4', 'Giá', { text: '45.000đ', x: 760, y: 592, width: 280, fontSize: 52, fill: '#121212', align: 'center' }),
      fixed('t5', { text: 'ĐẶT MÓN', x: 60, y: 1022, width: 200, fontSize: 24, fontFamily: 'Montserrat', fill: orange, letterSpacing: 5 }),
      input('t6', 'Hotline', { text: '0909 123 456', x: 230, y: 1014, width: 380, fontSize: 38, fill: '#ffffff' }),
      input('t7', 'Tên quán', { text: '@quancomngon', x: 600, y: 1020, width: 420, fontSize: 28, fontStyle: 'normal', fill: '#a3a3a3', align: 'right' }),
    ],
    sample: { from: '#5b2c1a', to: '#d9822b', emoji: '🍖' },
  };
})();

// ---------------------------------------------------------------------------
// 7. Thời trang – Editorial
// ---------------------------------------------------------------------------
const fashion: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 60, y: 60, width: 740, height: 1010, radius: 0 };
  return {
    id: 'fashion-editorial',
    name: 'Thời trang – Editorial',
    category: 'Thời trang',
    description: 'Phong cách tạp chí: ảnh dọc lớn, dải đen chữ dọc, chữ serif thanh lịch.',
    width: W,
    height: H,
    background: '#f3efe9',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M60 60H800V1070H60Z`,
      back: `<rect width="${W}" height="${H}" fill="#f3efe9"/><rect x="840" y="0" width="240" height="${H}" fill="#111111"/>`,
      front:
        `<rect x="44" y="44" width="772" height="1042" fill="none" stroke="#111111" stroke-width="2"/>` +
        `<rect x="900" y="1190" width="120" height="2" fill="#c8b89a"/>`,
    }),
    texts: [
      fixed('t1', { text: 'NEW COLLECTION', x: 928, y: 1080, width: 1020, fontSize: 64, fontFamily: 'Montserrat', fill: '#ffffff', align: 'center', letterSpacing: 14, rotation: -90 }),
      input('t2', 'Tên sản phẩm', { text: 'Đầm lụa Midi', x: 60, y: 1108, width: 760, fontSize: 64, fontFamily: 'Playfair Display', fontStyle: 'italic bold', fill: '#111111' }),
      fixed('t3', { text: 'SIZE', x: 60, y: 1214, width: 200, fontSize: 22, fontFamily: 'Montserrat', fill: '#8a7f72', letterSpacing: 5 }),
      input('t4', 'Size', { text: 'S · M · L', x: 60, y: 1250, width: 340, fontSize: 36, fill: '#111111' }),
      fixed('t5', { text: 'GIÁ', x: 420, y: 1214, width: 200, fontSize: 22, fontFamily: 'Montserrat', fill: '#8a7f72', letterSpacing: 5 }),
      input('t6', 'Giá', { text: '890.000đ', x: 420, y: 1248, width: 400, fontSize: 40, fill: '#111111' }),
      fixed('t7', { text: 'MÃ SP', x: 840, y: 1214, width: 240, fontSize: 22, fontFamily: 'Montserrat', fill: '#8a7f72', align: 'center', letterSpacing: 5 }),
      input('t8', 'Mã sản phẩm', { text: '#AC989', x: 840, y: 1250, width: 240, fontSize: 38, fontFamily: 'Oswald', fill: '#c8b89a', align: 'center' }),
    ],
    sample: { from: '#d9c9b6', to: '#8c7a6b', emoji: '👗' },
  };
})();

// ---------------------------------------------------------------------------
// 8. Làm đẹp – Pastel vòm
// ---------------------------------------------------------------------------
const beautyArch: Preset = (() => {
  const W = 1080, H = 1350;
  const ax = 190, ay = 180, aw = 700, ah = 800;
  const slot = { x: ax, y: ay, width: aw, height: ah, radius: 0 };
  const rose = '#b04a6f';
  const sparkles = [
    [150, 300, 26], [940, 260, 34], [960, 860, 22], [120, 900, 30], [880, 560, 16], [190, 600, 14],
  ].map(([x, y, r]) => `<path d="${sparkle(x, y, r)}" fill="#ffffff" opacity="0.95"/>`).join('');
  return {
    id: 'beauty-arch',
    name: 'Làm đẹp – Pastel vòm',
    category: 'Làm đẹp',
    description: 'Khung vòm mềm mại, tông hồng pastel lấp lánh – cho mỹ phẩm, nail, spa.',
    width: W,
    height: H,
    background: '#fde8ec',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: arch(ax, ay, aw, ah),
      defs: `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdeef1"/><stop offset="1" stop-color="#f7d3e1"/></linearGradient>`,
      back:
        `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
        `<circle cx="120" cy="160" r="180" fill="#ffffff" opacity="0.45"/><circle cx="1000" cy="1100" r="220" fill="#ffffff" opacity="0.35"/>`,
      front:
        `<path d="${arch(ax - 22, ay - 22, aw + 44, ah + 44)}" fill="none" stroke="#e8a0b4" stroke-width="3"/>` +
        sparkles +
        `<path d="${roundRect(320, 1176, 440, 104, 52)}" fill="${rose}"/>`,
    }),
    texts: [
      fixed('t1', { text: 'Beauty Collection', x: 0, y: 40, width: W, fontSize: 80, fontFamily: 'Dancing Script', fill: rose, align: 'center' }),
      input('t2', 'Tên sản phẩm', { text: 'Serum Vitamin C', x: 40, y: 1030, width: 1000, fontSize: 66, fontFamily: 'Playfair Display', fill: '#5a2a3c', align: 'center' }),
      fixed('t3', { text: 'CHÍNH HÃNG 100% • FREESHIP', x: 0, y: 1120, width: W, fontSize: 24, fontFamily: 'Montserrat', fill: '#b07a8c', align: 'center', letterSpacing: 4 }),
      input('t4', 'Giá', { text: '450.000đ', x: 320, y: 1202, width: 440, fontSize: 54, fill: '#ffffff', align: 'center' }),
      input('t5', 'Tên shop', { text: '@beautyshop', x: 0, y: 1300, width: W, fontSize: 26, fontStyle: 'normal', fill: '#b07a8c', align: 'center' }),
    ],
    sample: { from: '#ffd1dc', to: '#ffe9e3', emoji: '🧴' },
  };
})();

// ---------------------------------------------------------------------------
// 9. Spa – Thiên nhiên
// ---------------------------------------------------------------------------
const spaNature: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 120, y: 230, width: 840, height: 760, radius: 64 };
  const green = '#5b7f52';
  const leafAt = (x: number, y: number, rot: number, len: number, w: number, fill: string) =>
    `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="${leaf(len, w)}" fill="${fill}"/><path d="M0 0L${len} 0" stroke="#3f5a39" stroke-width="2.5" opacity="0.6"/></g>`;
  return {
    id: 'spa-nature',
    name: 'Spa – Thiên nhiên',
    category: 'Làm đẹp',
    description: 'Tông xanh lá dịu, lá cây ôm khung ảnh – cho spa, mỹ phẩm thiên nhiên, chăm sóc da.',
    width: W,
    height: H,
    background: '#e3eadf',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back: `<rect width="${W}" height="${H}" fill="#e3eadf"/><circle cx="540" cy="1350" r="420" fill="#d5e0cf"/>`,
      front:
        `<path d="${roundRect(102, 212, 876, 796, 76)}" fill="none" stroke="#8aa67d" stroke-width="2.5"/>` +
        leafAt(130, 260, -140, 170, 50, green) + leafAt(130, 260, -100, 140, 42, '#7d9c70') + leafAt(130, 260, -175, 120, 36, '#9db78f') +
        leafAt(950, 960, 40, 170, 50, green) + leafAt(950, 960, 80, 140, 42, '#7d9c70') + leafAt(950, 960, 5, 120, 36, '#9db78f') +
        `<path d="${roundRect(300, 1112, 480, 100, 50)}" fill="${green}"/>`,
    }),
    texts: [
      fixed('t1', { text: 'NATURAL SPA', x: 0, y: 70, width: W, fontSize: 28, fontFamily: 'Montserrat', fill: green, align: 'center', letterSpacing: 12 }),
      fixed('t2', { text: 'Thư giãn – Tái tạo – Rạng ngời', x: 0, y: 122, width: W, fontSize: 44, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#3f5a39', align: 'center' }),
      input('t3', 'Tên dịch vụ', { text: 'Chăm sóc da 60 phút', x: 40, y: 1024, width: 1000, fontSize: 60, fontFamily: 'Playfair Display', fill: '#2f4a2b', align: 'center' }),
      input('t4', 'Giá', { text: '390.000đ', x: 300, y: 1136, width: 480, fontSize: 52, fill: '#ffffff', align: 'center' }),
      fixed('t5', { text: 'HOTLINE', x: 40, y: 1262, width: 470, fontSize: 24, fontFamily: 'Montserrat', fill: green, align: 'right', letterSpacing: 5 }),
      input('t6', 'Hotline', { text: '0909 123 456', x: 530, y: 1254, width: 500, fontSize: 36, fill: '#2f4a2b' }),
    ],
    sample: { from: '#cfe3c7', to: '#f5efe4', emoji: '🌿' },
  };
})();

// ---------------------------------------------------------------------------
// 10. Công nghệ – Neon
// ---------------------------------------------------------------------------
const techNeon: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 90, y: 230, width: 900, height: 740, radius: 36 };
  const grid =
    Array.from({ length: 12 }, (_, i) => `<rect x="${i * 100}" y="0" width="1" height="${H}" fill="#ffffff" opacity="0.05"/>`).join('') +
    Array.from({ length: 14 }, (_, i) => `<rect x="0" y="${i * 100}" width="${W}" height="1" fill="#ffffff" opacity="0.05"/>`).join('');
  return {
    id: 'tech-neon',
    name: 'Công nghệ – Neon',
    category: 'Công nghệ',
    description: 'Nền tối lưới mờ, viền neon xanh tím – cho điện thoại, laptop, phụ kiện.',
    width: W,
    height: H,
    background: '#0b1020',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs:
        `<linearGradient id="neon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#a855f7"/></linearGradient>` +
        `<radialGradient id="glow1" cx="0.15" cy="0.1" r="0.6"><stop offset="0" stop-color="#7c3aed" stop-opacity="0.55"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient>` +
        `<radialGradient id="glow2" cx="0.9" cy="0.95" r="0.6"><stop offset="0" stop-color="#06b6d4" stop-opacity="0.45"/><stop offset="1" stop-color="#06b6d4" stop-opacity="0"/></radialGradient>`,
      back:
        `<rect width="${W}" height="${H}" fill="#0b1020"/><rect width="${W}" height="${H}" fill="url(#glow1)"/><rect width="${W}" height="${H}" fill="url(#glow2)"/>${grid}`,
      front:
        `<path d="${roundRect(80, 220, 920, 760, 44)}" fill="none" stroke="url(#neon)" stroke-width="16" opacity="0.25"/>` +
        `<path d="${roundRect(84, 224, 912, 752, 40)}" fill="none" stroke="url(#neon)" stroke-width="5"/>` +
        `<path d="${roundRect(230, 1090, 620, 124, 62)}" fill="#22d3ee" fill-opacity="0.08" stroke="url(#neon)" stroke-width="3"/>`,
    }),
    texts: [
      fixed('t1', { text: 'NEW ARRIVAL', x: 0, y: 64, width: W, fontSize: 26, fontFamily: 'Montserrat', fill: '#22d3ee', align: 'center', letterSpacing: 12 }),
      input('t2', 'Tên sản phẩm', { text: 'Smartphone X Pro', x: 40, y: 110, width: 1000, fontSize: 70, fontFamily: 'Montserrat', fill: '#ffffff', align: 'center' }),
      input('t3', 'Thông số', { text: '256GB • Chính hãng • Bảo hành 12 tháng', x: 40, y: 1016, width: 1000, fontSize: 30, fontStyle: 'normal', fill: '#94a3b8', align: 'center' }),
      input('t4', 'Giá', { text: '24.990.000đ', x: 230, y: 1118, width: 620, fontSize: 68, fill: '#ffffff', align: 'center' }),
      fixed('t5', { text: 'HOTLINE', x: 40, y: 1270, width: 470, fontSize: 24, fontFamily: 'Montserrat', fill: '#22d3ee', align: 'right', letterSpacing: 6 }),
      input('t6', 'Hotline', { text: '0909 123 456', x: 530, y: 1262, width: 500, fontSize: 36, fill: '#e2e8f0' }),
    ],
    sample: { from: '#1e293b', to: '#475569', emoji: '📱' },
  };
})();

export const PRESETS: Preset[] = [
  minimal,
  flashSale,
  realEstateLux,
  realEstateRent,
  foodWarm,
  foodDark,
  fashion,
  beautyArch,
  spaNature,
  techNeon,
];
