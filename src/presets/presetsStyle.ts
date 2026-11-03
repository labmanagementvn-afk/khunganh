// 20 mẫu phong cách: bìa tạp chí, bài đăng mạng xã hội, hoá đơn, bảng phấn, vé sự kiện, vở học, Tết, cuộn phim,
// ghim bản đồ, lời khen khách hàng, voucher, sinh nhật bé, phòng gym, dự án căn hộ, điện thoại, chữ chạy viền…
import type { Preset } from './presets';
import { circle, frameSvg, leaf, roundRect, seeded, sparkle, starburst } from './svg';
import { fixed, input } from './text';

const linear = (id: string, stops: string[], x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">` +
  stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('') +
  `</linearGradient>`;
const shadow = (id: string, color: string, opacity = 0.25, dy = 12, blur = 16) =>
  `<filter id="${id}" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="${color}" flood-opacity="${opacity}"/></filter>`;
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
/** Đa giác từ hình chữ nhật xoay quanh tâm */
const rotatedRect = (cx: number, cy: number, w: number, h: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(
    ([x, y]) => `${(cx + x * Math.cos(a) - y * Math.sin(a)).toFixed(1)} ${(cy + x * Math.sin(a) + y * Math.cos(a)).toFixed(1)}`,
  );
  return `M${pts.join('L')}Z`;
};
/** Đường tròn viền vỏ sò (các vòng cung nhỏ lồi ra ngoài) */
const scallop = (cx: number, cy: number, r: number, n: number) => {
  const p = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`;
  };
  const rb = (r * Math.sin(Math.PI / n)) * 1.05;
  let d = `M${p(0)}`;
  for (let i = 1; i <= n; i++) d += `A${rb.toFixed(1)} ${rb.toFixed(1)} 0 0 1 ${p(i)}`;
  return d + 'Z';
};
/** Ghim bản đồ: hình tròn bán kính r, mũi nhọn cách tâm d */
const mapPin = (cx: number, cy: number, r: number, d: number) => {
  const phi = Math.acos(r / d);
  const lx = cx - r * Math.sin(phi), rx = cx + r * Math.sin(phi), ty = cy + r * Math.cos(phi);
  return `M${cx} ${cy + d}L${lx.toFixed(1)} ${ty.toFixed(1)}A${r} ${r} 0 1 1 ${rx.toFixed(1)} ${ty.toFixed(1)}Z`;
};

// 1. Bìa tạp chí -------------------------------------------------------------------
const magazine: Preset = (() => {
  const W = 1080, H = 1350;
  return {
    id: 'style-magazine',
    name: 'Bìa tạp chí',
    category: 'Thời trang',
    photoFirst: true,
    description: 'Ảnh tràn viền như bìa tạp chí thời trang: tên báo lớn, dòng tít bên cạnh và mã vạch.',
    width: W,
    height: H,
    background: '#000000',
    photoSlot: { x: 0, y: 0, width: W, height: H, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(0, 0, W, H),
      defs:
        `<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>` +
        `<linearGradient id="bot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.6"/></linearGradient>`,
      back: '',
      front:
        `<rect width="${W}" height="380" fill="url(#top)"/><rect y="950" width="${W}" height="400" fill="url(#bot)"/>` +
        `<rect x="860" y="1180" width="160" height="110" fill="#ffffff"/>` +
        Array.from({ length: 26 }, (_, i) => {
          const rnd = seeded(40 + i);
          return `<rect x="${872 + i * 5.4}" y="1192" width="${(1 + rnd() * 2.6).toFixed(1)}" height="66" fill="#111"/>`;
        }).join(''),
    }),
    texts: [
      input('t1', 'Tên tạp chí', { text: 'STYLE', x: 40, y: 30, width: 1000, fontSize: 230, fontFamily: 'Playfair Display', fill: '#ffffff', align: 'center', letterSpacing: 10 }),
      fixed('t2', { text: 'SỐ ĐẶC BIỆT · MÙA THU', x: 60, y: 300, width: 600, fontSize: 24, fontFamily: 'Montserrat', fill: '#ffffff', letterSpacing: 6 }),
      input('t3', 'Tít chính', { text: 'Xu hướng\nmới nhất', x: 60, y: 1010, width: 700, fontSize: 84, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#ffffff' }),
      input('t4', 'Tít phụ', { text: 'Bộ sưu tập Thu Đông · Giá từ 590K', x: 60, y: 1206, width: 760, fontSize: 30, fontStyle: 'normal', fill: '#f1e3c6' }),
      input('t5', 'Mã sản phẩm', { text: 'AC-989', x: 860, y: 1262, width: 160, fontSize: 20, fontFamily: 'Montserrat', fontStyle: 'normal', fill: '#111111', align: 'center' }),
    ],
    sample: { from: '#d8c3a5', to: '#5e4b3c', emoji: '🧥' },
  };
})();

// 2. Bài đăng mạng xã hội -------------------------------------------------------------
const socialPost: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 40, y: 220, width: 1000, height: 920, radius: 0 };
  const ink = '#1f2328';
  const icons =
    `<path d="M92 1200c-24-18-40-30-40-48a20 20 0 0 1 40-8a20 20 0 0 1 40 8c0 18-16 30-40 48z" fill="#ff3b5c"/>` +
    `<path d="M180 1146h56a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8h-34l-16 14v-14h-6a8 8 0 0 1-8-8v-30a8 8 0 0 1 8-8z" fill="none" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M282 1170l64-28-22 64-12-24z" fill="none" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M980 1142v58l-20-14-20 14v-58z" fill="none" stroke="${ink}" stroke-width="5" stroke-linejoin="round"/>`;
  return {
    id: 'style-social-post',
    name: 'Bài đăng mạng xã hội',
    category: 'Sản phẩm',
    description: 'Giống một bài đăng: ảnh đại diện, tên shop, nút tim – bình luận – chia sẻ và chú thích.',
    width: W,
    height: H,
    background: '#eef0f3',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      defs: shadow('sh', '#1f2328', 0.12, 8, 18) + linear('ring', ['#ffb347', '#ff3b5c', '#8b5cf6'], 1, 1),
      back:
        `<rect width="${W}" height="${H}" fill="#eef0f3"/>` +
        `<path d="${roundRect(40, 60, 1000, 1260, 36)}" fill="#ffffff" filter="url(#sh)"/>` +
        `<circle cx="120" cy="140" r="46" fill="url(#ring)"/><circle cx="120" cy="140" r="39" fill="#ffffff"/><circle cx="120" cy="140" r="34" fill="#ffd8a8"/>` +
        `<circle cx="950" cy="140" r="6" fill="${ink}"/><circle cx="972" cy="140" r="6" fill="${ink}"/><circle cx="994" cy="140" r="6" fill="${ink}"/>` +
        icons,
    }),
    texts: [
      input('t1', 'Tên shop', { text: 'tenshop.official', x: 184, y: 106, width: 600, fontSize: 34, fill: ink }),
      input('t2', 'Địa điểm', { text: 'TP. Hồ Chí Minh', x: 184, y: 150, width: 600, fontSize: 24, fontStyle: 'normal', fill: '#6b7280' }),
      input('t3', 'Lượt thích', { text: '1.248 lượt thích', x: 60, y: 1218, width: 600, fontSize: 28, fill: ink }),
      input('t4', 'Chú thích', { text: 'Hàng mới về – inbox ngay để giữ size nhé!', x: 60, y: 1260, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#374151' }),
    ],
    sample: { from: '#ffe8d6', to: '#ffb4a2', emoji: '🛍️' },
  };
})();

// 3. Hoá đơn – Quán ăn ---------------------------------------------------------------------
const receipt: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 120, y: 70, width: 840, height: 640, radius: 24 };
  let zig = `M140 760H940V1250`;
  for (let x = 940; x > 140; x -= 40) zig += `L${x - 20} 1274L${x - 40} 1250`;
  zig += 'Z';
  const dash = (y: number) => `<path d="M180 ${y}H900" stroke="#c9c2b6" stroke-width="3" stroke-dasharray="10 10"/>`;
  return {
    id: 'style-receipt',
    name: 'Hoá đơn – Quán ăn',
    category: 'Ẩm thực',
    description: 'Ảnh món ăn kèm tờ hoá đơn mép răng cưa liệt kê món và tổng tiền – vui mắt cho quán ăn, combo.',
    width: W,
    height: H,
    background: '#e8e3da',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: shadow('sh', '#5b4a35', 0.22, 8, 12),
      back:
        `<rect width="${W}" height="${H}" fill="#e8e3da"/>` +
        `<path d="${zig}" fill="#fffdf8" filter="url(#sh)"/>` +
        dash(870) + dash(1110),
    }),
    texts: [
      input('t1', 'Tên quán', { text: 'QUÁN NGON', x: 140, y: 782, width: 800, fontSize: 44, fontFamily: 'Oswald', fill: '#2b2118', align: 'center', letterSpacing: 6 }),
      input('t2', 'Địa chỉ', { text: '12 Lê Lợi, Q.1', x: 140, y: 834, width: 800, fontSize: 22, fontStyle: 'normal', fill: '#8a7f72', align: 'center' }),
      input('t3', 'Món 1', { text: '1 × Cơm gà xối mỡ', x: 180, y: 900, width: 520, fontSize: 32, fontFamily: 'Roboto', fontStyle: 'normal', fill: '#2b2118' }),
      input('t4', 'Giá món 1', { text: '55.000', x: 700, y: 900, width: 200, fontSize: 32, fontFamily: 'Roboto', fontStyle: 'normal', fill: '#2b2118', align: 'right' }),
      input('t5', 'Món 2', { text: '1 × Trà tắc', x: 180, y: 956, width: 520, fontSize: 32, fontFamily: 'Roboto', fontStyle: 'normal', fill: '#2b2118' }),
      input('t6', 'Giá món 2', { text: '15.000', x: 700, y: 956, width: 200, fontSize: 32, fontFamily: 'Roboto', fontStyle: 'normal', fill: '#2b2118', align: 'right' }),
      input('t7', 'Khuyến mãi', { text: 'Giảm combo', x: 180, y: 1012, width: 520, fontSize: 32, fontFamily: 'Roboto', fontStyle: 'normal', fill: '#c2410c' }),
      input('t8', 'Số tiền giảm', { text: '-10.000', x: 700, y: 1012, width: 200, fontSize: 32, fontFamily: 'Roboto', fontStyle: 'normal', fill: '#c2410c', align: 'right' }),
      fixed('t9', { text: 'TỔNG', x: 180, y: 1140, width: 300, fontSize: 40, fontFamily: 'Oswald', fill: '#2b2118', letterSpacing: 4 }),
      input('t10', 'Tổng tiền', { text: '60.000đ', x: 500, y: 1132, width: 400, fontSize: 52, fontFamily: 'Oswald', fill: '#2b2118', align: 'right' }),
      input('t11', 'Hotline', { text: 'Giao hàng: 0909 123 456', x: 0, y: 1296, width: W, fontSize: 28, fontStyle: 'normal', fill: '#5b4a35', align: 'center' }),
    ],
    sample: { from: '#ffe2b8', to: '#e0a15a', emoji: '🍗' },
  };
})();

// 4. Bảng phấn – Món hôm nay ----------------------------------------------------------------
const chalkboard: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 120, y: 260, width: 840, height: 700, radius: 16 };
  return {
    id: 'style-chalkboard',
    name: 'Bảng phấn – Món hôm nay',
    category: 'Ẩm thực',
    description: 'Bảng đen viền gỗ, chữ phấn viết tay và khung nét đứt – như bảng menu trước quán.',
    width: W,
    height: H,
    background: '#22312b',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: linear('wood', ['#9c6b43', '#6f4528'], 1, 1),
      back:
        `<rect width="${W}" height="${H}" fill="url(#wood)"/>` +
        `<rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="#22312b"/>` +
        Array.from({ length: 70 }, (_, i) => {
          const rnd = seeded(900 + i);
          return `<rect x="${(rnd() * 980 + 50).toFixed(0)}" y="${(rnd() * 1250 + 50).toFixed(0)}" width="${(20 + rnd() * 80).toFixed(0)}" height="2" fill="#ffffff" opacity="0.04" transform="rotate(${(rnd() * 20 - 10).toFixed(0)})"/>`;
        }).join(''),
      front:
        `<path d="${roundRect(slot.x - 18, slot.y - 18, slot.width + 36, slot.height + 36, 26)}" fill="none" stroke="#f4f1e8" stroke-width="4" stroke-dasharray="18 12" opacity="0.85"/>` +
        `<path d="M300 1110q120 -20 240 0t240 0" fill="none" stroke="#f4f1e8" stroke-width="3" opacity="0.7"/>`,
    }),
    texts: [
      fixed('t1', { text: 'Món đặc biệt hôm nay', x: 60, y: 84, width: 960, fontSize: 76, fontFamily: 'Dancing Script', fill: '#f4f1e8', align: 'center' }),
      fixed('t2', { text: 'TODAY’S SPECIAL', x: 0, y: 186, width: W, fontSize: 24, fontFamily: 'Montserrat', fill: '#f2c94c', align: 'center', letterSpacing: 10 }),
      input('t3', 'Tên món', { text: 'Bún bò Huế', x: 60, y: 1000, width: 960, fontSize: 80, fontFamily: 'Dancing Script', fill: '#ffffff', align: 'center' }),
      input('t4', 'Giá', { text: '50.000đ', x: 0, y: 1136, width: W, fontSize: 60, fontFamily: 'Dancing Script', fill: '#f2c94c', align: 'center' }),
      input('t5', 'Giờ mở cửa', { text: 'Mở cửa 6h – 21h · 0909 123 456', x: 0, y: 1236, width: W, fontSize: 28, fontStyle: 'normal', fill: '#cfd8d3', align: 'center' }),
    ],
    sample: { from: '#f3c98b', to: '#b5651d', emoji: '🍜' },
  };
})();

// 5. Hot Deal – thẻ nghiêng ------------------------------------------------------------------------
const hotDeal: Preset = (() => {
  const W = 1080, H = 1350;
  return {
    id: 'style-hot-deal',
    name: 'Hot Deal – Thẻ nghiêng',
    category: 'Sản phẩm',
    description: 'Gradient tím – hồng – cam rực rỡ, ảnh nghiêng chồng lớp năng động cho deal hot.',
    width: W,
    height: H,
    background: '#7c3aed',
    photoSlot: { x: 90, y: 230, width: 900, height: 820, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: rotatedRect(540, 640, 800, 740, -4),
      defs: linear('bg', ['#7c3aed', '#ec4899', '#f97316'], 1, 1) + shadow('sh', '#3b0764', 0.35, 14, 18),
      back:
        `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
        `<circle cx="960" cy="140" r="220" fill="#ffffff" opacity="0.08"/><circle cx="100" cy="1250" r="260" fill="#ffffff" opacity="0.08"/>` +
        `<path d="${rotatedRect(556, 652, 840, 780, 4)}" fill="#ffffff" opacity="0.3"/>` +
        `<path d="${rotatedRect(540, 640, 836, 776, -4)}" fill="#ffffff" filter="url(#sh)"/>`,
      front:
        `<path d="${starburst(900, 1110, 120, 100, 18)}" fill="#facc15"/>` +
        `<path d="${sparkle(110, 210, 30)}" fill="#ffffff"/><path d="${sparkle(990, 330, 20)}" fill="#ffffff"/>`,
    }),
    texts: [
      fixed('t1', { text: 'HOT DEAL', x: 0, y: 40, width: W, fontSize: 150, fontFamily: 'Oswald', fill: '#ffffff', align: 'center', letterSpacing: 8 }),
      input('t2', 'Tên sản phẩm', { text: 'Máy xay sinh tố mini', x: 60, y: 1080, width: 720, fontSize: 48, fill: '#ffffff' }),
      input('t3', 'Giá', { text: '299.000đ', x: 60, y: 1150, width: 720, fontSize: 84, fontFamily: 'Oswald', fill: '#ffffff' }),
      input('t4', 'Giảm giá', { text: '-45%', x: 800, y: 1076, width: 200, fontSize: 64, fontFamily: 'Oswald', fill: '#7c2d12', align: 'center' }),
      input('t5', 'Hotline', { text: 'Đặt hàng: 0909 123 456', x: 60, y: 1268, width: 720, fontSize: 28, fontStyle: 'normal', fill: '#fde7f3' }),
    ],
    sample: { from: '#fdf2f8', to: '#f9a8d4', emoji: '🥤' },
  };
})();

// 6. Khung tranh gỗ – Decor -------------------------------------------------------------------------
const woodFrame: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 220, y: 200, width: 640, height: 720, radius: 0 };
  return {
    id: 'style-wood-frame',
    name: 'Khung tranh gỗ',
    category: 'Nội thất',
    description: 'Ảnh lồng trong khung tranh gỗ có viền giấy trắng, treo trên tường – hợp tranh, decor, đồ gỗ.',
    width: W,
    height: H,
    background: '#ece7df',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      defs: linear('wood', ['#b07a4a', '#7a4a26', '#a26b3c'], 1, 1) + shadow('sh', '#3d2a1a', 0.35, 18, 18),
      back:
        `<rect width="${W}" height="${H}" fill="#ece7df"/><rect y="1060" width="${W}" height="290" fill="#e2dbcf"/>` +
        `<path d="M540 60L360 130M540 60L720 130" stroke="#8a7f72" stroke-width="3" fill="none"/><circle cx="540" cy="60" r="9" fill="#8a7f72"/>` +
        `<rect x="140" y="120" width="800" height="880" fill="url(#wood)" filter="url(#sh)"/>` +
        `<rect x="180" y="160" width="720" height="800" fill="#fbf9f5"/>` +
        `<rect x="180" y="160" width="720" height="800" fill="none" stroke="#000" stroke-opacity="0.12" stroke-width="3"/>`,
      front: `<rect x="${slot.x}" y="${slot.y}" width="${slot.width}" height="${slot.height}" fill="none" stroke="#000" stroke-opacity="0.15" stroke-width="2"/>`,
    }),
    texts: [
      input('t1', 'Tên sản phẩm', { text: 'Tranh sơn dầu "Bình yên"', x: 60, y: 1060, width: 960, fontSize: 52, fontFamily: 'Playfair Display', fill: '#3d2a1a', align: 'center' }),
      input('t2', 'Kích thước', { text: 'Khổ 60 × 80 cm · Khung gỗ sồi', x: 60, y: 1140, width: 960, fontSize: 30, fontStyle: 'normal', fill: '#7a6a5a', align: 'center' }),
      input('t3', 'Giá', { text: '1.850.000đ', x: 0, y: 1200, width: W, fontSize: 56, fontFamily: 'Oswald', fill: '#7a4a26', align: 'center' }),
      input('t4', 'Tên shop', { text: '@tenshop', x: 0, y: 1282, width: W, fontSize: 26, fontStyle: 'normal', fill: '#8a7f72', align: 'center' }),
    ],
    sample: { from: '#c9e4de', to: '#5f8d7e', emoji: '🖼️' },
  };
})();

// 7. Vé sự kiện ----------------------------------------------------------------------------------------
const ticket: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 130, y: 130, width: 820, height: 700, radius: 20 };
  const paper = '#fff7e6', bg = '#1d1b4c', gold = '#f2b705';
  return {
    id: 'style-event-ticket',
    name: 'Vé sự kiện',
    category: 'Sự kiện',
    description: 'Ảnh nằm trên tấm vé có khía tròn và đường xé nét đứt – cho hội thảo, workshop, live show.',
    width: W,
    height: H,
    background: bg,
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: shadow('sh', '#000', 0.4, 14, 18),
      back:
        `<rect width="${W}" height="${H}" fill="${bg}"/>` +
        Array.from({ length: 40 }, (_, i) => {
          const rnd = seeded(70 + i);
          return `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * H).toFixed(0)}" r="${(1 + rnd() * 2.5).toFixed(1)}" fill="#ffffff" opacity="${(0.2 + rnd() * 0.4).toFixed(2)}"/>`;
        }).join('') +
        `<path d="${roundRect(90, 90, 900, 1180, 36)}" fill="${paper}" filter="url(#sh)"/>` +
        `<circle cx="90" cy="900" r="38" fill="${bg}"/><circle cx="990" cy="900" r="38" fill="${bg}"/>` +
        `<path d="M150 900H930" stroke="#c9b48a" stroke-width="4" stroke-dasharray="16 14"/>`,
    }),
    texts: [
      fixed('t1', { text: 'VÉ VÀO CỬA', x: 140, y: 944, width: 500, fontSize: 24, fontFamily: 'Montserrat', fill: '#8a7a5a', letterSpacing: 8 }),
      input('t2', 'Tên sự kiện', { text: 'Workshop chụp ảnh sản phẩm', x: 140, y: 990, width: 800, fontSize: 46, fill: bg }),
      input('t3', 'Thời gian', { text: '19:00 · Thứ Bảy 15/11', x: 140, y: 1120, width: 520, fontSize: 34, fill: '#3b3a6b' }),
      input('t4', 'Địa điểm', { text: 'Nhà văn hoá Thanh Niên, Q.1', x: 140, y: 1170, width: 520, fontSize: 28, fontStyle: 'normal', fill: '#6b6a8f' }),
      input('t5', 'Giá vé', { text: '250K', x: 660, y: 1108, width: 280, fontSize: 96, fontFamily: 'Oswald', fill: gold, align: 'right' }),
    ],
    sample: { from: '#c7d2fe', to: '#6366f1', emoji: '📸' },
  };
})();

// 8. Vở học – Khai giảng -------------------------------------------------------------------------------
const notebook: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 150, y: 220, width: 800, height: 640, radius: 0 };
  const rings = Array.from({ length: 9 }, (_, i) => {
    const x = 150 + i * 98;
    return `<circle cx="${x}" cy="112" r="14" fill="#cfd8e3"/><path d="M${x} 112V60a14 14 0 0 1 28 0V104" fill="none" stroke="#6b7280" stroke-width="7" stroke-linecap="round"/>`;
  }).join('');
  const lines = Array.from({ length: 22 }, (_, i) => `<rect x="60" y="${180 + i * 52}" width="960" height="2" fill="#bcd4f0"/>`).join('');
  const tape = (x: number, y: number, deg: number) => `<rect x="${x}" y="${y}" width="150" height="46" fill="#fde68a" opacity="0.85" transform="rotate(${deg} ${x + 75} ${y + 23})"/>`;
  return {
    id: 'style-notebook',
    name: 'Vở học – Khai giảng',
    category: 'Giáo dục',
    description: 'Trang vở kẻ dòng, gáy lò xo và băng dính giấy – hợp trung tâm ngoại ngữ, lớp học, khoá học online.',
    width: W,
    height: H,
    background: '#dbeafe',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      defs: shadow('sh', '#1e3a8a', 0.18, 8, 14),
      back:
        `<rect width="${W}" height="${H}" fill="#dbeafe"/>` +
        `<rect x="60" y="80" width="960" height="1220" rx="18" fill="#ffffff" filter="url(#sh)"/>` +
        lines + `<rect x="128" y="80" width="3" height="1220" fill="#f87171" opacity="0.7"/>` +
        `<rect x="${slot.x - 16}" y="${slot.y - 16}" width="${slot.width + 32}" height="${slot.height + 32}" fill="#ffffff" filter="url(#sh)"/>`,
      front: rings + tape(110, 186, -14) + tape(840, 186, 12),
    }),
    texts: [
      fixed('t1', { text: 'KHAI GIẢNG KHOÁ MỚI', x: 60, y: 900, width: 960, fontSize: 30, fontFamily: 'Montserrat', fill: '#ef4444', align: 'center', letterSpacing: 6 }),
      input('t2', 'Tên khoá học', { text: 'Tiếng Anh giao tiếp', x: 60, y: 946, width: 960, fontSize: 70, fontFamily: 'Pacifico', fontStyle: 'normal', fill: '#1e3a8a', align: 'center' }),
      input('t3', 'Lịch học', { text: 'Thứ 2 – 4 – 6 · 19h00 · Sĩ số 12 học viên', x: 60, y: 1070, width: 960, fontSize: 30, fontStyle: 'normal', fill: '#334155', align: 'center' }),
      input('t4', 'Học phí', { text: 'Học phí: 2.900.000đ / 3 tháng', x: 60, y: 1130, width: 960, fontSize: 40, fill: '#ef4444', align: 'center' }),
      input('t5', 'Hotline', { text: 'Đăng ký: 0909 123 456', x: 60, y: 1206, width: 960, fontSize: 32, fill: '#1e3a8a', align: 'center' }),
    ],
    sample: { from: '#e0f2fe', to: '#7dd3fc', emoji: '📚' },
  };
})();

// 9. Đá cuội – Spa -----------------------------------------------------------------------------------------
const zenSpa: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 120, y: 120, width: 840, height: 840, radius: 220 };
  // Chồng đá cuội ở góc phải dưới vùng ảnh (dời lên để không chạm tên dịch vụ)
  const stones = [
    [900, 930, 130, 52, '#6b625a'],
    [904, 868, 100, 40, '#8c8279'],
    [898, 816, 72, 30, '#a69c92'],
    [902, 776, 46, 20, '#c2b8ae'],
  ]
    .map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/>`)
    .join('');
  return {
    id: 'style-zen-spa',
    name: 'Đá cuội – Spa',
    category: 'Làm đẹp',
    description: 'Tông be dịu, ảnh bo tròn lớn, chồng đá cuội và lá xanh – thư thái cho spa, massage, yoga.',
    width: W,
    height: H,
    background: '#efe9e1',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back: `<rect width="${W}" height="${H}" fill="#efe9e1"/><circle cx="160" cy="1240" r="180" fill="#e3dbd0"/>`,
      front:
        stones +
        `<path d="${leaf(200, 44)}" fill="#7d8f69" transform="translate(110 950) rotate(-60)"/>` +
        `<path d="${leaf(160, 36)}" fill="#a3b18a" transform="translate(120 960) rotate(-95)"/>` +
        `<rect x="490" y="1150" width="100" height="2" fill="#8c8279"/>`,
    }),
    texts: [
      input('t1', 'Tên dịch vụ', { text: 'Massage đá nóng', x: 60, y: 1010, width: 960, fontSize: 70, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#4a403a', align: 'center' }),
      input('t2', 'Thời lượng', { text: '90 phút · Tinh dầu thiên nhiên', x: 60, y: 1098, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#7a6f66', align: 'center' }),
      input('t3', 'Giá', { text: '590.000đ', x: 0, y: 1172, width: W, fontSize: 52, fontFamily: 'Montserrat', fill: '#6b625a', align: 'center' }),
      input('t4', 'Đặt lịch', { text: 'Đặt lịch: 0909 123 456', x: 0, y: 1258, width: W, fontSize: 28, fontStyle: 'normal', fill: '#7a6f66', align: 'center' }),
    ],
    sample: { from: '#f5e6d8', to: '#cdb49b', emoji: '🪷' },
  };
})();

// 10. Khuyến mãi Tết -----------------------------------------------------------------------------------------
const tet: Preset = (() => {
  const W = 1080, H = 1350;
  const cx = 540, cy = 600, r = 360;
  const gold = '#f6c453', red = '#b3001b';
  const lantern = (x: number, y: number, s: number) =>
    `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<path d="M0 -140V-60" stroke="${gold}" stroke-width="4"/>` +
    `<rect x="-26" y="-66" width="52" height="16" rx="4" fill="${gold}"/>` +
    `<ellipse cx="0" cy="0" rx="70" ry="56" fill="#e0242f"/><path d="M-36 -48Q-52 0 -36 48M0 -56V56M36 -48Q52 0 36 48" fill="none" stroke="${gold}" stroke-width="3" opacity="0.8"/>` +
    `<rect x="-26" y="50" width="52" height="16" rx="4" fill="${gold}"/>` +
    `<path d="M-10 66V120M0 66V130M10 66V120" stroke="${gold}" stroke-width="3"/></g>`;
  const pattern = Array.from({ length: 30 }, (_, i) => {
    const x = (i % 6) * 200 + (Math.floor(i / 6) % 2) * 100;
    const y = Math.floor(i / 6) * 280 + 40;
    return `<circle cx="${x}" cy="${y}" r="60" fill="none" stroke="${gold}" stroke-width="2" opacity="0.12"/><circle cx="${x}" cy="${y}" r="30" fill="none" stroke="${gold}" stroke-width="2" opacity="0.12"/>`;
  }).join('');
  return {
    id: 'style-tet',
    name: 'Khuyến mãi Tết',
    category: 'Sự kiện',
    description: 'Đỏ – vàng truyền thống, đèn lồng và hoạ tiết tròn – cho chương trình Tết, lì xì, quà biếu.',
    width: W,
    height: H,
    background: red,
    photoSlot: { x: cx - r, y: cy - r, width: r * 2, height: r * 2, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: circle(cx, cy, r),
      defs: linear('bg', ['#c8102e', '#8a0014']),
      back: `<rect width="${W}" height="${H}" fill="url(#bg)"/>${pattern}`,
      front:
        `<circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="none" stroke="${gold}" stroke-width="10"/>` +
        `<circle cx="${cx}" cy="${cy}" r="${r + 30}" fill="none" stroke="${gold}" stroke-width="2"/>` +
        lantern(120, 230, 1) + lantern(960, 200, 0.85) +
        `<path d="${sparkle(200, 900, 22)}" fill="${gold}"/><path d="${sparkle(900, 940, 28)}" fill="${gold}"/>`,
    }),
    texts: [
      fixed('t1', { text: 'KHUYẾN MÃI TẾT', x: 0, y: 60, width: W, fontSize: 80, fontFamily: 'Playfair Display', fill: gold, align: 'center', letterSpacing: 4 }),
      input('t2', 'Ưu đãi', { text: 'Lì xì đến 30%', x: 60, y: 1010, width: 960, fontSize: 84, fontFamily: 'Dancing Script', fill: '#ffffff', align: 'center' }),
      input('t3', 'Sản phẩm', { text: 'Hộp quà Tết cao cấp · Giao toàn quốc', x: 60, y: 1124, width: 960, fontSize: 32, fontStyle: 'normal', fill: '#fde7c2', align: 'center' }),
      input('t4', 'Hotline', { text: 'Đặt quà: 0909 123 456', x: 0, y: 1210, width: W, fontSize: 40, fill: gold, align: 'center' }),
    ],
    sample: { from: '#ffe08a', to: '#d97706', emoji: '🧧' },
  };
})();

// 11. Siêu sale ngày đôi ----------------------------------------------------------------------------------
const megaSale: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 140, y: 380, width: 800, height: 660, radius: 36 };
  const coins = [
    [120, 300, 46], [980, 420, 40], [80, 1120, 38], [1000, 1180, 50], [210, 220, 22], [900, 300, 24],
  ]
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffc83d"/><circle cx="${x}" cy="${y}" r="${r * 0.7}" fill="none" stroke="#e59b00" stroke-width="4"/>`)
    .join('');
  return {
    id: 'style-mega-sale',
    name: 'Siêu sale ngày đôi',
    category: 'Sản phẩm',
    description: 'Đỏ rực, con số ngày đôi cực lớn và đồng xu vàng – cho các đợt sale 9.9, 11.11, 12.12.',
    width: W,
    height: H,
    background: '#e1251b',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: linear('bg', ['#ff3b2f', '#c4120c']) + shadow('sh', '#5c0400', 0.35, 12, 16),
      back:
        `<rect width="${W}" height="${H}" fill="url(#bg)"/>` + coins +
        `<path d="${roundRect(slot.x - 20, slot.y - 20, slot.width + 40, slot.height + 40, 50)}" fill="#ffffff" filter="url(#sh)"/>`,
      front: `<path d="${roundRect(300, 1090, 480, 110, 55)}" fill="#ffc83d" filter="url(#sh)"/>`,
    }),
    texts: [
      input('t1', 'Ngày sale', { text: '11.11', x: 0, y: 30, width: W, fontSize: 210, fontFamily: 'Oswald', fill: '#ffffff', align: 'center', stroke: '#8a0a05', strokeWidth: 6 }),
      fixed('t2', { text: 'SIÊU SALE – GIẢM ĐẾN 50%', x: 0, y: 290, width: W, fontSize: 40, fontFamily: 'Oswald', fill: '#ffe08a', align: 'center', letterSpacing: 4 }),
      input('t3', 'Giá', { text: '149.000đ', x: 300, y: 1108, width: 480, fontSize: 70, fontFamily: 'Oswald', fill: '#b3100a', align: 'center' }),
      input('t4', 'Tên sản phẩm', { text: 'Tai nghe không dây', x: 0, y: 1230, width: W, fontSize: 38, fill: '#ffffff', align: 'center' }),
      input('t5', 'Ghi chú', { text: 'Freeship mọi đơn · Chỉ trong 24h', x: 0, y: 1286, width: W, fontSize: 26, fontStyle: 'normal', fill: '#ffd6d1', align: 'center' }),
    ],
    sample: { from: '#f1f5f9', to: '#cbd5e1', emoji: '🎧' },
  };
})();

// 12. Cuộn phim – Kỷ niệm chuyến đi ---------------------------------------------------------------------------
const filmStrip: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 70, y: 300, width: 940, height: 640, radius: 0 };
  const perf = (y: number) =>
    Array.from({ length: 16 }, (_, i) => `<path d="${roundRect(28 + i * 66, y, 38, 30, 6)}" fill="#f5efe6"/>`).join('');
  return {
    id: 'style-film-strip',
    name: 'Cuộn phim – Kỷ niệm',
    category: 'Du lịch',
    description: 'Ảnh như một khung phim âm bản có lỗ răng hai bên – hoài niệm cho du lịch, homestay, ảnh cưới.',
    width: W,
    height: H,
    background: '#f5efe6',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      back:
        `<rect width="${W}" height="${H}" fill="#f5efe6"/>` +
        `<rect x="0" y="220" width="${W}" height="800" fill="#1a1a1a"/>` + perf(240) + perf(990),
      front: '',
    }),
    texts: [
      fixed('t1', { text: 'KỶ NIỆM CHUYẾN ĐI', x: 0, y: 80, width: W, fontSize: 30, fontFamily: 'Montserrat', fill: '#c2410c', align: 'center', letterSpacing: 10 }),
      input('t2', 'Điểm đến', { text: 'Sa Pa mùa lúa chín', x: 40, y: 120, width: 1000, fontSize: 70, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#2b2118', align: 'center' }),
      fixed('t3', { text: '24', x: 70, y: 948, width: 100, fontSize: 24, fontFamily: 'Montserrat', fill: '#f59e0b' }),
      fixed('t4', { text: '24A ▸', x: 860, y: 948, width: 150, fontSize: 24, fontFamily: 'Montserrat', fill: '#f59e0b', align: 'right' }),
      input('t5', 'Gói tour', { text: 'Tour 2N1Đ · Khởi hành thứ Sáu hằng tuần', x: 40, y: 1070, width: 1000, fontSize: 32, fontStyle: 'normal', fill: '#5a4a3a', align: 'center' }),
      input('t6', 'Giá', { text: '1.890.000đ', x: 0, y: 1130, width: W, fontSize: 64, fontFamily: 'Oswald', fill: '#c2410c', align: 'center' }),
      input('t7', 'Hotline', { text: 'Hotline: 0909 123 456', x: 0, y: 1240, width: W, fontSize: 32, fill: '#2b2118', align: 'center' }),
    ],
    sample: { from: '#fde68a', to: '#65a30d', emoji: '🏔️' },
  };
})();

// 13. Ghim bản đồ – Địa điểm -------------------------------------------------------------------------------------
const mapPinPreset: Preset = (() => {
  const W = 1080, H = 1350;
  const cx = 540, cy = 470, r = 330, d = 520;
  const roads =
    `<path d="M-20 300C200 340 300 200 520 240S900 360 1100 300" fill="none" stroke="#ffffff" stroke-width="26"/>` +
    `<path d="M200 -20C240 300 120 600 260 900S240 1200 300 1370" fill="none" stroke="#ffffff" stroke-width="20"/>` +
    `<path d="M860 -20C820 300 960 700 820 1370" fill="none" stroke="#ffffff" stroke-width="20"/>` +
    `<path d="M-20 820C300 760 700 900 1100 780" fill="none" stroke="#ffffff" stroke-width="16"/>` +
    `<path d="M-20 1050C260 1000 500 1120 760 1040S1000 980 1100 1000" fill="none" stroke="#a5d8ff" stroke-width="44"/>`;
  return {
    id: 'style-map-pin',
    name: 'Ghim bản đồ',
    category: 'Du lịch',
    description: 'Ảnh hình ghim định vị trên nền bản đồ – hợp quán cà phê, cửa hàng, homestay cần chỉ đường.',
    width: W,
    height: H,
    background: '#eef1e6',
    photoSlot: { x: cx - r, y: cy - r, width: r * 2, height: r + d, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: mapPin(cx, cy, r, d),
      defs: shadow('sh', '#7f1d1d', 0.35, 16, 14),
      back:
        `<rect width="${W}" height="${H}" fill="#eef1e6"/>` +
        `<rect x="330" y="560" width="140" height="120" rx="10" fill="#d9e5c8"/><rect x="920" y="520" width="120" height="180" rx="10" fill="#d9e5c8"/>` +
        roads +
        `<path d="${mapPin(cx, cy, r + 16, d + 24)}" fill="#e63946" filter="url(#sh)"/>`,
      front: `<ellipse cx="${cx}" cy="${cy + d + 24}" rx="70" ry="16" fill="#000" opacity="0.18"/>`,
    }),
    texts: [
      input('t1', 'Tên địa điểm', { text: 'Cà phê Mây Lang Thang', x: 60, y: 1060, width: 960, fontSize: 56, fill: '#1f2937', align: 'center' }),
      input('t2', 'Địa chỉ', { text: '25 Trần Hưng Đạo, TP. Đà Lạt', x: 60, y: 1140, width: 960, fontSize: 32, fontStyle: 'normal', fill: '#4b5563', align: 'center' }),
      input('t3', 'Giờ mở cửa', { text: 'Mở cửa 7h – 22h · 0909 123 456', x: 60, y: 1200, width: 960, fontSize: 30, fill: '#e63946', align: 'center' }),
    ],
    sample: { from: '#fde2c8', to: '#c08457', emoji: '☕' },
  };
})();

// 14. Khách hàng nói gì ------------------------------------------------------------------------------------------
const testimonial: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 120, y: 120, width: 840, height: 600, radius: 32 };
  const stars = Array.from({ length: 5 }, (_, i) => `<path d="${starburst(436 + i * 52, 930, 22, 9, 5)}" fill="#f5a524"/>`).join('');
  return {
    id: 'style-testimonial',
    name: 'Khách hàng nói gì',
    category: 'Sản phẩm',
    description: 'Ảnh khách hàng / sản phẩm trong bong bóng hội thoại, lời khen và 5 sao – tăng uy tín cho shop.',
    width: W,
    height: H,
    background: '#f7f3ee',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: shadow('sh', '#5b4a35', 0.15, 10, 18),
      back:
        `<rect width="${W}" height="${H}" fill="#f7f3ee"/>` +
        `<g filter="url(#sh)"><path d="${roundRect(80, 80, 920, 920, 56)}" fill="#ffffff"/><path d="M180 990L170 1100L290 990Z" fill="#ffffff"/></g>` +
        `<text x="130" y="860" font-family="Georgia, serif" font-size="180" fill="#f97316" opacity="0.25">“</text>` +
        stars +
        `<circle cx="170" cy="1180" r="62" fill="#f97316"/>`,
    }),
    texts: [
      input('t1', 'Lời khen', { text: '“Hàng đẹp y hình, đóng gói kỹ, giao siêu nhanh!”', x: 140, y: 760, width: 800, fontSize: 44, fontFamily: 'Playfair Display', fontStyle: 'italic', fill: '#2b2118', align: 'center' }),
      input('t2', 'Chữ cái đầu', { text: 'L', x: 108, y: 1148, width: 124, fontSize: 64, fill: '#ffffff', align: 'center' }),
      input('t3', 'Tên khách hàng', { text: 'Chị Lan Anh', x: 260, y: 1136, width: 700, fontSize: 44, fill: '#2b2118' }),
      input('t4', 'Ghi chú', { text: 'Khách hàng thân thiết · Hà Nội', x: 260, y: 1194, width: 700, fontSize: 28, fontStyle: 'normal', fill: '#8a7f72' }),
      input('t5', 'Tên shop', { text: '@tenshop', x: 0, y: 1288, width: W, fontSize: 26, fontStyle: 'normal', fill: '#8a7f72', align: 'center' }),
    ],
    sample: { from: '#fde7d9', to: '#f4a582', emoji: '😊' },
  };
})();

// 15. Phiếu giảm giá -----------------------------------------------------------------------------------------------
const voucher: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 60, y: 60, width: 960, height: 760, radius: 32 };
  const bg = '#fff1e6', orange = '#ff6b35';
  return {
    id: 'style-voucher',
    name: 'Phiếu giảm giá',
    category: 'Sản phẩm',
    description: 'Ảnh sản phẩm kèm phiếu voucher có khía và đường cắt nét đứt: số tiền giảm, mã và hạn dùng.',
    width: W,
    height: H,
    background: bg,
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      defs: shadow('sh', '#9a3412', 0.25, 10, 14),
      back:
        `<rect width="${W}" height="${H}" fill="${bg}"/>` +
        `<path d="${roundRect(60, 870, 960, 400, 32)}" fill="${orange}" filter="url(#sh)"/>` +
        `<circle cx="700" cy="870" r="34" fill="${bg}"/><circle cx="700" cy="1270" r="34" fill="${bg}"/>` +
        `<path d="M700 920V1220" stroke="#ffffff" stroke-width="4" stroke-dasharray="14 12" opacity="0.8"/>` +
        `<circle cx="1000" cy="900" r="90" fill="#ffffff" opacity="0.1"/>`,
    }),
    texts: [
      fixed('t1', { text: 'VOUCHER', x: 110, y: 910, width: 560, fontSize: 34, fontFamily: 'Montserrat', fill: '#ffe4d6', letterSpacing: 10 }),
      input('t2', 'Giá trị', { text: '100K', x: 100, y: 950, width: 580, fontSize: 200, fontFamily: 'Oswald', fill: '#ffffff' }),
      input('t3', 'Điều kiện', { text: 'Cho đơn từ 500K', x: 110, y: 1196, width: 560, fontSize: 30, fontStyle: 'normal', fill: '#ffe4d6' }),
      fixed('t4', { text: 'MÃ', x: 730, y: 950, width: 260, fontSize: 24, fontFamily: 'Montserrat', fill: '#ffe4d6', align: 'center', letterSpacing: 6 }),
      input('t5', 'Mã giảm giá', { text: 'SALE100', x: 730, y: 990, width: 260, fontSize: 48, fontFamily: 'Oswald', fill: '#ffffff', align: 'center' }),
      fixed('t6', { text: 'HẠN DÙNG', x: 730, y: 1100, width: 260, fontSize: 22, fontFamily: 'Montserrat', fill: '#ffe4d6', align: 'center', letterSpacing: 4 }),
      input('t7', 'Hạn dùng', { text: '31/12', x: 730, y: 1134, width: 260, fontSize: 44, fill: '#ffffff', align: 'center' }),
    ],
    sample: { from: '#fde68a', to: '#fb923c', emoji: '🎁' },
  };
})();

// 16. Sinh nhật bé ---------------------------------------------------------------------------------------------------
const babyBirthday: Preset = (() => {
  const W = 1080, H = 1350;
  const cx = 540, cy = 560, r = 330;
  const balloon = (x: number, y: number, c: string) =>
    `<path d="M${x} ${y + 70}q-14 60 10 120" fill="none" stroke="#c9a7b4" stroke-width="3"/>` +
    `<ellipse cx="${x}" cy="${y}" rx="52" ry="66" fill="${c}"/><path d="M${x - 8} ${y + 64}h16l-8 12z" fill="${c}"/>` +
    `<ellipse cx="${x - 18}" cy="${y - 22}" rx="10" ry="18" fill="#ffffff" opacity="0.5"/>`;
  const confetti = Array.from({ length: 36 }, (_, i) => {
    const rnd = seeded(300 + i);
    const colors = ['#ff8fab', '#ffd166', '#8ecae6', '#b5e48c'];
    const x = rnd() * W, y = rnd() * 1000;
    if (Math.hypot(x - cx, y - cy) < r + 70) return '';
    return `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="14" height="8" rx="3" fill="${colors[i % 4]}" transform="rotate(${(rnd() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
  }).join('');
  return {
    id: 'style-baby-birthday',
    name: 'Sinh nhật bé',
    category: 'Mẹ & bé',
    description: 'Ảnh tròn viền vỏ sò, bóng bay và hoa giấy – dễ thương cho sinh nhật, thôi nôi, đầy tháng.',
    width: W,
    height: H,
    background: '#fff0f3',
    photoSlot: { x: cx - r, y: cy - r, width: r * 2, height: r * 2, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: circle(cx, cy, r),
      back: `<rect width="${W}" height="${H}" fill="#fff0f3"/>${confetti}<path d="${scallop(cx, cy, r + 34, 28)}" fill="#ff8fab"/>`,
      front: balloon(130, 210, '#ffd166') + balloon(960, 170, '#8ecae6') + balloon(1000, 330, '#ff8fab'),
    }),
    texts: [
      fixed('t1', { text: 'Happy Birthday', x: 0, y: 960, width: W, fontSize: 84, fontFamily: 'Pacifico', fontStyle: 'normal', fill: '#e05780', align: 'center' }),
      input('t2', 'Tên bé', { text: 'Bé Su tròn 1 tuổi', x: 60, y: 1100, width: 960, fontSize: 52, fill: '#5c3d4b', align: 'center' }),
      input('t3', 'Ngày', { text: '15 · 11 · 2026', x: 0, y: 1180, width: W, fontSize: 34, fontFamily: 'Montserrat', fontStyle: 'normal', fill: '#a26b80', align: 'center', letterSpacing: 6 }),
      input('t4', 'Lời chúc', { text: 'Con luôn khoẻ mạnh và vui vẻ nhé!', x: 0, y: 1250, width: W, fontSize: 30, fontStyle: 'normal', fill: '#a26b80', align: 'center' }),
    ],
    sample: { from: '#fde2e4', to: '#fad2e1', emoji: '👶' },
  };
})();

// 17. Phòng tập – Fitness ------------------------------------------------------------------------------------------------
const fitness: Preset = (() => {
  const W = 1080, H = 1350;
  const lime = '#c6ff00';
  const stripes = Array.from({ length: 6 }, (_, i) => `<path d="M${-200 + i * 60} ${H}L${300 + i * 60} 760H${330 + i * 60}L${-170 + i * 60} ${H}Z" fill="${lime}" opacity="0.9"/>`).join('');
  return {
    id: 'style-fitness',
    name: 'Phòng tập – Fitness',
    category: 'Sức khoẻ',
    description: 'Đen – xanh chanh mạnh mẽ, ảnh cắt xiên và sọc tốc độ – cho phòng gym, PT, đồ thể thao.',
    width: W,
    height: H,
    background: '#0f0f0f',
    photoSlot: { x: 60, y: 60, width: 960, height: 860, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: `M200 60H1020V780L880 920H60V200Z`,
      back: `<rect width="${W}" height="${H}" fill="#0f0f0f"/>` + stripes,
      front: `<path d="M200 60H1020V780L880 920H60V200Z" fill="none" stroke="${lime}" stroke-width="6"/>`,
    }),
    texts: [
      fixed('t1', { text: 'FITNESS', x: 360, y: 930, width: 680, fontSize: 150, fontFamily: 'Oswald', fill: lime, align: 'right', letterSpacing: 6 }),
      input('t2', 'Gói tập', { text: 'Gói tập 3 tháng', x: 360, y: 1110, width: 680, fontSize: 48, fill: '#ffffff', align: 'right' }),
      input('t3', 'Giá', { text: '1.499.000đ', x: 360, y: 1170, width: 680, fontSize: 64, fontFamily: 'Oswald', fill: lime, align: 'right' }),
      input('t4', 'Ưu đãi', { text: 'Tặng 2 buổi PT · 0909 123 456', x: 300, y: 1262, width: 740, fontSize: 28, fontStyle: 'normal', fill: '#d4d4d4', align: 'right' }),
    ],
    sample: { from: '#d4d4d8', to: '#52525b', emoji: '🏋️' },
  };
})();

// 18. Dự án căn hộ – Skyline ---------------------------------------------------------------------------------------------
const skyline: Preset = (() => {
  const W = 1080, H = 1350;
  const navy = '#0f1c2e', gold = '#d4af6a';
  const rnd = seeded(2026);
  let city = '';
  let x = 0;
  while (x < W) {
    const w = 50 + Math.round(rnd() * 70);
    const h = 60 + Math.round(rnd() * 150);
    city += `<rect x="${x}" y="${860 - h}" width="${w}" height="${h + 2}" fill="${navy}"/>`;
    for (let wy = 860 - h + 16; wy < 850; wy += 26)
      for (let wx = x + 10; wx < x + w - 12; wx += 20) if (rnd() > 0.55) city += `<rect x="${wx}" y="${wy}" width="8" height="10" fill="${gold}" opacity="0.8"/>`;
    x += w + 4;
  }
  return {
    id: 'style-skyline',
    name: 'Dự án căn hộ – Skyline',
    category: 'Bất động sản',
    description: 'Ảnh phối cảnh dự án, đường chân trời thành phố ánh đèn và khối thông tin xanh đậm – vàng.',
    width: W,
    height: H,
    background: navy,
    photoSlot: { x: 0, y: 0, width: W, height: 860, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(0, 0, W, 860),
      back: `<rect width="${W}" height="${H}" fill="${navy}"/><rect x="60" y="1190" width="${W - 120}" height="2" fill="${gold}" opacity="0.5"/>`,
      front: city + `<rect y="858" width="${W}" height="6" fill="${gold}"/>`,
    }),
    texts: [
      fixed('t1', { text: 'DỰ ÁN MỚI', x: 60, y: 900, width: 600, fontSize: 26, fontFamily: 'Montserrat', fill: gold, letterSpacing: 10 }),
      input('t2', 'Tên dự án', { text: 'The Riverside Residence', x: 60, y: 940, width: 960, fontSize: 60, fontFamily: 'Playfair Display', fill: '#ffffff' }),
      input('t3', 'Giá', { text: 'Chỉ từ 45 triệu/m² · Thanh toán 1%/tháng', x: 60, y: 1030, width: 960, fontSize: 34, fill: gold }),
      input('t4', 'Vị trí', { text: 'Mặt tiền sông Sài Gòn, TP. Thủ Đức', x: 60, y: 1090, width: 960, fontSize: 30, fontStyle: 'normal', fill: '#a9b6c8' }),
      fixed('t5', { text: 'HOTLINE', x: 60, y: 1240, width: 200, fontSize: 24, fontFamily: 'Montserrat', fill: gold, letterSpacing: 6 }),
      input('t6', 'Hotline', { text: '0909 123 456', x: 240, y: 1228, width: 500, fontSize: 48, fontFamily: 'Oswald', fill: '#ffffff' }),
    ],
    sample: { from: '#9ec5e8', to: '#2c5d8f', emoji: '🏙️' },
  };
})();

// 19. Màn hình điện thoại – Ứng dụng --------------------------------------------------------------------------------------
const phone: Preset = (() => {
  const W = 1080, H = 1350;
  const screen = { x: 568, y: 214, width: 412, height: 896, radius: 54 };
  return {
    id: 'style-phone-mockup',
    name: 'Màn hình điện thoại',
    category: 'Công nghệ',
    description: 'Ảnh hiển thị trong màn hình điện thoại – giới thiệu app, website, giao diện hay ảnh chụp màn hình.',
    width: W,
    height: H,
    background: '#0ea5e9',
    photoSlot: screen,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(screen.x, screen.y, screen.width, screen.height, screen.radius),
      defs: linear('bg', ['#14b8a6', '#0ea5e9', '#6366f1'], 1, 1) + shadow('sh', '#0c1e3d', 0.45, 24, 26),
      back:
        `<rect width="${W}" height="${H}" fill="url(#bg)"/>` +
        `<circle cx="120" cy="1220" r="240" fill="#ffffff" opacity="0.08"/><circle cx="1000" cy="120" r="200" fill="#ffffff" opacity="0.08"/>` +
        `<path d="${roundRect(544, 190, 460, 944, 76)}" fill="#111827" filter="url(#sh)"/>`,
      front:
        `<path d="${roundRect(714, 232, 120, 32, 16)}" fill="#111827"/>` +
        `<path d="${roundRect(64, 1004, 300, 88, 44)}" fill="#ffffff"/>`,
    }),
    texts: [
      fixed('t1', { text: 'ỨNG DỤNG MỚI', x: 64, y: 230, width: 440, fontSize: 26, fontFamily: 'Montserrat', fill: '#e0f2fe', letterSpacing: 8 }),
      input('t2', 'Tên ứng dụng', { text: 'Đặt lịch\nSpa Online', x: 64, y: 280, width: 460, fontSize: 84, fill: '#ffffff' }),
      input('t3', 'Mô tả', { text: 'Đặt lịch trong 30 giây, nhắc lịch tự động, tích điểm đổi quà mỗi lần ghé.', x: 64, y: 500, width: 440, fontSize: 32, fontStyle: 'normal', fill: '#e0f2fe' }),
      input('t4', 'Ưu đãi', { text: 'Giảm 20% lần đầu', x: 64, y: 760, width: 440, fontSize: 40, fill: '#fde047' }),
      fixed('t5', { text: 'TẢI NGAY', x: 64, y: 1030, width: 300, fontSize: 34, fill: '#0f172a', align: 'center', letterSpacing: 4 }),
      input('t6', 'Website', { text: 'tenshop.vn', x: 64, y: 1150, width: 440, fontSize: 30, fontStyle: 'normal', fill: '#e0f2fe' }),
    ],
    sample: { from: '#f8fafc', to: '#bae6fd', emoji: '📱' },
  };
})();

// 20. Chữ chạy viền ---------------------------------------------------------------------------------------------------------
const marquee: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 110, y: 110, width: 860, height: 940, radius: 0 };
  const word = (s: string, n: number) => Array.from({ length: n }, () => s).join('  ✦  ');
  return {
    id: 'style-marquee',
    name: 'Chữ chạy viền',
    category: 'Thời trang',
    description: 'Viền đen chạy chữ "NEW IN" bốn cạnh như băng rôn – cá tính cho streetwear, giày, phụ kiện.',
    width: W,
    height: H,
    background: '#f2f0eb',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      back:
        `<rect width="${W}" height="${H}" fill="#f2f0eb"/>` +
        `<rect width="${W}" height="90" fill="#111111"/><rect y="${H - 90}" width="${W}" height="90" fill="#111111"/>` +
        `<rect width="90" height="${H}" fill="#111111"/><rect x="${W - 90}" width="90" height="${H}" fill="#111111"/>`,
    }),
    texts: [
      input('t1', 'Chữ chạy', { text: word('NEW IN', 5), x: 0, y: 24, width: W, fontSize: 42, fontFamily: 'Oswald', fill: '#ffffff', align: 'center', letterSpacing: 2 }),
      input('t2', 'Chữ chạy dưới', { text: word('NEW IN', 5), x: 0, y: H - 66, width: W, fontSize: 42, fontFamily: 'Oswald', fill: '#ffffff', align: 'center', letterSpacing: 2 }),
      fixed('t3', { text: word('STREETWEAR', 3), x: 24, y: 1260, width: 1170, fontSize: 42, fontFamily: 'Oswald', fill: '#d9ff3f', align: 'center', letterSpacing: 2, rotation: -90 }),
      fixed('t4', { text: word('STREETWEAR', 3), x: 1056, y: 90, width: 1170, fontSize: 42, fontFamily: 'Oswald', fill: '#d9ff3f', align: 'center', letterSpacing: 2, rotation: 90 }),
      input('t5', 'Tên sản phẩm', { text: 'Sneaker Urban 01', x: 110, y: 1080, width: 560, fontSize: 52, fill: '#111111' }),
      input('t6', 'Tên shop', { text: '@tenshop', x: 110, y: 1152, width: 560, fontSize: 28, fontStyle: 'normal', fill: '#6b6b6b' }),
      input('t7', 'Giá', { text: '1.190K', x: 600, y: 1076, width: 370, fontSize: 96, fontFamily: 'Oswald', fill: '#111111', align: 'right' }),
    ],
    sample: { from: '#e5e5e5', to: '#a3a3a3', emoji: '👟' },
  };
})();

export const STYLE_PRESETS: Preset[] = [
  magazine,
  socialPost,
  receipt,
  chalkboard,
  hotDeal,
  woodFrame,
  ticket,
  notebook,
  zenSpa,
  tet,
  megaSale,
  filmStrip,
  mapPinPreset,
  testimonial,
  voucher,
  babyBirthday,
  fitness,
  skyline,
  phone,
  marquee,
];
