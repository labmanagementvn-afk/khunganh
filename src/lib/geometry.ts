import type Konva from 'konva';
import type { PhotoSlot } from '../types';

/** Vẽ đường bo góc cho clip vùng ảnh (tương thích mọi trình duyệt) */
export function slotClip(ctx: Konva.Context, s: PhotoSlot) {
  const r = Math.max(0, Math.min(s.radius, s.width / 2, s.height / 2));
  ctx.beginPath();
  ctx.moveTo(s.x + r, s.y);
  ctx.lineTo(s.x + s.width - r, s.y);
  ctx.arcTo(s.x + s.width, s.y, s.x + s.width, s.y + r, r);
  ctx.lineTo(s.x + s.width, s.y + s.height - r);
  ctx.arcTo(s.x + s.width, s.y + s.height, s.x + s.width - r, s.y + s.height, r);
  ctx.lineTo(s.x + r, s.y + s.height);
  ctx.arcTo(s.x, s.y + s.height, s.x, s.y + s.height - r, r);
  ctx.lineTo(s.x, s.y + r);
  ctx.arcTo(s.x, s.y, s.x + r, s.y, r);
  ctx.closePath();
}
