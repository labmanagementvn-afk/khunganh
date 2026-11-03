import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ResultModal } from '../components/ResultModal';
import { SettingsPanel } from '../components/SettingsPanel';
import { TextNode, createTextElement } from '../components/TextNode';
import { TextPropsPanel } from '../components/TextPropsPanel';
import { Timeline, type TimelineItem } from '../components/Timeline';
import { useArrowNudge } from '../components/useArrowNudge';
import { useFitScale } from '../components/useFitScale';
import { useSession } from '../lib/auth';
import { defaultValues, labelOf } from '../lib/compose';
import { useFontsReady } from '../lib/fonts';
import { slotClip } from '../lib/geometry';
import { newId } from '../lib/id';
import { blobToImage, prepareImageFile } from '../lib/image';
import { CANVAS_UI } from '../lib/theme';
import { canExportVideo, outputSize, recordComposite, type Overlay, type VideoPlacement } from '../lib/videoCompose';
import { CancelledError, canEncodeOffline, encodeComposite } from '../lib/videoEncode';
import { disposeVideo, loadVideoFile } from '../lib/videoLoad';
import type { PhotoSlot, Template, TextElement } from '../types';

const ASPECTS = [
  { id: 'video', label: 'Theo video' },
  { id: '1:1', label: 'Vuông 1:1', w: 1080, h: 1080 },
  { id: '4:5', label: 'Dọc 4:5', w: 1080, h: 1350 },
  { id: '9:16', label: 'Story / Reels 9:16', w: 1080, h: 1920 },
  { id: '16:9', label: 'Ngang 16:9', w: 1920, h: 1080 },
] as const;
type AspectId = (typeof ASPECTS)[number]['id'];

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function coverScale(vw: number, vh: number, rotation: number, w: number, h: number, mode: 'cover' | 'contain') {
  const rot = Math.abs(rotation) % 180 === 90;
  const iw = rot ? vh : vw;
  const ih = rot ? vw : vh;
  return mode === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
}

/** Tạo video có khung: chọn khung (hoặc không), chọn video, chèn chữ / ảnh / logo theo timeline, xuất video */
export default function VideoPage() {
  const { uid, store } = useSession();
  const [params, setParams] = useSearchParams();
  const tplId = params.get('t') ?? '';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [tpl, setTpl] = useState<Template | null>(null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [aspect, setAspect] = useState<AspectId>('video');
  const [background, setBackground] = useState('#000000');

  const [video, setVideo] = useState<{ el: HTMLVideoElement; url: string; name: string; file: File } | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trim, setTrim] = useState({ start: 0, end: 0 });
  const [placement, setPlacement] = useState<VideoPlacement | null>(null);
  /** Ảnh / chữ chèn – thứ tự mảng = thứ tự lớp (phần tử sau nằm trên) */
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [withAudio, setWithAudio] = useState(true);
  const [quality, setQuality] = useState(1080);
  const [exporting, setExporting] = useState<number | null>(null);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [error, setError] = useState('');

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const stickerInput = useRef<HTMLInputElement>(null);
  const audioRef = useRef<{ ctx: AudioContext; node: MediaElementAudioSourceNode } | null>(null);
  const cancelRef = useRef({ cancelled: false });
  const exportingRef = useRef(false);
  const overlaysRef = useRef(overlays);
  overlaysRef.current = overlays;
  const trimRef = useRef(trim);
  trimRef.current = trim;
  const supported = useMemo(() => canExportVideo() || canEncodeOffline(), []);
  /** Cách xuất đang chạy: 'offline' (WebCodecs, chạy được khi chuyển tab) hoặc 'realtime' (phát và ghi lại) */
  const [exportMode, setExportMode] = useState<'offline' | 'realtime'>('offline');
  const [exportNotice, setExportNotice] = useState('');

  useEffect(() => {
    store.listTemplates(uid).then(setTemplates).catch(() => {});
  }, [store, uid]);

  // Khung đang chọn
  useEffect(() => {
    let alive = true;
    setFrameImg(null);
    if (!tplId) {
      setTpl(null);
      return;
    }
    (async () => {
      try {
        const t = await store.getTemplate(uid, tplId);
        if (!alive || !t) return;
        setTpl(t);
        setValues(defaultValues(t.texts));
        if (t.frame) {
          const img = await blobToImage(await store.getBlob(uid, t.frame.blobId));
          if (alive) setFrameImg(img);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tplId, store, uid]);

  // Giải phóng video cũ khi đổi video hoặc rời trang
  useEffect(() => () => void (video && disposeVideo(video)), [video]);

  // Kích thước khung hình & vùng đặt video
  const vw = video?.el.videoWidth || 1080;
  const vh = video?.el.videoHeight || 1350;
  const preset = ASPECTS.find((a) => a.id === aspect)!;
  const k = 1080 / Math.min(vw, vh); // "Theo video": giữ tỉ lệ, cạnh ngắn 1080px (video dọc → 1080×1920)
  const W = tpl ? tpl.width : 'w' in preset ? preset.w : Math.round(vw * k);
  const H = tpl ? tpl.height : 'h' in preset ? preset.h : Math.round(vh * k);
  const slot: PhotoSlot = tpl ? tpl.photoSlot : { x: 0, y: 0, width: W, height: H, radius: 0 };
  const bg = tpl ? tpl.background : background;
  const duration = video?.el.duration && isFinite(video.el.duration) ? video.el.duration : 0;

  const scale = useFitScale(wrapRef, W, H, 0.5);
  const fontsVersion = useFontsReady([...(tpl?.texts ?? []), ...overlays.flatMap((o) => (o.kind === 'text' ? [o.text] : []))].map((t) => t.fontFamily));

  const fit = (mode: 'cover' | 'contain', rotation = placement?.rotation ?? 0) =>
    video &&
    setPlacement({
      cx: slot.x + slot.width / 2,
      cy: slot.y + slot.height / 2,
      rotation,
      scale: coverScale(vw, vh, rotation, slot.width, slot.height, mode),
    });

  // Đặt lại vị trí video khi đổi video / khung / tỉ lệ
  useEffect(() => {
    if (video) fit('cover', 0);
  }, [video, tpl?.id, aspect, W, H]);

  // Mỗi khung hình: vẽ lại video, ẩn/hiện lớp chèn theo thời gian, phát lặp trong đoạn đã cắt
  useEffect(() => {
    if (!video || !layerRef.current) return;
    const el = video.el;
    const anim = new Konva.Animation(() => {
      const t = el.currentTime;
      const tr = trimRef.current;
      if (!exportingRef.current && !el.paused && tr.end > 0 && t >= tr.end) el.currentTime = tr.start;
      const stage = stageRef.current;
      if (!stage) return;
      for (const o of overlaysRef.current) {
        const n = stage.findOne('#' + o.id);
        if (n) n.visible(t >= o.start && t < o.end);
      }
      const trNode = trRef.current;
      if (trNode) trNode.visible(trNode.nodes().every((n) => n.visible()));
    }, layerRef.current);
    anim.start();
    setPlaying(!el.paused);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    return () => {
      anim.stop();
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [video]);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selected && selected !== 'video' ? stage.findOne('#' + selected) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selected, overlays, fontsVersion]);

  const updateOverlay = (id: string, patch: Partial<Overlay>) =>
    setOverlays((xs) => xs.map((o) => (o.id === id ? ({ ...o, ...patch } as Overlay) : o)));
  const updateText = (id: string, patch: Partial<TextElement>) =>
    setOverlays((xs) => xs.map((o) => (o.id === id && o.kind === 'text' ? { ...o, text: { ...o.text, ...patch } } : o)));

  useArrowNudge(
    selected
      ? (dx, dy) => {
          if (selected === 'video') setPlacement((p) => (p ? { ...p, cx: p.cx + dx, cy: p.cy + dy } : p));
          else
            setOverlays((xs) =>
              xs.map((o) =>
                o.id !== selected ? o : o.kind === 'image' ? { ...o, x: o.x + dx, y: o.y + dy } : { ...o, text: { ...o.text, x: o.text.x + dx, y: o.text.y + dy } },
              ),
            );
        }
      : null,
  );

  async function pickVideo(file: File | undefined) {
    if (!file) return;
    setError('');
    setLoadingVideo(true);
    try {
      const { el, url } = await loadVideoFile(file);
      audioRef.current = null;
      const dur = isFinite(el.duration) ? el.duration : 0;
      setTrim({ start: 0, end: dur });
      setVideo({ el, url, name: file.name.replace(/\.[^.]+$/, ''), file });
      // Lớp đã chèn trước đó: giữ trong độ dài video mới
      setOverlays((xs) => xs.map((o) => ({ ...o, start: Math.min(o.start, Math.max(0, dur - 0.5)), end: Math.min(o.end, dur) || dur })));
      setSelected('video');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingVideo(false);
    }
  }

  /** Thời gian mặc định cho lớp mới: từ vạch phát tới hết đoạn (ảnh) hoặc 3 giây (chữ) */
  function defaultTiming(kind: Overlay['kind']) {
    const t = video?.el.currentTime ?? 0;
    const start = t >= trim.start && t < trim.end - 0.5 ? t : trim.start;
    return { start, end: kind === 'image' ? trim.end || duration : Math.min(start + 3, trim.end || duration) };
  }

  async function addStickers(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const { img } = await prepareImageFile(f, 1600, true);
      const w = Math.round(W * 0.3);
      const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
      const o: Overlay = { kind: 'image', id: newId(), img, x: Math.round((W - w) / 2), y: Math.round(H * 0.06), width: w, height: h, rotation: 0, ...defaultTiming('image') };
      setOverlays((xs) => [...xs, o]);
      setSelected(o.id);
    }
  }

  function addText() {
    const el = createTextElement('fixed', W, H, newId());
    el.text = 'Nhập chữ…';
    el.fill = '#ffffff';
    el.stroke = '#000000';
    el.strokeWidth = Math.round(el.fontSize / 12);
    setOverlays((xs) => [...xs, { kind: 'text', id: el.id, text: el, ...defaultTiming('text') }]);
    setSelected(el.id);
  }

  function seek(t: number) {
    if (!video) return;
    if (!video.el.paused) video.el.pause();
    video.el.currentTime = t;
  }

  function togglePlay() {
    if (!video) return;
    const el = video.el;
    if (el.paused) {
      if (el.currentTime < trim.start || el.currentTime >= trim.end - 0.05) el.currentTime = trim.start;
      el.play().catch(() => {});
    } else el.pause();
  }

  /** Chọn lớp từ timeline: tua tới lúc lớp đang hiện để thấy và chỉnh ngay */
  function selectFromTimeline(id: string) {
    setSelected(id);
    const o = overlays.find((x) => x.id === id);
    const t = video?.el.currentTime ?? 0;
    if (o && video && (t < o.start || t >= o.end)) seek(o.start + 0.01);
  }

  function moveLayer(id: string, dir: 1 | -1) {
    setOverlays((xs) => {
      const i = xs.findIndex((o) => o.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= xs.length) return xs;
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function exportVideo() {
    if (!video || !placement) return;
    const el = video.el;
    setError('');
    setSelected(null);
    exportingRef.current = true;
    cancelRef.current = { cancelled: false };
    setExporting(0);
    // Bật tiếng ngay trong thao tác bấm nút (iPhone chỉ cho phép phát có tiếng khi người dùng chạm) – dùng khi phải ghi theo thời gian thực
    if (withAudio) el.muted = false;
    el.pause();
    const wake = await requestWakeLock();
    const scene = { width: W, height: H, background: bg, slot, template: tpl, frameImg, values, overlays };
    const end = trim.end || el.duration;
    try {
      // Ưu tiên giải mã / mã hoá từng khung hình (không phụ thuộc tab đang mở); trình duyệt không hỗ trợ thì ghi thời gian thực
      setExportMode('offline');
      setExportNotice('');
      let blob: Blob | null = null;
      try {
        blob = await encodeComposite({
          scene,
          file: video.file,
          videoWidth: el.videoWidth,
          videoHeight: el.videoHeight,
          placement,
          start: trim.start,
          end,
          shortSide: quality,
          withAudio,
          onProgress: (f) => setExporting(f),
          onNotice: setExportNotice,
          signal: cancelRef.current,
        });
      } catch (e) {
        if (e instanceof CancelledError || cancelRef.current.cancelled) throw e;
        console.warn('Xuất offline lỗi, chuyển sang ghi thời gian thực', e);
      }
      if (!blob) {
        if (!canExportVideo()) throw new Error('Trình duyệt này không hỗ trợ xuất video. Hãy thử Chrome hoặc Safari mới.');
        setExportMode('realtime');
        setExportNotice('');
        setExporting(0);
        blob = await recordComposite({
          scene,
          video: el,
          placement,
          start: trim.start,
          end,
          shortSide: quality,
          withAudio,
          audioSource: () => {
            if (!audioRef.current) {
              try {
                const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                const ctx = new Ctx();
                audioRef.current = { ctx, node: ctx.createMediaElementSource(el) };
              } catch {
                return null;
              }
            }
            return audioRef.current;
          },
          onProgress: (f) => setExporting(f),
          signal: cancelRef.current,
        });
      }
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      setResult({ blob, name: `${video.name || 'video'}-khung-${Date.now().toString(36)}.${ext}` });
    } catch (e) {
      if (!cancelRef.current.cancelled) setError('Xuất video thất bại: ' + (e as Error).message);
    } finally {
      wake?.release().catch(() => {});
      exportingRef.current = false;
      setExporting(null);
      el.muted = true;
      el.loop = true;
      el.currentTime = trim.start;
      el.pause();
    }
  }

  const selOverlay = overlays.find((o) => o.id === selected);
  const inputLabels = Object.keys(values);
  const clipLen = Math.max(0, (trim.end || duration) - trim.start);
  const outSize = outputSize(W, H, quality);
  const timelineItems: TimelineItem[] = overlays.map((o, i) => ({
    id: o.id,
    label: o.kind === 'text' ? o.text.text || 'Chữ' : `Ảnh ${overlays.slice(0, i + 1).filter((x) => x.kind === 'image').length}`,
    icon: o.kind === 'text' ? 'type' : 'image',
    start: o.start,
    end: o.end,
  }));

  const videoNode = video && placement && (
    <Group key="video" clipFunc={(ctx) => slotClip(ctx, slot)}>
      <KImage
        id="video"
        image={video.el}
        width={vw}
        height={vh}
        offsetX={vw / 2}
        offsetY={vh / 2}
        x={placement.cx}
        y={placement.cy}
        scaleX={placement.scale}
        scaleY={placement.scale}
        rotation={placement.rotation}
        draggable={exporting === null}
        onMouseDown={() => setSelected('video')}
        onTouchStart={() => setSelected('video')}
        onDragEnd={(e) => setPlacement((p) => (p ? { ...p, cx: e.target.x(), cy: e.target.y() } : p))}
      />
    </Group>
  );
  const frameNode = frameImg && tpl?.frame && <KImage key="frame" image={frameImg} listening={false} {...tpl.frame} />;

  return (
    <div className="page editor">
      <div className="toolbar">
        <h1 className="grow">Video có khung</h1>
        <button className="btn" onClick={() => videoInput.current?.click()} disabled={exporting !== null || loadingVideo}>
          <Icon name="replace" /> {video ? 'Đổi video' : 'Chọn video'}
        </button>
      </div>
      {!supported && (
        <p className="error">Trình duyệt này chưa hỗ trợ xuất video. Hãy mở bằng Safari (iPhone, iOS 14.5+) hoặc Chrome bản mới.</p>
      )}
      {error && <p className="error">{error}</p>}

      <div className="layout">
        <div className="canvas-col">
          <div className="canvas-wrap" ref={wrapRef}>
            <Stage
              ref={stageRef}
              width={W * scale}
              height={H * scale}
              scaleX={scale}
              scaleY={scale}
              className="stage"
              onMouseDown={(e) => e.target === e.target.getStage() && setSelected(null)}
              onWheel={(e) => {
                if (selected !== 'video' || !placement) return;
                e.evt.preventDefault();
                setPlacement({ ...placement, scale: placement.scale * (e.evt.deltaY < 0 ? 1.06 : 1 / 1.06) });
              }}
            >
              <Layer ref={layerRef}>
                <Rect width={W} height={H} fill={bg} onMouseDown={() => setSelected(null)} onTouchStart={() => setSelected(null)} />
                {!video && (
                  <Group onClick={() => videoInput.current?.click()} onTap={() => videoInput.current?.click()}>
                    <Rect {...slot} cornerRadius={slot.radius} fill={CANVAS_UI.placeholder} />
                    <Text
                      x={slot.x}
                      y={slot.y + slot.height / 2 - 14 / scale}
                      width={slot.width}
                      align="center"
                      text={loadingVideo ? 'Đang mở video…' : 'Chạm để chọn video'}
                      fontSize={22 / scale}
                      fontStyle="bold"
                      fill={CANVAS_UI.placeholderText}
                    />
                  </Group>
                )}
                {tpl?.photoOnTop ? [frameNode, videoNode] : [videoNode, frameNode]}
                {tpl?.texts.map((t) => {
                  const v = t.kind === 'input' ? values[labelOf(t)] ?? '' : t.text;
                  return v ? <TextNode key={t.id + fontsVersion} el={t} value={v} interactive={false} /> : null;
                })}
                {overlays.map((o) =>
                  o.kind === 'image' ? (
                    <KImage
                      key={o.id}
                      id={o.id}
                      image={o.img}
                      x={o.x}
                      y={o.y}
                      width={o.width}
                      height={o.height}
                      rotation={o.rotation}
                      draggable
                      onMouseDown={() => setSelected(o.id)}
                      onTouchStart={() => setSelected(o.id)}
                      onDragEnd={(e) => updateOverlay(o.id, { x: e.target.x(), y: e.target.y() })}
                      onTransformEnd={(e) => {
                        const n = e.target;
                        const patch = { x: n.x(), y: n.y(), rotation: n.rotation(), width: n.width() * n.scaleX(), height: n.height() * n.scaleY() };
                        n.scaleX(1);
                        n.scaleY(1);
                        updateOverlay(o.id, patch);
                      }}
                    />
                  ) : (
                    <TextNode
                      key={o.id + fontsVersion}
                      el={o.text}
                      value={o.text.text}
                      interactive
                      onSelect={() => setSelected(o.id)}
                      onChange={(p) => updateText(o.id, p)}
                    />
                  ),
                )}
                <Transformer
                  ref={trRef}
                  keepRatio={selOverlay?.kind === 'image'}
                  anchorSize={14}
                  anchorCornerRadius={4}
                  borderStroke={CANVAS_UI.accent}
                  anchorStroke={CANVAS_UI.accent}
                />
              </Layer>
            </Stage>
          </div>

          {video && (
            <>
              <div className="video-bar">
                <button className="btn primary sm" onClick={togglePlay} disabled={exporting !== null}>
                  <Icon name={playing ? 'pause' : 'play'} /> {playing ? 'Tạm dừng' : 'Phát'}
                </button>
                <span className="grow" />
                <button className="btn sm" onClick={() => stickerInput.current?.click()} disabled={exporting !== null}>
                  <Icon name="image" /> Ảnh
                </button>
                <button className="btn sm" onClick={addText} disabled={exporting !== null}>
                  <Icon name="type" /> Chữ
                </button>
              </div>
              <Timeline
                duration={duration}
                trim={{ start: trim.start, end: trim.end || duration }}
                onTrim={(t) => {
                  setTrim(t);
                  seek(t.start);
                }}
                items={timelineItems}
                selected={selected}
                onSelect={selectFromTimeline}
                onChange={(id, t) => updateOverlay(id, t)}
                getTime={() => video.el.currentTime}
                onSeek={seek}
              />
            </>
          )}

          {selected === 'video' && video && placement ? (
            <SettingsPanel title="Video" onClose={() => setSelected(null)}>
              <label className="field">
                <span>Thu phóng (hoặc con lăn chuột)</span>
                <input
                  type="range"
                  min={Math.log(coverScale(vw, vh, placement.rotation, slot.width, slot.height, 'contain') * 0.5)}
                  max={Math.log(coverScale(vw, vh, placement.rotation, slot.width, slot.height, 'cover') * 4)}
                  step={0.001}
                  value={Math.log(placement.scale)}
                  onChange={(e) => setPlacement({ ...placement, scale: Math.exp(Number(e.target.value)) })}
                />
              </label>
              <div className="row wrap">
                <button className="btn ghost sm" onClick={() => fit('cover')}>
                  <Icon name="maximize" /> Lấp đầy
                </button>
                <button className="btn ghost sm" onClick={() => fit('contain')}>
                  <Icon name="minimize" /> Hiện toàn bộ
                </button>
                <button className="btn ghost sm" onClick={() => fit('cover', (placement.rotation + 90) % 360)}>
                  <Icon name="rotate" /> Xoay 90°
                </button>
              </div>
              <p className="hint">Kéo video để chỉnh vị trí. Cắt đầu / cuối video bằng hai mép thanh “Video” trên timeline.</p>
            </SettingsPanel>
          ) : selOverlay ? (
            <SettingsPanel title={selOverlay.kind === 'text' ? selOverlay.text.text || 'Chữ' : 'Ảnh chèn'} onClose={() => setSelected(null)}>
              <div className="time-row">
                <label className="field">
                  <span>Hiện từ (giây)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.1}
                    min={0}
                    value={Number(selOverlay.start.toFixed(1))}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!isNaN(v)) updateOverlay(selOverlay.id, { start: Math.max(0, Math.min(v, selOverlay.end - 0.3)) });
                    }}
                  />
                </label>
                <label className="field">
                  <span>Đến (giây)</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.1}
                    min={0}
                    value={Number(selOverlay.end.toFixed(1))}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (!isNaN(v)) updateOverlay(selOverlay.id, { end: Math.min(duration, Math.max(v, selOverlay.start + 0.3)) });
                    }}
                  />
                </label>
              </div>
              <div className="row wrap">
                <button className="btn ghost sm" onClick={() => updateOverlay(selOverlay.id, { start: trim.start, end: trim.end || duration })}>
                  Toàn bộ đoạn
                </button>
                <button
                  className="btn ghost sm"
                  onClick={() => updateOverlay(selOverlay.id, { start: Math.min(video?.el.currentTime ?? 0, selOverlay.end - 0.3) })}
                >
                  Bắt đầu ở đây
                </button>
                <button
                  className="btn ghost sm"
                  onClick={() => updateOverlay(selOverlay.id, { end: Math.max(video?.el.currentTime ?? 0, selOverlay.start + 0.3) })}
                >
                  Kết thúc ở đây
                </button>
              </div>
              <div className="row wrap">
                <button className="btn ghost sm" onClick={() => moveLayer(selOverlay.id, 1)} disabled={overlays[overlays.length - 1]?.id === selOverlay.id}>
                  Đưa lên trên
                </button>
                <button className="btn ghost sm" onClick={() => moveLayer(selOverlay.id, -1)} disabled={overlays[0]?.id === selOverlay.id}>
                  Đưa xuống dưới
                </button>
                {selOverlay.kind === 'image' && (
                  <button className="btn ghost sm" onClick={() => updateOverlay(selOverlay.id, { x: Math.round((W - selOverlay.width) / 2) })}>
                    <Icon name="center" /> Căn giữa
                  </button>
                )}
              </div>
              {selOverlay.kind === 'text' ? (
                <TextPropsPanel
                  el={selOverlay.text}
                  canvasWidth={W}
                  allowKind={false}
                  onChange={(p) => updateText(selOverlay.id, p)}
                  onDelete={() => {
                    setOverlays((xs) => xs.filter((x) => x.id !== selOverlay.id));
                    setSelected(null);
                  }}
                />
              ) : (
                <button
                  className="btn danger sm"
                  onClick={() => {
                    setOverlays((xs) => xs.filter((x) => x.id !== selOverlay.id));
                    setSelected(null);
                  }}
                >
                  <Icon name="trash" /> Xoá ảnh
                </button>
              )}
            </SettingsPanel>
          ) : (
            video && <p className="hint">Chạm vào video, ảnh hoặc chữ (trên khung hình hay trên timeline) để chỉnh.</p>
          )}
        </div>

        <div className="side-col">
          {!video && (
            <button className="btn primary lg block" onClick={() => videoInput.current?.click()} disabled={loadingVideo}>
              <Icon name="video" /> {loadingVideo ? 'Đang mở video…' : 'Chọn video'}
            </button>
          )}

          <div className="panel">
            <h3>Khung</h3>
            <label className="field">
              <span>Dùng khung</span>
              <select
                value={tplId}
                onChange={(e) => {
                  const p = new URLSearchParams(params);
                  if (e.target.value) p.set('t', e.target.value);
                  else p.delete('t');
                  setParams(p, { replace: true });
                }}
              >
                <option value="">Không dùng khung</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {!templates.length && (
                <small>
                  Chưa có khung – chọn một mẫu ở <Link to="/">Khung mẫu</Link> rồi quay lại.
                </small>
              )}
            </label>
            {!tpl && (
              <div className="row">
                <label className="field grow">
                  <span>Tỉ lệ</span>
                  <select value={aspect} onChange={(e) => setAspect(e.target.value as AspectId)}>
                    {ASPECTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field color">
                  <span>Nền</span>
                  <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} />
                </label>
              </div>
            )}
          </div>

          {inputLabels.length > 0 && (
            <div className="panel">
              <h3>Thông tin</h3>
              {inputLabels.map((label) => (
                <label key={label} className="field">
                  <span>{label}</span>
                  <input value={values[label] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [label]: e.target.value }))} />
                </label>
              ))}
            </div>
          )}

          {video && (
            <div className="panel">
              <h3>Xuất video</h3>
              <label className="check">
                <input type="checkbox" checked={withAudio} onChange={(e) => setWithAudio(e.target.checked)} />
                Giữ âm thanh
              </label>
              <label className="field inline">
                <span>Chất lượng</span>
                <select value={quality} onChange={(e) => setQuality(Number(e.target.value))}>
                  <option value={1440}>Rất nét (2K)</option>
                  <option value={1080}>Nét (1080p)</option>
                  <option value={720}>Nhẹ (720p)</option>
                </select>
              </label>
              <p className="hint">
                Kích thước {outSize.W}×{outSize.H} · độ dài {fmt(clipLen)}
              </p>
            </div>
          )}

          {exporting !== null ? (
            <div className="panel">
              <strong>Đang xuất video… {Math.round(exporting * 100)}%</strong>
              <div className="progress">
                <div style={{ width: `${exporting * 100}%` }} />
              </div>
              {exportNotice && <p className="notice">{exportNotice}</p>}
              {exportMode === 'offline' ? (
                <p className="hint">
                  Bạn có thể chuyển sang tab khác trong lúc chờ. Trên điện thoại, nếu thoát ra ứng dụng khác thì quá trình tạm dừng và tự chạy
                  tiếp khi quay lại.
                </p>
              ) : (
                <p className="hint">Video được ghi theo thời gian thực (khoảng {fmt(clipLen)}). Giữ màn hình mở, không chuyển tab hay ứng dụng.</p>
              )}
              <button className="btn" onClick={() => (cancelRef.current.cancelled = true)}>
                Huỷ
              </button>
            </div>
          ) : (
            <button className="btn primary lg block" disabled={!video || !supported} onClick={exportVideo}>
              <Icon name="download" /> Xuất video
            </button>
          )}
        </div>
      </div>

      <input
        ref={videoInput}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          pickVideo(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={stickerInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addStickers(e.target.files);
          e.target.value = '';
        }}
      />

      {result && <ResultModal blob={result.blob} filename={result.name} onClose={() => setResult(null)} />}
    </div>
  );
}

/** Giữ màn hình sáng trong lúc xuất video (nếu trình duyệt hỗ trợ) */
async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    return (await navigator.wakeLock?.request('screen')) ?? null;
  } catch {
    return null;
  }
}
