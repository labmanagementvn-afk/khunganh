// Ảnh xem trước của các mẫu có sẵn được tạo trước (scripts/gen-preset-thumbs.mjs) và phục vụ như file tĩnh
// trong public/preset-thumbs – trang chủ chỉ cần tải ảnh, không phải vẽ 80+ khung trên điện thoại.
// Tên file gồm mã băm nội dung mẫu: sửa mẫu mà chưa tạo lại ảnh thì file mới chưa có → app tự vẽ ảnh đó.
import type { Preset } from './presets';

/** Tăng số này khi đổi cách vẽ ảnh xem trước (render.ts) để mọi ảnh được tạo lại */
const RENDER_VERSION = 1;

function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Tên file ảnh xem trước (không có đuôi) – đổi khi hình thức mẫu thay đổi */
export function presetThumbKey(p: Preset): string {
  return `${p.id}-${fnv1a(JSON.stringify([RENDER_VERSION, p.width, p.height, p.background, p.photoSlot, p.svg, p.texts, p.sample]))}`;
}

export const presetThumbUrl = (p: Preset) => `${import.meta.env.BASE_URL}preset-thumbs/${presetThumbKey(p)}.jpg`;
