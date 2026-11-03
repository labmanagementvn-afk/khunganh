// Ghép khung / chữ / ảnh chèn vào video và xuất file video – chạy hoàn toàn trên trình duyệt.
// Lớp tĩnh (nền, khung, chữ của khung) và từng lớp chèn chỉ vẽ một lần; mỗi khung hình chỉ vẽ lại video
// và dán các lớp chèn đang trong khoảng thời gian hiển thị của chúng.
import fixWebmDuration from 'fix-webm-duration';
import Konva from 'konva';
import { textConfig } from '../components/TextNode';
import type { PhotoSlot, Template, TextElement } from '../types';
import { slotClip } from './geometry';
import { labelOf } from './compose';

/** Khoảng thời gian hiển thị (giây, theo thời gian của video gốc) */
interface Timed {
  id: string;
  start: number;
  end: number;
}

/** Lớp chèn lên video: ảnh / logo hoặc chữ – có thời gian hiện riêng, sắp xếp trên timeline */
export type Overlay =
  | (Timed & { kind: 'image'; img: HTMLImageElement; x: number; y: number; width: number; height: number; rotation: number })
  | (Timed & { kind: 'text'; text: TextElement });

/** Node Konva vẽ một lớp chèn (dùng chung cho xem trước và xuất video) */
export function overlayNode(o: Overlay): Konva.Shape | null {
  if (o.kind === 'image') return new Konva.Image({ image: o.img, x: o.x, y: o.y, width: o.width, height: o.height, rotation: o.rotation });
  return o.text.text ? new Konva.Text(textConfig(o.text, o.text.text)) : null;
}

/** Vị trí video trong vùng ảnh (toạ độ canvas) */
export interface VideoPlacement {
  cx: number;
  cy: number;
  scale: number;
  rotation: number;
}

export interface VideoScene {
  width: number;
  height: number;
  background: string;
  slot: PhotoSlot;
  template: Template | null;
  frameImg: HTMLImageElement | null;
  values: Record<string, string>;
  /** Thứ tự trong mảng = thứ tự lớp (sau đè lên trước) */
  overlays: Overlay[];
}

/**
 * Định dạng ghi video tốt nhất trình duyệt hỗ trợ: MP4/H.264 (phát được ở mọi nơi, iPhone lưu thẳng vào Ảnh)
 * → WebM/VP8 (mã hoá nhẹ) → WebM → MP4 chung (Safari chỉ trả lời cho loại này).
 */
export function pickRecorderMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const list = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4',
  ];
  return list.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export const canExportVideo = () =>
  pickRecorderMime() !== null && typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype;

/**
 * Kích thước video xuất: cạnh ngắn bằng `shortSide` (phóng to cả khung nhỏ – chữ và hình vẽ lại ở độ phân giải mới nên
 * vẫn nét), kích thước chẵn để bộ mã hoá H.264 không từ chối.
 */
export function outputSize(width: number, height: number, shortSide: number) {
  const s = shortSide / Math.min(width, height);
  return { W: Math.round((width * s) / 2) * 2, H: Math.round((height * s) / 2) * 2 };
}

/**
 * Bitrate theo số điểm ảnh (~0,3 bit/điểm ảnh/khung hình ở 30 fps): 1080×1080 ≈ 10 Mbps, 1080×1920 ≈ 19 Mbps.
 * Tối đa 20 Mbps: cao hơn nữa thì mắt khó thấy khác biệt nhưng file nặng, tốn bộ nhớ và dễ làm bộ mã hoá điện thoại bị treo.
 */
export const videoBitrate = (W: number, H: number) => Math.round(Math.min(20_000_000, Math.max(6_000_000, W * H * 30 * 0.3)));

/** Vẽ lớp nằm dưới video (nền, khung nếu video đè lên khung), lớp trên (khung, chữ của khung) và từng lớp chèn */
export function renderLayers(scene: VideoScene, scale: number) {
  const make = (draw: (layer: Konva.Layer) => void) => {
    const stage = new Konva.Stage({
      container: document.createElement('div'),
      width: Math.round(scene.width * scale),
      height: Math.round(scene.height * scale),
      scaleX: scale,
      scaleY: scale,
    });
    const layer = new Konva.Layer({ listening: false });
    stage.add(layer);
    draw(layer);
    layer.draw();
    const canvas = stage.toCanvas({ pixelRatio: 1 });
    stage.destroy();
    return canvas;
  };
  const tpl = scene.template;
  const frameNode = () =>
    scene.frameImg && tpl?.frame
      ? new Konva.Image({ image: scene.frameImg, x: tpl.frame.x, y: tpl.frame.y, width: tpl.frame.width, height: tpl.frame.height })
      : null;
  const under = make((layer) => {
    layer.add(new Konva.Rect({ width: scene.width, height: scene.height, fill: scene.background }));
    const f = tpl?.photoOnTop ? frameNode() : null;
    if (f) layer.add(f);
  });
  const over = make((layer) => {
    const f = tpl && !tpl.photoOnTop ? frameNode() : null;
    if (f) layer.add(f);
    for (const t of tpl?.texts ?? []) {
      const v = t.kind === 'input' ? scene.values[labelOf(t)] ?? '' : t.text;
      if (v) layer.add(new Konva.Text(textConfig(t, v)));
    }
  });
  // Mỗi lớp chèn: vẽ riêng rồi cắt sát theo khung bao để tiết kiệm bộ nhớ
  const overlays = scene.overlays.flatMap((o) => {
    const full = make((layer) => {
      const n = overlayNode(o);
      if (n) layer.add(n);
    });
    const ctx = full.getContext('2d')!;
    const data = ctx.getImageData(0, 0, full.width, full.height).data;
    let minX = full.width, minY = full.height, maxX = -1, maxY = -1;
    for (let y = 0; y < full.height; y++) {
      for (let x = 0; x < full.width; x++) {
        if (data[(y * full.width + x) * 4 + 3]) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return [];
    const crop = document.createElement('canvas');
    crop.width = maxX - minX + 1;
    crop.height = maxY - minY + 1;
    crop.getContext('2d')!.drawImage(full, -minX, -minY);
    return [{ canvas: crop, x: minX, y: minY, start: o.start, end: o.end }];
  });
  return { under, over, overlays };
}

export interface RecordOptions {
  scene: VideoScene;
  video: HTMLVideoElement;
  placement: VideoPlacement;
  start: number;
  end: number;
  /** Độ phân giải theo cạnh ngắn (1440 = 2K, 1080 = 1080p, 720 = 720p) */
  shortSide: number;
  withAudio: boolean;
  /** Nguồn âm thanh của thẻ video (chỉ tạo được 1 lần cho mỗi thẻ video) */
  audioSource: () => { ctx: AudioContext; node: MediaElementAudioSourceNode } | null;
  onProgress: (fraction: number) => void;
  signal: { cancelled: boolean };
}

/** Phát đoạn video đã chọn và ghi lại khung hình đã ghép. Mất thời gian bằng độ dài đoạn video. */
export async function recordComposite(o: RecordOptions): Promise<Blob> {
  const mime = pickRecorderMime();
  if (!mime) throw new Error('Trình duyệt này không hỗ trợ xuất video. Hãy thử Chrome hoặc Safari mới.');
  const { scene, video, placement: pl } = o;
  // Ghi theo thời gian thực nặng hơn nhiều → tối đa 1080p
  const { W, H } = outputSize(scene.width, scene.height, Math.min(1080, o.shortSide));
  const { under, over, overlays } = renderLayers(scene, W / scene.width);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  canvas.style.cssText = 'position:fixed;left:-99999px;top:0;opacity:0;pointer-events:none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  const k = W / scene.width;

  const draw = () => {
    ctx.drawImage(under, 0, 0, W, H);
    ctx.save();
    ctx.scale(k, k);
    slotClip(ctx as unknown as Konva.Context, scene.slot);
    ctx.clip();
    ctx.translate(pl.cx, pl.cy);
    ctx.rotate((pl.rotation * Math.PI) / 180);
    ctx.scale(pl.scale, pl.scale);
    ctx.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2, video.videoWidth, video.videoHeight);
    ctx.restore();
    ctx.drawImage(over, 0, 0, W, H);
    const t = video.currentTime;
    for (const ov of overlays) if (t >= ov.start && t < ov.end) ctx.drawImage(ov.canvas, ov.x, ov.y);
  };

  const stream = canvas.captureStream(30);
  let audio: { ctx: AudioContext; node: MediaElementAudioSourceNode } | null = null;
  let dest: MediaStreamAudioDestinationNode | null = null;
  if (o.withAudio) {
    audio = o.audioSource();
    if (audio) {
      dest = audio.ctx.createMediaStreamDestination();
      audio.node.connect(dest);
      await audio.ctx.resume().catch(() => {});
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }
  }
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: videoBitrate(W, H) });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

  video.loop = false;
  video.muted = !o.withAudio || !audio;
  video.currentTime = o.start;
  await new Promise<void>((resolve) => {
    if (Math.abs(video.currentTime - o.start) < 0.05 && video.readyState >= 2) resolve();
    else video.addEventListener('seeked', () => resolve(), { once: true });
  });
  draw();
  recorder.start(250);
  const startedAt = performance.now();
  await video.play();

  // Vẽ theo nhịp màn hình: captureStream(30) tự lấy mẫu 30 khung hình/giây từ canvas
  await new Promise<void>((resolve) => {
    const tick = () => {
      if (o.signal.cancelled || video.ended || video.currentTime >= o.end) {
        resolve();
        return;
      }
      draw();
      o.onProgress(Math.min(1, (video.currentTime - o.start) / Math.max(0.01, o.end - o.start)));
      requestAnimationFrame(tick);
    };
    tick();
    // Dự phòng: một số trình duyệt ngừng gọi lại khung hình khi video kết thúc
    video.addEventListener('ended', () => resolve(), { once: true });
  });
  video.pause();
  draw();
  recorder.stop();
  await done;
  if (audio && dest) audio.node.disconnect(dest);
  stream.getTracks().forEach((t) => t.stop());
  canvas.remove();
  if (o.signal.cancelled) throw new Error('Đã huỷ xuất video');
  const blob = new Blob(chunks, { type: mime.split(';')[0] });
  // WebM do Chrome ghi không có thời lượng → một số trình phát không tua được; ghi bổ sung thời lượng
  return blob.type === 'video/webm' ? fixWebmDuration(blob, performance.now() - startedAt, { logger: false }) : blob;
}
