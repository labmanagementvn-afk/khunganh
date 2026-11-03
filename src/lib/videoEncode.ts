// Xuất video "offline" bằng WebCodecs (thư viện Mediabunny): giải mã từng khung hình từ file gốc, ghép khung / chữ /
// ảnh chèn rồi mã hoá H.264 vào MP4. Không phụ thuộc vào việc phát video hay nhịp vẽ màn hình nên vẫn chạy đúng khi
// người dùng chuyển sang tab khác; nếu trình duyệt tạm dừng trang (chuyển ứng dụng trên điện thoại) thì quá trình
// chỉ dừng lại và tự chạy tiếp khi quay lại – video xuất ra không bị giật, mất hình hay lệch tiếng.
import type Konva from 'konva';
import type { InputAudioTrack, InputVideoTrack } from 'mediabunny';
import { slotClip } from './geometry';
import { outputSize, renderLayers, videoBitrate, type VideoPlacement, type VideoScene } from './videoCompose';

const FPS = 30;
/** Không có khung hình mới trong ngần này (khi trang đang mở) → coi như bộ mã hoá / giải mã của máy bị treo */
const STALL_MS = 15_000;

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
  /** Độ phân giải mong muốn theo cạnh ngắn; máy không mã hoá được (hoặc bị treo) thì tự hạ xuống 1080 / 720 */
  shortSide: number;
  withAudio: boolean;
  onProgress: (fraction: number) => void;
  /** Thông báo cho người dùng (vd. đang thử lại ở độ phân giải thấp hơn) */
  onNotice?: (message: string) => void;
  signal: { cancelled: boolean };
}

/** Trình duyệt có WebCodecs (Chrome 94+, Safari 16.4+, Firefox 130+) */
export const canEncodeOffline = () => typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';

export class CancelledError extends Error {
  constructor() {
    super('Đã huỷ xuất video');
  }
}

class StallError extends Error {
  constructor() {
    super('Bộ mã hoá video không phản hồi');
  }
}

type Mb = typeof import('mediabunny');
type Size = { W: number; H: number; bitrate: number; side: number };

const label = (side: number) => (side >= 1440 ? '2K' : `${side}p`);

/**
 * Xuất video ghép. Trả về `null` (chưa bắt đầu ghi gì) khi trình duyệt không giải mã / mã hoá được file này bằng
 * WebCodecs – khi đó nơi gọi chuyển sang cách ghi theo thời gian thực.
 */
export async function encodeComposite(o: EncodeOptions): Promise<Blob | null> {
  if (!canEncodeOffline()) return null;
  const mb = await import('mediabunny');
  const { scene } = o;

  const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(o.file) });
  try {
    const vTrack: InputVideoTrack | null = await input.getPrimaryVideoTrack().catch(() => null);
    if (!vTrack || !(await vTrack.canDecode())) return null;

    // Các độ phân giải bộ mã hoá của máy nhận, từ mức đã chọn hạ dần xuống
    const sizes: Size[] = [];
    for (const side of [o.shortSide, 1080, 720].filter((x, i, a) => x <= o.shortSide && a.indexOf(x) === i)) {
      const { W, H } = outputSize(scene.width, scene.height, side);
      const bitrate = videoBitrate(W, H);
      if (await mb.canEncodeVideo('avc', { width: W, height: H, bitrate })) sizes.push({ W, H, bitrate, side });
    }
    if (!sizes.length) return null;

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

    if (sizes[0].side < o.shortSide) o.onNotice?.(`Máy này chưa hỗ trợ xuất ${label(o.shortSide)}, đang xuất ở ${label(sizes[0].side)}.`);
    for (let i = 0; ; i++) {
      try {
        return await encodeOnce(mb, o, vTrack, aTrack, audioCodec, sizes[i]);
      } catch (e) {
        if (e instanceof CancelledError || o.signal.cancelled || i === sizes.length - 1) throw e;
        // Bộ mã hoá phần cứng của nhiều điện thoại báo "hỗ trợ" nhưng bị treo / lỗi ở độ phân giải cao → thử lại thấp hơn
        console.warn(`Xuất ${label(sizes[i].side)} lỗi, thử lại ở ${label(sizes[i + 1].side)}`, e);
        o.onNotice?.(`Máy không xuất được ${label(sizes[i].side)}, đang tự chuyển sang ${label(sizes[i + 1].side)}…`);
        o.onProgress(0);
      }
    }
  } finally {
    input.dispose();
  }
}

/** Theo dõi tiến trình: báo lỗi khi quá lâu không có khung hình mới. Thời gian trang bị ẩn / tạm dừng không tính. */
function watchdog(ms: number) {
  let last = performance.now();
  let fail!: (e: Error) => void;
  const stalled = new Promise<never>((_, reject) => (fail = reject));
  stalled.catch(() => {});
  const reset = () => (last = performance.now());
  const timer = setInterval(() => {
    if (document.visibilityState !== 'visible') reset();
    else if (performance.now() - last > ms) fail(new StallError());
  }, 1000);
  document.addEventListener('visibilitychange', reset);
  document.addEventListener('resume', reset);
  return {
    tick: reset,
    race: <T>(p: Promise<T>) => Promise.race([p, stalled]),
    stop() {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', reset);
      document.removeEventListener('resume', reset);
    },
  };
}

async function encodeOnce(
  mb: Mb,
  o: EncodeOptions,
  vTrack: InputVideoTrack,
  aTrack: InputAudioTrack | null,
  audioCodec: 'aac' | 'opus' | null,
  { W, H, bitrate }: Size,
): Promise<Blob> {
  const { scene, placement: pl, signal } = o;
  const k = W / scene.width;
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
  const audioSource =
    aTrack && audioCodec
      ? new mb.AudioBufferSource({ codec: audioCodec, bitrate: 192_000, ...(audioCodec === 'opus' ? { transform: { sampleRate: 48000 } } : {}) })
      : null;
  if (audioSource) output.addAudioTrack(audioSource);

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

  const wd = watchdog(STALL_MS);
  const len = Math.max(1 / FPS, o.end - o.start);
  const n = Math.max(1, Math.round(len * FPS));
  const times = Array.from({ length: n }, (_, i) => o.start + i / FPS);
  const frames = sink.canvasesAtTimestamps(times);
  try {
    await wd.race(output.start());
    // Khung hình cuối cùng đã có (dùng lại nếu thời điểm cần lấy nằm trước khung đầu tiên hoặc bị thiếu)
    let last: CanvasImageSource | null = (await wd.race(sink.getCanvas(o.start)))?.canvas ?? null;
    if (!last) last = (await wd.race(vTrack.getFirstTimestamp().then((t) => sink.getCanvas(t))))?.canvas ?? null;
    wd.tick();
    for (let i = 0; i < n; i++) {
      if (signal.cancelled) throw new CancelledError();
      const r = await wd.race(frames.next());
      if (r.done) break;
      if (r.value) last = r.value.canvas;
      draw(last, times[i]);
      await wd.race(videoSource.add(i / FPS, 1 / FPS));
      wd.tick();
      if (i % 3 === 2) o.onProgress((audioSource ? 0.92 : 1) * ((i + 1) / n));
    }
    videoSource.close();

    if (aTrack && audioSource) await addAudio(mb, aTrack, audioSource, o.start, o.start + n / FPS, signal, wd);
    if (signal.cancelled) throw new CancelledError();
    wd.tick();
    await wd.race(output.finalize());
    o.onProgress(1);
  } catch (e) {
    // Bộ mã hoá bị treo có thể không bao giờ trả lời → không chờ huỷ xong
    void frames.return(undefined).catch(() => {});
    if (output.state !== 'finalized' && output.state !== 'canceled') void output.cancel().catch(() => {});
    throw e;
  } finally {
    wd.stop();
  }
  const buffer = output.target.buffer;
  if (!buffer) throw new Error('Không tạo được file video');
  return new Blob([buffer], { type: 'video/mp4' });
}

/** Chép tiếng của đoạn [start, end] (cắt chính xác ở hai đầu) */
async function addAudio(
  mb: Mb,
  track: InputAudioTrack,
  source: InstanceType<Mb['AudioBufferSource']>,
  start: number,
  end: number,
  signal: { cancelled: boolean },
  wd: ReturnType<typeof watchdog>,
) {
  const sink = new mb.AudioBufferSink(track);
  const it = sink.buffers(start, end);
  try {
    for (;;) {
      const r = await wd.race(it.next());
      if (r.done) break;
      if (signal.cancelled) throw new CancelledError();
      const { buffer, timestamp } = r.value;
      const rate = buffer.sampleRate;
      const from = Math.max(0, Math.round((start - timestamp) * rate));
      const to = Math.min(buffer.length, Math.round((end - timestamp) * rate));
      if (to <= from) continue;
      const channels = Math.min(2, buffer.numberOfChannels);
      let part = buffer;
      if (from !== 0 || to !== buffer.length || channels !== buffer.numberOfChannels) {
        part = new AudioBuffer({ length: to - from, numberOfChannels: channels, sampleRate: rate });
        for (let c = 0; c < channels; c++) part.copyToChannel(buffer.getChannelData(c).subarray(from, to), c);
      }
      await wd.race(source.add(part));
      wd.tick();
    }
  } catch (e) {
    void it.return(undefined).catch(() => {});
    throw e;
  }
  source.close();
}
