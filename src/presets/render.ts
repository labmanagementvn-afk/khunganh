import Konva from 'konva';
import { textConfig } from '../components/TextNode';
import type { Backend } from '../lib/backend';
import { newId } from '../lib/id';
import { canvasToBlob, loadImage } from '../lib/image';
import type { Template } from '../types';
import type { Preset } from './presets';

/** Ảnh SVG của khung → HTMLImageElement */
export async function presetFrameImage(preset: Preset): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([preset.svg], { type: 'image/svg+xml' }));
  try {
    return await loadImage(url);
  } finally {
    // Ảnh đã giải mã xong, có thể thu hồi URL
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Vẽ khung SVG thành PNG đúng kích thước ảnh xuất (để lưu như ảnh khung tải lên) */
async function presetFramePng(preset: Preset): Promise<Blob> {
  const img = await presetFrameImage(preset);
  const canvas = document.createElement('canvas');
  canvas.width = preset.width;
  canvas.height = preset.height;
  canvas.getContext('2d')!.drawImage(img, 0, 0, preset.width, preset.height);
  return canvasToBlob(canvas, 'image/png');
}

/** Ảnh minh hoạ thay cho ảnh sản phẩm trong ảnh xem trước */
function samplePhoto(preset: Preset): HTMLCanvasElement {
  const { width: w, height: h } = preset.photoSlot;
  const c = document.createElement('canvas');
  c.width = Math.round(w);
  c.height = Math.round(h);
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, preset.sample.from);
  g.addColorStop(1, preset.sample.to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.52, Math.min(w, h) * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `${Math.round(Math.min(w, h) * 0.38)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(preset.sample.emoji, w * 0.5, h * 0.54);
  return c;
}

async function loadFonts(preset: Preset) {
  if (!('fonts' in document)) return;
  await Promise.all(
    preset.texts.map((t) =>
      document.fonts.load(`${t.fontStyle === 'normal' ? '' : t.fontStyle} ${t.fontSize}px "${t.fontFamily}"`, t.text).catch(() => []),
    ),
  );
}

/** Ảnh xem trước của mẫu (khung + ảnh minh hoạ + chữ mẫu), dạng data URL JPEG */
export async function renderPresetPreview(preset: Preset, maxSide = 480): Promise<string> {
  const [frame] = await Promise.all([presetFrameImage(preset), loadFonts(preset)]);
  const s = maxSide / Math.max(preset.width, preset.height);
  const container = document.createElement('div');
  const stage = new Konva.Stage({ container, width: preset.width * s, height: preset.height * s, scaleX: s, scaleY: s });
  const layer = new Konva.Layer({ listening: false });
  stage.add(layer);
  layer.add(new Konva.Rect({ width: preset.width, height: preset.height, fill: preset.background }));
  const slot = preset.photoSlot;
  layer.add(new Konva.Image({ image: samplePhoto(preset), x: slot.x, y: slot.y, width: slot.width, height: slot.height }));
  layer.add(new Konva.Image({ image: frame, x: 0, y: 0, width: preset.width, height: preset.height }));
  for (const t of preset.texts) layer.add(new Konva.Text(textConfig(t, t.text)));
  layer.draw();
  const url = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.86 });
  stage.destroy();
  return url;
}

const previewCache = new Map<string, Promise<string>>();
export function presetPreview(preset: Preset): Promise<string> {
  let p = previewCache.get(preset.id);
  if (!p) {
    p = renderPresetPreview(preset);
    previewCache.set(preset.id, p);
    p.catch(() => previewCache.delete(preset.id));
  }
  return p;
}

/** Tạo khung mẫu riêng của người dùng, sao chép từ mẫu có sẵn */
export async function createTemplateFromPreset(backend: Backend, uid: string, preset: Preset): Promise<Template> {
  const [png, thumbnail] = await Promise.all([presetFramePng(preset), renderPresetPreview(preset, 360)]);
  const blobId = await backend.putBlob(uid, png);
  const now = Date.now();
  const tpl: Template = {
    id: newId(),
    name: preset.name,
    width: preset.width,
    height: preset.height,
    background: preset.background,
    frame: { blobId, x: 0, y: 0, width: preset.width, height: preset.height },
    photoSlot: { ...preset.photoSlot },
    photoOnTop: false,
    texts: preset.texts.map((t) => ({ ...t })),
    thumbnail,
    createdAt: now,
    updatedAt: now,
  };
  await backend.saveTemplate(uid, tpl);
  return tpl;
}
