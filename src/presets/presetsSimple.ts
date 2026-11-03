// 20 mẫu đơn giản, hiện đại – nhiều khoảng trắng, chữ thanh, ít hoạ tiết – cho 5 lĩnh vực:
// bất động sản, nội thất, quà tặng, quà Tết và mỹ phẩm (mỗi lĩnh vực 4 mẫu).
import type { Preset } from './presets';
import { arch, circle, frameSvg, roundRect } from './svg';
import { fixed, input } from './text';

const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
const line = (x1: number, y1: number, x2: number, y2: number, c: string, w = 2, op = 1) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="${w}" opacity="${op}"/>`;
const shade = (H: number, from: number, opacity = 0.6) =>
  `<linearGradient id="shade" x1="0" y1="${from}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">` +
  `<stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${opacity}"/></linearGradient>`;
/** Hoa mai 5 cánh */
const mai = (x: number, y: number, r: number) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = ((i * 72 - 90) * Math.PI) / 180;
    return `<circle cx="${(x + r * 0.62 * Math.cos(a)).toFixed(1)}" cy="${(y + r * 0.62 * Math.sin(a)).toFixed(1)}" r="${(r * 0.5).toFixed(1)}" fill="#f6c445"/>`;
  }).join('') + `<circle cx="${x}" cy="${y}" r="${(r * 0.28).toFixed(1)}" fill="#e07a1f"/>`;

// ============================== BẤT ĐỘNG SẢN ==============================

// 1. Trắng tối giản ---------------------------------------------------------------
const estateWhite: Preset = (() => {
  const W = 1080, H = 1350;
  const ink = '#1c1c1c', accent = '#b08d57', mute = '#9a9a9a';
  const col = (x: number, cap: string, id: string, label: string, val: string) => [
    fixed(`${id}c`, { text: cap, x, y: 1132, width: 300, fontSize: 20, fontFamily: 'Montserrat', fill: mute, letterSpacing: 4 }),
    input(id, label, { text: val, x, y: 1162, width: 300, fontSize: 38, fill: ink }),
  ];
  return {
    id: 'simple-estate-white',
    name: 'BĐS – Trắng tối giản',
    category: 'Bất động sản',
    description: 'Ảnh lớn phía trên, nền trắng, giá màu đồng và 3 cột thông số gọn gàng.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: { x: 0, y: 0, width: W, height: 880, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(0, 0, W, 880),
      back: `<rect width="${W}" height="${H}" fill="#ffffff"/>` + line(60, 1100, 1020, 1100, '#e8e8e8') + line(380, 1132, 380, 1210, '#e8e8e8') + line(710, 1132, 710, 1210, '#e8e8e8'),
    }),
    texts: [
      fixed('t1', { text: 'ĐANG BÁN', x: 60, y: 916, width: 400, fontSize: 22, fontFamily: 'Montserrat', fill: accent, letterSpacing: 8 }),
      input('t2', 'Tiêu đề', { text: 'Biệt thự ven sông', x: 60, y: 952, width: 620, fontSize: 52, fill: ink }),
      input('t3', 'Giá', { text: '15,8 tỷ', x: 640, y: 948, width: 380, fontSize: 60, fontFamily: 'Playfair Display', fill: accent, align: 'right' }),
      input('t4', 'Địa chỉ', { text: 'Thảo Điền, TP. Thủ Đức', x: 60, y: 1030, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#777777' }),
      ...col(60, 'DIỆN TÍCH', 't5', 'Diện tích', '320 m²'),
      ...col(410, 'PHÒNG NGỦ', 't6', 'Phòng ngủ', '5 phòng'),
      ...col(740, 'PHÒNG TẮM', 't7', 'Phòng tắm', '4 phòng'),
      input('t8', 'Hotline', { text: 'Liên hệ: 0909 123 456 · Anh Minh', x: 60, y: 1268, width: 960, fontSize: 26, fontStyle: 'normal', fill: '#555555' }),
    ],
    sample: { from: '#d6e4f0', to: '#8fb0cc', emoji: '🏡' },
  };
})();

// 2. Lề rộng màu kem ------------------------------------------------------------------
const estateMargin: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 60, y: 60, width: 960, height: 960, radius: 0 };
  return {
    id: 'simple-estate-margin',
    name: 'BĐS – Lề rộng màu kem',
    category: 'Bất động sản',
    description: 'Ảnh vuông lề rộng trên nền kem, nhãn trạng thái nhỏ và tên dự án chữ có chân thanh lịch.',
    width: W,
    height: H,
    background: '#f4f1ec',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      back: `<rect width="${W}" height="${H}" fill="#f4f1ec"/>` + line(60, 1160, 1020, 1160, '#d9d2c7'),
      front: `<path d="${roundRect(100, 100, 220, 56, 28)}" fill="#ffffff"/>`,
    }),
    texts: [
      input('t1', 'Nhãn', { text: 'ĐANG BÁN', x: 100, y: 117, width: 220, fontSize: 22, fontFamily: 'Montserrat', fill: '#1c1c1c', align: 'center', letterSpacing: 4 }),
      input('t2', 'Tên dự án', { text: 'Căn hộ Sky Garden', x: 60, y: 1064, width: 640, fontSize: 56, fontFamily: 'Playfair Display', fill: '#222222' }),
      input('t3', 'Giá', { text: '6,2 tỷ', x: 640, y: 1064, width: 380, fontSize: 56, fontFamily: 'Playfair Display', fill: '#8c6d46', align: 'right' }),
      input('t4', 'Thông tin', { text: '2 PN · 86 m² · Sổ hồng lâu dài', x: 60, y: 1194, width: 560, fontSize: 28, fontStyle: 'normal', fill: '#6b6b6b' }),
      input('t5', 'Hotline', { text: '0909 123 456', x: 620, y: 1190, width: 400, fontSize: 32, fill: '#222222', align: 'right' }),
    ],
    sample: { from: '#e9e3d8', to: '#b8a68c', emoji: '🏢' },
  };
})();

// 3. Dải xanh navy (vuông) ---------------------------------------------------------------
const estateNavy: Preset = (() => {
  const W = 1080, H = 1080;
  const navy = '#14213d', gold = '#c9a96e', soft = '#aab4c8';
  const col = (x: number, cap: string, id: string, label: string, val: string) => [
    fixed(`${id}c`, { text: cap, x, y: 908, width: 320, fontSize: 20, fontFamily: 'Montserrat', fill: gold, letterSpacing: 4 }),
    input(id, label, { text: val, x, y: 938, width: 320, fontSize: 40, fill: '#ffffff' }),
  ];
  return {
    id: 'simple-estate-navy',
    name: 'BĐS – Dải xanh navy',
    category: 'Bất động sản',
    description: 'Khổ vuông: ảnh phía trên, dải xanh đậm với 3 cột Giá – Diện tích – Pháp lý.',
    width: W,
    height: H,
    background: navy,
    photoSlot: { x: 0, y: 0, width: W, height: 720, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(0, 0, W, 720),
      back: `<rect width="${W}" height="${H}" fill="${navy}"/>` + line(60, 880, 1020, 880, gold, 2, 0.4),
    }),
    texts: [
      input('t1', 'Tiêu đề', { text: 'Shophouse mặt tiền', x: 60, y: 758, width: 960, fontSize: 48, fill: '#ffffff' }),
      input('t2', 'Địa chỉ', { text: 'Đường Nguyễn Hữu Thọ, Quận 7', x: 60, y: 822, width: 960, fontSize: 26, fontStyle: 'normal', fill: soft }),
      ...col(60, 'GIÁ BÁN', 't3', 'Giá', '12 tỷ'),
      ...col(410, 'DIỆN TÍCH', 't4', 'Diện tích', '5 × 20 m'),
      ...col(760, 'PHÁP LÝ', 't5', 'Pháp lý', 'Sổ đỏ'),
      input('t6', 'Hotline', { text: 'Liên hệ: 0909 123 456', x: 60, y: 1016, width: 960, fontSize: 26, fontStyle: 'normal', fill: soft }),
    ],
    sample: { from: '#cfd8e6', to: '#6c7fa3', emoji: '🏬' },
  };
})();

// 4. Cho thuê -----------------------------------------------------------------------------------
const estateRent: Preset = (() => {
  const W = 1080, H = 1350;
  const teal = '#2a9d8f';
  const slot = { x: 60, y: 190, width: 960, height: 840, radius: 28 };
  return {
    id: 'simple-estate-rent',
    name: 'BĐS – Cho thuê',
    category: 'Bất động sản',
    description: 'Tiêu đề rõ ràng phía trên, ảnh bo góc, giá thuê màu xanh ngọc – hợp căn hộ, phòng trọ, văn phòng.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back: `<rect width="${W}" height="${H}" fill="#ffffff"/>` + line(60, 1214, 1020, 1214, '#eeeeee'),
    }),
    texts: [
      input('t1', 'Nhãn', { text: 'CHO THUÊ', x: 60, y: 62, width: 600, fontSize: 26, fontFamily: 'Montserrat', fill: teal, letterSpacing: 10 }),
      input('t2', 'Loại', { text: 'Căn hộ 2 phòng ngủ', x: 60, y: 102, width: 960, fontSize: 52, fill: '#1c1c1c' }),
      input('t3', 'Giá thuê', { text: '15 triệu/tháng', x: 60, y: 1062, width: 700, fontSize: 54, fill: teal }),
      input('t4', 'Ghi chú', { text: 'Full nội thất · Hồ bơi · Gym miễn phí', x: 60, y: 1138, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#666666' }),
      input('t5', 'Địa chỉ', { text: 'Thảo Điền, Quận 2', x: 60, y: 1252, width: 500, fontSize: 28, fontStyle: 'normal', fill: '#666666' }),
      input('t6', 'Hotline', { text: '0909 123 456', x: 560, y: 1248, width: 460, fontSize: 34, fill: '#1c1c1c', align: 'right' }),
    ],
    sample: { from: '#d8f3ee', to: '#7cc8bd', emoji: '🛋️' },
  };
})();

// ============================== NỘI THẤT ==============================

// 5. Vòm mảnh ---------------------------------------------------------------------------------------
const interiorArch: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 240, y: 130, width: 600, height: 780, radius: 0 };
  return {
    id: 'simple-interior-arch',
    name: 'Nội thất – Vòm mảnh',
    category: 'Nội thất',
    description: 'Khung vòm thanh mảnh trên nền be ấm, chữ có chân nhẹ nhàng – tinh tế cho ghế, đèn, decor.',
    width: W,
    height: H,
    background: '#ece4d9',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: arch(slot.x, slot.y, slot.width, slot.height),
      back: `<rect width="${W}" height="${H}" fill="#ece4d9"/>`,
      front: `<path d="${arch(slot.x - 18, slot.y - 18, slot.width + 36, slot.height + 36)}" fill="none" stroke="#b39b7d" stroke-width="2"/>`,
    }),
    texts: [
      input('t1', 'Nhãn', { text: 'BỘ SƯU TẬP 2026', x: 0, y: 960, width: W, fontSize: 20, fontFamily: 'Montserrat', fill: '#9a8268', align: 'center', letterSpacing: 8 }),
      input('t2', 'Tên sản phẩm', { text: 'Ghế bành Linen', x: 60, y: 996, width: 960, fontSize: 62, fontFamily: 'Playfair Display', fill: '#3d3229', align: 'center' }),
      input('t3', 'Chất liệu', { text: 'Vải linen · Gỗ tần bì tự nhiên', x: 60, y: 1088, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#7d6b5a', align: 'center' }),
      input('t4', 'Giá', { text: '6.900.000đ', x: 0, y: 1150, width: W, fontSize: 38, fontFamily: 'Montserrat', fill: '#3d3229', align: 'center' }),
      input('t5', 'Tên shop', { text: '@tenshop', x: 0, y: 1270, width: W, fontSize: 24, fontStyle: 'normal', fill: '#9a8268', align: 'center' }),
    ],
    sample: { from: '#efe2d0', to: '#c4a582', emoji: '🪑' },
  };
})();

// 6. Đánh số sản phẩm --------------------------------------------------------------------------------
const interiorNumbered: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 80, y: 80, width: 920, height: 980, radius: 0 };
  return {
    id: 'simple-interior-numbered',
    name: 'Nội thất – Đánh số',
    category: 'Nội thất',
    description: 'Ảnh lớn, số thứ tự to kiểu catalogue và thông tin gọn – đăng chuỗi bài sản phẩm rất đẹp.',
    width: W,
    height: H,
    background: '#fafafa',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      back: `<rect width="${W}" height="${H}" fill="#fafafa"/>` + line(80, 1250, 1000, 1250, '#e5e5e5'),
    }),
    texts: [
      input('t1', 'Số thứ tự', { text: '01', x: 80, y: 1088, width: 150, fontSize: 104, fontFamily: 'Playfair Display', fill: '#1c1c1c' }),
      input('t2', 'Tên sản phẩm', { text: 'Đèn bàn Halo', x: 250, y: 1104, width: 460, fontSize: 44, fill: '#1c1c1c' }),
      input('t3', 'Chất liệu', { text: 'Thuỷ tinh mờ · Đồng thau', x: 250, y: 1162, width: 460, fontSize: 26, fontStyle: 'normal', fill: '#888888' }),
      input('t4', 'Giá', { text: '2.350.000đ', x: 640, y: 1110, width: 360, fontSize: 38, fill: '#1c1c1c', align: 'right' }),
      input('t5', 'Tên shop', { text: '@tenshop', x: 80, y: 1274, width: 460, fontSize: 24, fontStyle: 'normal', fill: '#aaaaaa' }),
      input('t6', 'Website', { text: 'tenshop.vn', x: 540, y: 1274, width: 460, fontSize: 24, fontStyle: 'normal', fill: '#aaaaaa', align: 'right' }),
    ],
    sample: { from: '#f1ece4', to: '#cdbfa8', emoji: '💡' },
  };
})();

// 7. Kích thước sản phẩm ------------------------------------------------------------------------------
const interiorDims: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 120, y: 120, width: 840, height: 760, radius: 0 };
  const c = '#8a8078';
  const dims =
    line(120, 920, 960, 920, c) + line(120, 908, 120, 932, c) + line(960, 908, 960, 932, c) +
    line(1000, 120, 1000, 880, c) + line(988, 120, 1012, 120, c) + line(988, 880, 1012, 880, c);
  return {
    id: 'simple-interior-dims',
    name: 'Nội thất – Kích thước',
    category: 'Nội thất',
    description: 'Đường đo chiều rộng / chiều cao như bản vẽ kỹ thuật – khách xem là biết ngay kích thước.',
    width: W,
    height: H,
    background: '#f1efeb',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      back: `<rect width="${W}" height="${H}" fill="#f1efeb"/>`,
      front: dims,
    }),
    texts: [
      input('t1', 'Chiều rộng', { text: 'W 220 cm', x: 120, y: 934, width: 840, fontSize: 24, fontFamily: 'Montserrat', fontStyle: 'normal', fill: '#6b6259', align: 'center', letterSpacing: 2 }),
      input('t2', 'Chiều cao', { text: 'H 85 cm', x: 1048, y: 120, width: 760, fontSize: 24, fontFamily: 'Montserrat', fontStyle: 'normal', fill: '#6b6259', align: 'center', letterSpacing: 2, rotation: 90 }),
      input('t3', 'Tên sản phẩm', { text: 'Sofa Module Ivy', x: 120, y: 1010, width: 560, fontSize: 52, fill: '#2b2622' }),
      input('t4', 'Giá', { text: '24.500.000đ', x: 600, y: 1016, width: 360, fontSize: 40, fill: '#2b2622', align: 'right' }),
      input('t5', 'Mô tả', { text: 'Bọc vải bouclé · Tháo rời từng module', x: 120, y: 1086, width: 840, fontSize: 28, fontStyle: 'normal', fill: '#7a7067' }),
      input('t6', 'Tên shop', { text: '@tenshop', x: 120, y: 1262, width: 840, fontSize: 24, fontStyle: 'normal', fill: '#9b9289' }),
    ],
    sample: { from: '#ece6dc', to: '#b9ab98', emoji: '🛋️' },
  };
})();

// 8. Xanh xô thơm (vuông) ---------------------------------------------------------------------------------
const interiorSage: Preset = (() => {
  const W = 1080, H = 1080;
  const slot = { x: 80, y: 80, width: 560, height: 920, radius: 24 };
  const ink = '#2f3a2a', mute = '#6b7a5e';
  return {
    id: 'simple-interior-sage',
    name: 'Nội thất – Xanh xô thơm',
    category: 'Nội thất',
    description: 'Khổ vuông: ảnh dọc bo góc bên trái, cột thông tin bên phải trên nền xanh xô thơm dịu mắt.',
    width: W,
    height: H,
    background: '#dfe4d7',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back: `<rect width="${W}" height="${H}" fill="#dfe4d7"/>` + line(690, 600, 1000, 600, mute, 2, 0.5),
    }),
    texts: [
      input('t1', 'Nhãn', { text: 'MẪU MỚI', x: 690, y: 110, width: 330, fontSize: 20, fontFamily: 'Montserrat', fill: mute, letterSpacing: 6 }),
      input('t2', 'Tên sản phẩm', { text: 'Bàn trà gỗ óc chó', x: 690, y: 150, width: 330, fontSize: 56, fontFamily: 'Playfair Display', fill: ink }),
      input('t3', 'Mô tả', { text: 'Mặt gỗ nguyên tấm, chân thép sơn tĩnh điện. Ø 80 cm.', x: 690, y: 400, width: 320, fontSize: 26, fontStyle: 'normal', fill: mute }),
      fixed('t4', { text: 'GIÁ', x: 690, y: 640, width: 330, fontSize: 20, fontFamily: 'Montserrat', fill: mute, letterSpacing: 6 }),
      input('t5', 'Giá', { text: '8.900.000đ', x: 690, y: 672, width: 340, fontSize: 44, fill: ink }),
      input('t6', 'Tên shop', { text: '@tenshop', x: 690, y: 950, width: 330, fontSize: 24, fontStyle: 'normal', fill: mute }),
    ],
    sample: { from: '#eef0e8', to: '#a7b59a', emoji: '🪴' },
  };
})();

// ============================== QUÀ TẶNG ==============================

// 9. Hộp quà ruy băng ---------------------------------------------------------------------------------------
const giftRibbon: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 150, y: 210, width: 780, height: 780, radius: 8 };
  const rose = '#b5485d';
  const bow =
    `<g fill="${rose}"><ellipse cx="490" cy="196" rx="62" ry="30" transform="rotate(-24 490 196)"/>` +
    `<ellipse cx="590" cy="196" rx="62" ry="30" transform="rotate(24 590 196)"/>` +
    `<path d="M528 214L500 290L522 284L536 304Z"/><path d="M552 214L580 290L558 284L544 304Z"/></g>` +
    `<circle cx="540" cy="210" r="20" fill="#9c3549"/>`;
  return {
    id: 'simple-gift-ribbon',
    name: 'Quà tặng – Nơ ruy băng',
    category: 'Quà tặng',
    description: 'Ảnh vuông như hộp quà thắt ruy băng và nơ, nền trắng ấm – hợp set quà, hoa, nến thơm.',
    width: W,
    height: H,
    background: '#fbf7f4',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back:
        `<rect width="${W}" height="${H}" fill="#fbf7f4"/>` +
        `<rect x="518" y="0" width="44" height="${slot.y + slot.height}" fill="${rose}" opacity="0.85"/>` +
        `<rect x="0" y="578" width="${W}" height="44" fill="${rose}" opacity="0.85"/>`,
      front: bow,
    }),
    texts: [
      input('t2', 'Tên sản phẩm', { text: 'Hộp quà Thanh Xuân', x: 60, y: 1056, width: 960, fontSize: 56, fontFamily: 'Playfair Display', fill: '#3a2a2f', align: 'center' }),
      input('t3', 'Mô tả', { text: 'Nến thơm · Trà hoa · Thiệp viết tay', x: 60, y: 1140, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#8a7378', align: 'center' }),
      input('t4', 'Giá', { text: '450.000đ', x: 0, y: 1196, width: W, fontSize: 38, fontFamily: 'Montserrat', fill: rose, align: 'center' }),
      input('t5', 'Tên shop', { text: '@tenshop', x: 0, y: 1282, width: W, fontSize: 24, fontStyle: 'normal', fill: '#a8959a', align: 'center' }),
    ],
    sample: { from: '#fbe4e8', to: '#e8a5b4', emoji: '🎁' },
  };
})();

// 10. Thiệp gửi – nhận ---------------------------------------------------------------------------------------
const giftCard: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 80, y: 80, width: 920, height: 760, radius: 24 };
  const brown = '#a0522d', ink = '#3b2a20';
  return {
    id: 'simple-gift-card',
    name: 'Quà tặng – Thiệp gửi',
    category: 'Quà tặng',
    description: 'Ảnh món quà kèm tấm thiệp "Gửi – Từ" và lời nhắn viết tay – tặng sinh nhật, 8/3, 20/10.',
    width: W,
    height: H,
    background: '#f6efe6',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back:
        `<rect width="${W}" height="${H}" fill="#f6efe6"/>` +
        `<path d="${roundRect(80, 880, 920, 380, 24)}" fill="#ffffff"/>` +
        line(250, 996, 950, 996, '#e6dacb') + line(250, 1086, 950, 1086, '#e6dacb'),
    }),
    texts: [
      fixed('t1', { text: 'Gửi', x: 130, y: 932, width: 120, fontSize: 48, fontFamily: 'Dancing Script', fill: brown }),
      input('t2', 'Người nhận', { text: 'Mẹ yêu', x: 260, y: 924, width: 690, fontSize: 60, fontFamily: 'Dancing Script', fill: ink }),
      fixed('t3', { text: 'Từ', x: 130, y: 1022, width: 120, fontSize: 48, fontFamily: 'Dancing Script', fill: brown }),
      input('t4', 'Người gửi', { text: 'Con gái', x: 260, y: 1014, width: 690, fontSize: 60, fontFamily: 'Dancing Script', fill: ink }),
      input('t5', 'Lời nhắn', { text: 'Chúc mẹ luôn mạnh khoẻ, bình an và hạnh phúc!', x: 130, y: 1124, width: 820, fontSize: 30, fontStyle: 'normal', fill: '#6b5a4c' }),
      input('t6', 'Tên shop', { text: '@tenshop · Nhận gói quà & giao tận nơi', x: 0, y: 1288, width: W, fontSize: 24, fontStyle: 'normal', fill: '#9a8a7c', align: 'center' }),
    ],
    sample: { from: '#fde2e4', to: '#f4acb7', emoji: '💐' },
  };
})();

// 11. Nhãn tròn – Gift set ------------------------------------------------------------------------------------
const giftSticker: Preset = (() => {
  const W = 1080, H = 1350;
  return {
    id: 'simple-gift-sticker',
    name: 'Quà tặng – Nhãn tròn',
    category: 'Quà tặng',
    photoFirst: true,
    description: 'Ảnh tràn viền, chỉ một nhãn tròn trắng ghi giá và tên set quà – nổi bật mà vẫn tối giản.',
    width: W,
    height: H,
    background: '#000000',
    photoSlot: { x: 0, y: 0, width: W, height: H, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(0, 0, W, H),
      defs: shade(H, 1000),
      back: '',
      front:
        `<rect y="1000" width="${W}" height="${H - 1000}" fill="url(#shade)"/>` +
        `<circle cx="880" cy="1150" r="140" fill="#ffffff"/><circle cx="880" cy="1150" r="124" fill="none" stroke="#1c1c1c" stroke-width="1.5" opacity="0.4"/>`,
    }),
    texts: [
      fixed('t1', { text: 'GIFT SET', x: 740, y: 1094, width: 280, fontSize: 22, fontFamily: 'Montserrat', fill: '#1c1c1c', align: 'center', letterSpacing: 6 }),
      input('t2', 'Giá', { text: '599K', x: 740, y: 1126, width: 280, fontSize: 60, fontFamily: 'Playfair Display', fill: '#1c1c1c', align: 'center' }),
      input('t3', 'Tên sản phẩm', { text: 'Set quà Thư Thái', x: 60, y: 1176, width: 620, fontSize: 52, fill: '#ffffff' }),
      input('t4', 'Tên shop', { text: '@tenshop', x: 60, y: 1250, width: 620, fontSize: 26, fontStyle: 'normal', fill: '#eeeeee' }),
    ],
    sample: { from: '#f5e1d3', to: '#c79a7a', emoji: '🎁' },
  };
})();

// 12. Quà doanh nghiệp -------------------------------------------------------------------------------------------
const giftCorporate: Preset = (() => {
  const W = 1080, H = 1350;
  const navy = '#0b1d3a', gold = '#d4b483';
  const slot = { x: 100, y: 250, width: 880, height: 740, radius: 0 };
  return {
    id: 'simple-gift-corporate',
    name: 'Quà tặng doanh nghiệp',
    category: 'Quà tặng',
    description: 'Xanh đậm – vàng sang trọng, viền chỉ mảnh, chỗ ghi tên công ty – cho quà tri ân, quà đối tác.',
    width: W,
    height: H,
    background: navy,
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      back: `<rect width="${W}" height="${H}" fill="${navy}"/>`,
      front: `<rect x="80" y="230" width="920" height="780" fill="none" stroke="${gold}" stroke-width="2"/>` + line(490, 1196, 590, 1196, gold, 2),
    }),
    texts: [
      input('t1', 'Tên công ty', { text: 'TÊN CÔNG TY', x: 0, y: 86, width: W, fontSize: 26, fontFamily: 'Montserrat', fill: gold, align: 'center', letterSpacing: 10 }),
      fixed('t2', { text: 'Quà tặng doanh nghiệp', x: 0, y: 132, width: W, fontSize: 56, fontFamily: 'Playfair Display', fill: '#ffffff', align: 'center' }),
      input('t3', 'Bộ quà', { text: 'Bộ quà tri ân khách hàng', x: 60, y: 1052, width: 960, fontSize: 42, fill: '#ffffff', align: 'center' }),
      input('t4', 'Giá', { text: 'Từ 350.000đ / phần · Nhận in logo', x: 60, y: 1124, width: 960, fontSize: 30, fontStyle: 'normal', fill: gold, align: 'center' }),
      input('t5', 'Hotline', { text: 'Hotline: 0909 123 456', x: 0, y: 1226, width: W, fontSize: 32, fill: '#ffffff', align: 'center' }),
    ],
    sample: { from: '#e7e1d4', to: '#a99a7c', emoji: '🎁' },
  };
})();

// ============================== QUÀ TẾT ==============================

// 13. Đỏ tối giản -------------------------------------------------------------------------------------------------
const tetRed: Preset = (() => {
  const W = 1080, H = 1350;
  const gold = '#e8c27a';
  const slot = { x: 120, y: 120, width: 840, height: 860, radius: 16 };
  return {
    id: 'simple-tet-red',
    name: 'Quà Tết – Đỏ tối giản',
    category: 'Quà tặng',
    description: 'Nền đỏ trơn, viền chỉ vàng mảnh và lời chúc chữ có chân – Tết sang mà không rườm rà.',
    width: W,
    height: H,
    background: '#9e1b1b',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back: `<rect width="${W}" height="${H}" fill="#9e1b1b"/>`,
      front: `<path d="${roundRect(96, 96, 888, 908, 28)}" fill="none" stroke="${gold}" stroke-width="2"/>` + line(490, 1236, 590, 1236, gold, 2, 0.7),
    }),
    texts: [
      input('t1', 'Lời chúc', { text: 'Xuân An Khang', x: 60, y: 1036, width: 960, fontSize: 68, fontFamily: 'Playfair Display', fill: gold, align: 'center' }),
      input('t2', 'Tên sản phẩm', { text: 'Hộp quà Phúc Lộc', x: 60, y: 1128, width: 960, fontSize: 34, fill: '#fbe9d0', align: 'center' }),
      input('t3', 'Giá', { text: '1.290.000đ', x: 0, y: 1176, width: W, fontSize: 38, fontFamily: 'Montserrat', fill: gold, align: 'center' }),
      input('t4', 'Hotline', { text: 'Đặt quà: 0909 123 456', x: 0, y: 1266, width: W, fontSize: 26, fontStyle: 'normal', fill: '#f3cfc4', align: 'center' }),
    ],
    sample: { from: '#ffe2a8', to: '#d98b3a', emoji: '🧧' },
  };
})();

// 14. Kem & hoa mai -------------------------------------------------------------------------------------------------
const tetMai: Preset = (() => {
  const W = 1080, H = 1350;
  const red = '#b3261e';
  const slot = { x: 200, y: 160, width: 680, height: 800, radius: 0 };
  const branch = (d: string) => `<path d="${d}" fill="none" stroke="#6b4a3a" stroke-width="5" stroke-linecap="round"/>`;
  const blossoms =
    branch('M60 520C120 430 160 360 260 300M150 400C120 350 110 320 120 280') +
    mai(260, 300, 26) + mai(200, 360, 20) + mai(120, 280, 18) + mai(150, 430, 16) + mai(90, 470, 14) +
    branch('M1030 860C960 920 920 990 840 1030M940 950C980 990 990 1020 990 1060') +
    mai(840, 1030, 24) + mai(990, 1060, 18) + mai(900, 980, 16) + mai(1020, 880, 14);
  return {
    id: 'simple-tet-mai',
    name: 'Quà Tết – Hoa mai',
    category: 'Quà tặng',
    description: 'Nền kem, khung vòm và cành mai vàng – nhẹ nhàng, ấm áp cho giỏ quà, hộp quà Tết.',
    width: W,
    height: H,
    background: '#fbf6ee',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: arch(slot.x, slot.y, slot.width, slot.height),
      back: `<rect width="${W}" height="${H}" fill="#fbf6ee"/>`,
      front: `<path d="${arch(slot.x - 16, slot.y - 16, slot.width + 32, slot.height + 32)}" fill="none" stroke="${red}" stroke-width="2" opacity="0.6"/>` + blossoms,
    }),
    texts: [
      fixed('t1', { text: 'Chúc Mừng Năm Mới', x: 0, y: 42, width: W, fontSize: 56, fontFamily: 'Dancing Script', fill: red, align: 'center' }),
      input('t2', 'Nhãn', { text: 'QUÀ TẾT 2027', x: 0, y: 1000, width: W, fontSize: 22, fontFamily: 'Montserrat', fill: red, align: 'center', letterSpacing: 8 }),
      input('t3', 'Tên sản phẩm', { text: 'Giỏ quà Như Ý', x: 60, y: 1036, width: 960, fontSize: 62, fontFamily: 'Playfair Display', fill: '#8b1e1e', align: 'center' }),
      input('t4', 'Mô tả', { text: 'Hạt điều · Mứt sen · Trà Shan tuyết', x: 60, y: 1126, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#7a5c4a', align: 'center' }),
      input('t5', 'Giá', { text: '890.000đ', x: 0, y: 1182, width: W, fontSize: 42, fontFamily: 'Montserrat', fill: red, align: 'center' }),
      input('t6', 'Hotline', { text: 'Đặt quà: 0909 123 456', x: 0, y: 1272, width: W, fontSize: 26, fontStyle: 'normal', fill: '#7a5c4a', align: 'center' }),
    ],
    sample: { from: '#ffe9b0', to: '#e0a43a', emoji: '🧺' },
  };
})();

// 15. Xanh lục bảo (vuông) ------------------------------------------------------------------------------------------
const tetEmerald: Preset = (() => {
  const W = 1080, H = 1080;
  const cx = 540, cy = 430, r = 310;
  const gold = '#d9b46a', soft = '#b9c9bf';
  return {
    id: 'simple-tet-emerald',
    name: 'Quà Tết – Xanh lục bảo',
    category: 'Quà tặng',
    description: 'Khổ vuông: ảnh tròn viền vàng trên nền xanh lục bảo – quà Tết hiện đại, khác biệt.',
    width: W,
    height: H,
    background: '#0f3d2e',
    photoSlot: { x: cx - r, y: cy - r, width: r * 2, height: r * 2, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: circle(cx, cy, r),
      back: `<rect width="${W}" height="${H}" fill="#0f3d2e"/>`,
      front: `<circle cx="${cx}" cy="${cy}" r="${r + 16}" fill="none" stroke="${gold}" stroke-width="3"/>`,
    }),
    texts: [
      fixed('t1', { text: 'XUÂN SUNG TÚC', x: 0, y: 44, width: W, fontSize: 22, fontFamily: 'Montserrat', fill: gold, align: 'center', letterSpacing: 10 }),
      input('t2', 'Tên sản phẩm', { text: 'Giỏ quà Tết Sum Vầy', x: 60, y: 786, width: 960, fontSize: 54, fontFamily: 'Playfair Display', fill: '#f5e6c4', align: 'center' }),
      input('t3', 'Mô tả', { text: '8 món đặc sản · Kèm thiệp chúc Tết', x: 60, y: 864, width: 960, fontSize: 26, fontStyle: 'normal', fill: soft, align: 'center' }),
      input('t4', 'Giá', { text: '1.590.000đ', x: 0, y: 912, width: W, fontSize: 42, fontFamily: 'Montserrat', fill: gold, align: 'center' }),
      input('t5', 'Hotline', { text: 'Đặt quà: 0909 123 456', x: 0, y: 1004, width: W, fontSize: 24, fontStyle: 'normal', fill: soft, align: 'center' }),
    ],
    sample: { from: '#fce9b8', to: '#c98b2e', emoji: '🧺' },
  };
})();

// 16. Dải đỏ & con dấu ---------------------------------------------------------------------------------------------------
const tetBand: Preset = (() => {
  const W = 1080, H = 1350;
  const red = '#b71c1c', gold = '#f2c14e';
  return {
    id: 'simple-tet-band',
    name: 'Quà Tết – Dải đỏ',
    category: 'Quà tặng',
    description: 'Ảnh lớn phía trên, dải đỏ liệt kê món trong hộp quà và con dấu chữ "Tết" nhỏ ở góc.',
    width: W,
    height: H,
    background: red,
    photoSlot: { x: 0, y: 0, width: W, height: 860, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(0, 0, W, 860),
      back: `<rect width="${W}" height="${H}" fill="${red}"/>` + line(60, 1196, 1020, 1196, '#ffffff', 2, 0.25),
      front: `<rect x="900" y="800" width="120" height="120" rx="8" fill="#c62828" stroke="${gold}" stroke-width="4"/>`,
    }),
    texts: [
      fixed('t1', { text: 'TẾT', x: 900, y: 836, width: 120, fontSize: 46, fontFamily: 'Playfair Display', fill: gold, align: 'center' }),
      input('t2', 'Tên sản phẩm', { text: 'Hộp quà Đoàn Viên', x: 60, y: 900, width: 820, fontSize: 58, fontFamily: 'Playfair Display', fill: '#ffffff' }),
      input('t3', 'Thành phần', { text: 'Rượu vang · Bánh quy bơ · Trà ô long · Hạt dinh dưỡng', x: 60, y: 990, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#f8d7d3' }),
      input('t4', 'Giá', { text: '990.000đ', x: 60, y: 1084, width: 600, fontSize: 60, fontFamily: 'Montserrat', fill: gold }),
      input('t5', 'Hotline', { text: '0909 123 456', x: 60, y: 1236, width: 500, fontSize: 32, fill: '#ffffff' }),
      input('t6', 'Tên shop', { text: '@tenshop', x: 560, y: 1240, width: 460, fontSize: 26, fontStyle: 'normal', fill: '#f8d7d3', align: 'right' }),
    ],
    sample: { from: '#ffd59e', to: '#c96a2b', emoji: '🎁' },
  };
})();

// ============================== MỸ PHẨM ==============================

// 17. Hồng nude – Viên nang -------------------------------------------------------------------------------------------------
const beautyNude: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 200, y: 120, width: 680, height: 880, radius: 340 };
  return {
    id: 'simple-beauty-nude',
    name: 'Mỹ phẩm – Hồng nude',
    category: 'Làm đẹp',
    description: 'Ảnh hình viên nang trên nền hồng nude, chữ thanh mảnh – đúng chất skincare hiện đại.',
    width: W,
    height: H,
    background: '#f3e5df',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back: `<rect width="${W}" height="${H}" fill="#f3e5df"/>`,
    }),
    texts: [
      input('t1', 'Nhãn', { text: 'SKINCARE', x: 0, y: 52, width: W, fontSize: 20, fontFamily: 'Montserrat', fill: '#a1746a', align: 'center', letterSpacing: 12 }),
      input('t2', 'Tên sản phẩm', { text: 'Kem dưỡng Rosé', x: 60, y: 1040, width: 960, fontSize: 60, fontFamily: 'Playfair Display', fill: '#4a2f2a', align: 'center' }),
      input('t3', 'Công dụng', { text: 'Phục hồi · Cấp ẩm 72h · 50ml', x: 60, y: 1128, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#8c6a62', align: 'center' }),
      input('t4', 'Giá', { text: '520.000đ', x: 0, y: 1186, width: W, fontSize: 38, fontFamily: 'Montserrat', fill: '#4a2f2a', align: 'center' }),
      input('t5', 'Tên shop', { text: '@tenshop', x: 0, y: 1278, width: W, fontSize: 24, fontStyle: 'normal', fill: '#a1746a', align: 'center' }),
    ],
    sample: { from: '#fbe7e1', to: '#e2b3a6', emoji: '🧴' },
  };
})();

// 18. Thành phần nổi bật -------------------------------------------------------------------------------------------------------
const beautyIngredients: Preset = (() => {
  const W = 1080, H = 1350;
  const slot = { x: 60, y: 60, width: 960, height: 820, radius: 32 };
  const chip = (x: number) => `<path d="${roundRect(x, 1052, 300, 72, 36)}" fill="#f9fafb" stroke="#e5e7eb" stroke-width="2"/>`;
  return {
    id: 'simple-beauty-ingredients',
    name: 'Mỹ phẩm – Thành phần',
    category: 'Làm đẹp',
    description: 'Ảnh sản phẩm và 3 ô thành phần nổi bật – rõ ràng, đáng tin cho serum, kem dưỡng.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: roundRect(slot.x, slot.y, slot.width, slot.height, slot.radius),
      back: `<rect width="${W}" height="${H}" fill="#ffffff"/>` + chip(60) + chip(390) + chip(720) + line(60, 1220, 1020, 1220, '#f0f0f0'),
    }),
    texts: [
      input('t1', 'Tên sản phẩm', { text: 'Serum Vitamin C 15%', x: 60, y: 916, width: 620, fontSize: 48, fill: '#1f2937' }),
      input('t2', 'Giá', { text: '390.000đ', x: 640, y: 920, width: 380, fontSize: 44, fill: '#e76f51', align: 'right' }),
      fixed('t3', { text: 'THÀNH PHẦN NỔI BẬT', x: 60, y: 1004, width: 600, fontSize: 20, fontFamily: 'Montserrat', fill: '#9ca3af', letterSpacing: 6 }),
      input('t4', 'Thành phần 1', { text: 'Vitamin C', x: 60, y: 1074, width: 300, fontSize: 28, fill: '#374151', align: 'center' }),
      input('t5', 'Thành phần 2', { text: 'Niacinamide', x: 390, y: 1074, width: 300, fontSize: 28, fill: '#374151', align: 'center' }),
      input('t6', 'Thành phần 3', { text: 'Hyaluronic', x: 720, y: 1074, width: 300, fontSize: 28, fill: '#374151', align: 'center' }),
      input('t7', 'Liên hệ', { text: '@tenshop · 0909 123 456', x: 60, y: 1256, width: 960, fontSize: 26, fontStyle: 'normal', fill: '#9ca3af' }),
    ],
    sample: { from: '#fff4d6', to: '#f6c177', emoji: '🍊' },
  };
})();

// 19. Vòng tròn lavender -----------------------------------------------------------------------------------------------------------
const beautyCircle: Preset = (() => {
  const W = 1080, H = 1350;
  const cx = 540, cy = 540, r = 330;
  const purple = '#6d5a8c';
  return {
    id: 'simple-beauty-circle',
    name: 'Mỹ phẩm – Vòng tròn',
    category: 'Làm đẹp',
    description: 'Nền trắng, ảnh tròn đặt trên quầng tím lavender nhạt, tên thương hiệu giãn chữ – sạch và sang.',
    width: W,
    height: H,
    background: '#ffffff',
    photoSlot: { x: cx - r, y: cy - r, width: r * 2, height: r * 2, radius: 0 },
    svg: frameSvg({
      width: W,
      height: H,
      hole: circle(cx, cy, r),
      back: `<rect width="${W}" height="${H}" fill="#ffffff"/><circle cx="${cx}" cy="${cy}" r="${r + 80}" fill="#f3eefc"/>`,
    }),
    texts: [
      input('t1', 'Thương hiệu', { text: 'LUMIÈRE', x: 0, y: 56, width: W, fontSize: 30, fontFamily: 'Montserrat', fill: purple, align: 'center', letterSpacing: 16 }),
      input('t2', 'Tên sản phẩm', { text: 'Son dưỡng có màu', x: 60, y: 1010, width: 960, fontSize: 52, fill: '#2e2640', align: 'center' }),
      input('t3', 'Mô tả', { text: 'Hồng đào · Lì nhẹ · Không chì', x: 60, y: 1084, width: 960, fontSize: 28, fontStyle: 'normal', fill: '#7d7590', align: 'center' }),
      input('t4', 'Giá', { text: '280.000đ', x: 0, y: 1144, width: W, fontSize: 40, fontFamily: 'Montserrat', fill: purple, align: 'center' }),
      input('t5', 'Tên shop', { text: '@tenshop', x: 0, y: 1272, width: W, fontSize: 24, fontStyle: 'normal', fill: '#a49cb5', align: 'center' }),
    ],
    sample: { from: '#f6e6f5', to: '#cdb4e0', emoji: '💄' },
  };
})();

// 20. Đen sang (vuông) ---------------------------------------------------------------------------------------------------------------
const beautyBlack: Preset = (() => {
  const W = 1080, H = 1080;
  const slot = { x: 140, y: 100, width: 800, height: 700, radius: 0 };
  const gold = '#c8a96a';
  return {
    id: 'simple-beauty-black',
    name: 'Mỹ phẩm – Đen sang',
    category: 'Làm đẹp',
    description: 'Khổ vuông nền đen, viền chỉ trắng và chữ vàng nhạt – hợp nước hoa, mỹ phẩm cao cấp.',
    width: W,
    height: H,
    background: '#0d0d0d',
    photoSlot: slot,
    svg: frameSvg({
      width: W,
      height: H,
      hole: rect(slot.x, slot.y, slot.width, slot.height),
      back: `<rect width="${W}" height="${H}" fill="#0d0d0d"/>`,
      front: `<rect x="124" y="84" width="832" height="732" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>`,
    }),
    texts: [
      input('t1', 'Nhãn', { text: 'LUXURY COLLECTION', x: 0, y: 852, width: W, fontSize: 20, fontFamily: 'Montserrat', fill: gold, align: 'center', letterSpacing: 10 }),
      input('t2', 'Tên sản phẩm', { text: 'Nước hoa Noir', x: 60, y: 888, width: 960, fontSize: 56, fontFamily: 'Playfair Display', fill: '#ffffff', align: 'center' }),
      input('t3', 'Giá', { text: '2.150.000đ', x: 0, y: 970, width: W, fontSize: 34, fontFamily: 'Montserrat', fill: gold, align: 'center' }),
      input('t4', 'Tên shop', { text: '@tenshop', x: 0, y: 1028, width: W, fontSize: 22, fontStyle: 'normal', fill: '#8a8a8a', align: 'center' }),
    ],
    sample: { from: '#e9e2d6', to: '#7d6a50', emoji: '🌹' },
  };
})();

export const SIMPLE_PRESETS: Preset[] = [
  estateWhite,
  estateMargin,
  estateNavy,
  estateRent,
  interiorArch,
  interiorNumbered,
  interiorDims,
  interiorSage,
  giftRibbon,
  giftCard,
  giftSticker,
  giftCorporate,
  tetRed,
  tetMai,
  tetEmerald,
  tetBand,
  beautyNude,
  beautyIngredients,
  beautyCircle,
  beautyBlack,
];
