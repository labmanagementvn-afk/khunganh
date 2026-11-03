// Xuất video "offline" bằng WebCodecs (thư viện Mediabunny): giải mã từng khung hình từ file gốc, ghép khung / chữ /
// ảnh chèn rồi mã hoá H.264 vào MP4. Không phụ thuộc vào việc phát video hay nhịp vẽ màn hình nên vẫn chạy đúng khi
// người dùng chuyển sang tab khác; nếu trình duyệt tạm dừng trang (chuyển ứng dụng trên điện thoại) thì quá trình
// chỉ dừng lại và tự chạy tiếp khi quay lại – video xuất ra không bị giật, mất hình hay lệch tiếng.
import type Konva from 'konva';
import type { InputAudioTrack, InputVideoTrack } from 'mediabunny';
import { slotClip } from './geometry';
import { outputSize, renderLayers, videoBitrate, type VideoPlacement, type VideoScene } from './videoCompose';

const FPS = 30;

export interface EncodeOptions {
  scene: VideoScene;
  /** File video gốc (để giải mã từng khung hình) */
  file: Blob;
  /** Kích thước video như trình duyệt hiển thị (đã xoay theo metadata) – vị trí đặt video tính theo kích thước này */
  videoWidth: number;
  videoHeight: number;
  placement: VideoPlacement;
  start: number;
  end: number;
  /** Độ phân giải mong muốn theo cạnh ngắn; máy không mã hoá được thì tự hạ xuống 1080 / 720 */
  shortSide: number;
  withAudio: boolean;
  onProgress: (fraction: number) => void;
  signal: { cancelled: boolean };
}

/** Trình duyệt có WebCodecs (Chrome 94+, Safari 16.4+, Firefox 130+) */
export const canEncodeOffline = () => typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';

export class CancelledError extends Error {
  constructor() {
    super('Đã huỷ xuất video');
  }
}

/**
 * Xuất video ghép. Trả về `null` (chưa bắt đầu ghi gì) khi trình duyệt không giải mã / mã hoá được file này bằng
 * WebCodecs – khi đó nơi gọi chuyển sang cách ghi theo thời gian thực.
 */
export async function encodeComposite(o: EncodeOptions): Promise<Blob | null> {
  if (!canEncodeOffline()) return null;
  const mb = await import('mediabunny');
  const { scene, placement: pl, signal } = o;

  const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(o.file) });
  try {
    const vTrack: InputVideoTrack | null = await input.getPrimaryVideoTrack().catch(() => null);
    if (!vTrack || !(await vTrack.canDecode())) return null;

    // Độ phân giải cao nhất mà bộ mã hoá của máy nhận (2K có thể không được trên máy yếu → hạ dần)
    let size: { W: number; H: number; bitrate: number } | null = null;
    for (const side of [o.shortSide, 1080, 720].filter((x, i, a) => x <= o.shortSide && a.indexOf(x) === i)) {
      const { W, H } = outputSize(scene.width, scene.height, side);
      const bitrate = videoBitrate(W, H);
      if (await mb.canEncodeVideo('avc', { width: W, height: H, bitrate })) {
        size = { W, H, bitrate };
        break;
      }
    }
    if (!size) return null;
    const { W, H, bitrate } = size;
    const k = W / scene.width;

    // Âm thanh: AAC (phát được mọi nơi), không có thì Opus
    let aTrack: InputAudioTrack | null = null;
    let audioCodec: 'aac' | 'opus' | null = null;
    if (o.withAudio) {
      aTrack = await input.getPrimaryAudioTrack().catch(() => null);
      if (aTrack && (await aTrack.canDecode())) {
        const cfg = { numberOfChannels: Math.min(2, aTrack.numberOfChannels), sampleRate: aTrack.sampleRate, bitrate: 192_000 };
        if (await mb.canEncodeAudio('aac', cfg)) audioCodec = 'aac';
        else if (await mb.canEncodeAudio('opus', { ...cfg, sampleRate: 48000 })) audioCodec = 'opus';
        // Có tiếng nhưng không mã hoá được → để cách ghi thời gian thực giữ lại tiếng
        if (!audioCodec) return null;
      } else aTrack = null;
    }

    const { under, over, overlays } = renderLayers(scene, k);
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';

    // Giữ nguyên độ phân giải gốc; chỉ thu nhỏ khi video lớn hơn gấp đôi mức cần (vd. video 4K xuất 720p) cho đỡ tốn bộ nhớ
    const dw = vTrack.displayWidth;
    const dh = vTrack.displayHeight;
    const need = Math.min(1, (2 * pl.scale * k * Math.max(o.videoWidth, o.videoHeight)) / Math.max(dw, dh));
    const sink = new mb.CanvasSink(vTrack, {
      ...(need < 0.95 ? { width: Math.max(2, Math.round(dw * need)), height: Math.max(2, Math.round(dh * need)), fit: 'fill' as const } : {}),
      poolSize: 2,
    });

    const output = new mb.Output({ format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }), target: new mb.BufferTarget() });
    const videoSource = new mb.CanvasSource(canvas, { codec: 'avc', bitrate, keyFrameInterval: 2 });
    output.addVideoTrack(videoSource, { frameRate: FPS });
    const audioSource = audioCodec
      ? new mb.AudioBufferSource({ codec: audioCodec, bitrate: 192_000, ...(audioCodec === 'opus' ? { transform: { sampleRate: 48000 } } : {}) })
      : null;
    if (audioSource) output.addAudioTrack(audioSource);
    await output.start();

    const draw = (frame: CanvasImageSource | null, t: number) => {
      ctx.drawImage(under, 0, 0, W, H);
      if (frame) {
        ctx.save();
        ctx.scale(k, k);
        slotClip(ctx as unknown as Konva.Context, scene.slot);
        ctx.clip();
        ctx.translate(pl.cx, pl.cy);
        ctx.rotate((pl.rotation * Math.PI) / 180);
        ctx.scale(pl.scale, pl.scale);
        ctx.drawImage(frame, -o.videoWidth / 2, -o.videoHeight / 2, o.videoWidth, o.videoHeight);
        ctx.restore();
      }
      ctx.drawImage(over, 0, 0, W, H);
      for (const ov of overlays) if (t >= ov.start && t < ov.end) ctx.drawImage(ov.canvas, ov.x, ov.y);
    };

    try {
      const len = Math.max(1 / FPS, o.end - o.start);
      const n = Math.max(1, Math.round(len * FPS));
      const times = Array.from({ length: n }, (_, i) => o.start + i / FPS);
      // Khung hình cuối cùng đã có (dùng lại nếu thời điểm cần lấy nằm trước khung đầu tiên hoặc bị thiếu)
      let last: CanvasImageSource | null = (await sink.getCanvas(o.start))?.canvas ?? null;
      if (!last) last = (await sink.getCanvas(await vTrack.getFirstTimestamp()))?.canvas ?? null;
      let i = 0;
      for await (const wrapped of sink.canvasesAtTimestamps(times)) {
        if (signal.cancelled) throw new CancelledError();
        if (wrapped) last = wrapped.canvas;
        draw(last, times[i]);
        await videoSource.add(i / FPS, 1 / FPS);
        i++;
        if (i % 3 === 0) o.onProgress((audioSource ? 0.92 : 1) * (i / n));
      }
      videoSource.close();

      if (aTrack && audioSource) await addAudio(mb, aTrack, audioSource, o.start, o.start + n / FPS, signal);
      if (signal.cancelled) throw new CancelledError();
      o.onProgress(1);
      await output.finalize();
    } catch (e) {
      if (output.state !== 'finalized' && output.state !== 'canceled') await output.cancel().catch(() => {});
      throw e;
    }
    const buffer = output.target.buffer;
    if (!buffer) throw new Error('Không tạo được file video');
    return new Blob([buffer], { type: 'video/mp4' });
  } finally {
    input.dispose();
  }
}

/** Chép tiếng của đoạn [start, end] (cắt chính xác ở hai đầu) */
async function addAudio(
  mb: typeof import('mediabunny'),
  track: InputAudioTrack,
  source: InstanceType<typeof mb.AudioBufferSource>,
  start: number,
  end: number,
  signal: { cancelled: boolean },
) {
  const sink = new mb.AudioBufferSink(track);
  for await (const { buffer, timestamp } of sink.buffers(start, end)) {
    if (signal.cancelled) throw new CancelledError();
    const rate = buffer.sampleRate;
    const from = Math.max(0, Math.round((start - timestamp) * rate));
    const to = Math.min(buffer.length, Math.round((end - timestamp) * rate));
    if (to <= from) continue;
    const channels = Math.min(2, buffer.numberOfChannels);
    if (from === 0 && to === buffer.length && channels === buffer.numberOfChannels) {
      await source.add(buffer);
      continue;
    }
    const part = new AudioBuffer({ length: to - from, numberOfChannels: channels, sampleRate: rate });
    for (let c = 0; c < channels; c++) part.copyToChannel(buffer.getChannelData(c).subarray(from, to), c);
    await source.add(part);
  }
  source.close();
}
