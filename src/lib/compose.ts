import Konva from 'konva';
import { textConfig } from '../components/TextNode';
import type { Template, TextElement } from '../types';
import { slotClip } from './geometry';
import { isIdentity, renderAdjusted, type PhotoAdjust } from './photoFilters';

/**
 * Tỉ lệ để ảnh (đã xoay `rotation` độ) lấp đầy (cover) hoặc nằm gọn (contain) trong vùng w×h.
 * cover: vùng w×h xoay ngược phải nằm lọt trong ảnh; contain: khung bao của ảnh đã xoay nằm lọt trong vùng.
 */
export function fitScale(img: HTMLImageElement, rotation: number, w: number, h: number, mode: 'cover' | 'contain') {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  if (mode === 'cover') return Math.max((w * cos + h * sin) / iw, (w * sin + h * cos) / ih);
  return Math.min(w / (iw * cos + ih * sin), h / (iw * sin + ih * cos));
}

/** Đưa góc về khoảng (-180, 180] */
export function normalizeAngle(deg: number) {
  const a = ((((deg + 180) % 360) + 360) % 360) - 180;
  return a === -180 ? 180 : a;
}

export const labelOf = (t: TextElement) => (t.label || 'Text nhập').trim();

/** Giá trị ban đầu của các ô nhập = giá trị mặc định đặt trong khung mẫu */
export function defaultValues(texts: TextElement[]): Record<string, string> {
  const v: Record<string, string> = {};
  texts.filter((x) => x.kind === 'input').forEach((x) => (v[labelOf(x)] ??= x.text));
  return v;
}

// ---------------------------------------------------------------------------
// Vẽ ảnh kết quả không cần giao diện (dùng cho tạo ảnh hàng loạt)
// ---------------------------------------------------------------------------

export interface CompositeInput {
  tpl: Template;
  frameImg: HTMLImageElement | null;
  photo: HTMLImageElement;
  fit: 'cover' | 'contain';
  rotation?: number;
  adjust: PhotoAdjust;
  values: Record<string, string>;
  /** Cạnh dài tối đa của ảnh kết quả (bỏ trống = đúng kích thước khung) */
  maxSide?: number;
}

/** Đợi các phông chữ mà khung dùng tải xong (canvas không tự vẽ lại khi phông tải muộn) */
export async function ensureFonts(texts: TextElement[]) {
  if (!('fonts' in document)) return;
  await Promise.all(
    texts.map((t) =>
      document.fonts.load(`${t.fontStyle === 'normal' ? '' : t.fontStyle} ${t.fontSize}px "${t.fontFamily}"`, t.text || 'Aă').catch(() => []),
    ),
  );
}

export function renderComposite(o: CompositeInput): HTMLCanvasElement {
  const { tpl, photo } = o;
  const s = o.maxSide ? Math.min(1, o.maxSide / Math.max(tpl.width, tpl.height)) : 1;
  const stage = new Konva.Stage({
    container: document.createElement('div'),
    width: Math.round(tpl.width * s),
    height: Math.round(tpl.height * s),
    scaleX: s,
    scaleY: s,
  });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);
  layer.add(new Konva.Rect({ width: tpl.width, height: tpl.height, fill: tpl.background }));

  const slot = tpl.photoSlot;
  const rotation = o.rotation ?? 0;
  const scale = fitScale(photo, rotation, slot.width, slot.height, o.fit);
  const natMax = Math.max(photo.naturalWidth, photo.naturalHeight);
  const image = isIdentity(o.adjust) ? photo : renderAdjusted(photo, o.adjust, Math.ceil(natMax * scale * s * 1.05));
  const group = new Konva.Group({ clipFunc: (ctx) => slotClip(ctx, slot) });
  group.add(
    new Konva.Image({
      image,
      x: slot.x + slot.width / 2,
      y: slot.y + slot.height / 2,
      width: photo.naturalWidth,
      height: photo.naturalHeight,
      offsetX: photo.naturalWidth / 2,
      offsetY: photo.naturalHeight / 2,
      scaleX: scale,
      scaleY: scale,
      rotation,
    }),
  );
  const frame =
    o.frameImg && tpl.frame ? new Konva.Image({ image: o.frameImg, x: tpl.frame.x, y: tpl.frame.y, width: tpl.frame.width, height: tpl.frame.height }) : null;
  if (tpl.photoOnTop) {
    if (frame) layer.add(frame);
    layer.add(group);
  } else {
    layer.add(group);
    if (frame) layer.add(frame);
  }
  for (const t of tpl.texts) {
    const value = t.kind === 'input' ? o.values[labelOf(t)] ?? '' : t.text;
    if (value) layer.add(new Konva.Text(textConfig(t, value)));
  }
  layer.draw();
  const canvas = stage.toCanvas({ pixelRatio: 1 });
  stage.destroy();
  return canvas;
}
