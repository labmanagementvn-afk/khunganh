// Danh sách ngành dùng để phân loại & tìm kiếm khung mẫu trên Bảng tin.
export const INDUSTRIES = [
  'Sản phẩm',
  'Thời trang',
  'Làm đẹp',
  'Ẩm thực',
  'Bất động sản',
  'Công nghệ',
  'Nội thất',
  'Mẹ & bé',
  'Sức khoẻ',
  'Du lịch',
  'Giáo dục',
  'Sự kiện',
  'Quà tặng',
  'Khác',
] as const;

/** Chuẩn hoá để tìm kiếm không phân biệt dấu, hoa thường: "Phở Bò" → "pho bo" */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
