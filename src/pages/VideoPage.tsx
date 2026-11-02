import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import { Link, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ResultModal } from '../components/ResultModal';
import { SettingsPanel } from '../components/SettingsPanel';
import { TextNode, createTextElement } from '../components/TextNode';
import { TextPropsPanel } from '../components/TextPropsPanel';
import { useArrowNudge } from '../components/useArrowNudge';
import { useFitScale } from '../components/useFitScale';
import { useSession } from '../lib/auth';
import { defaultValues, labelOf } from '../lib/compose';
import { useFontsReady } from '../lib/fonts';
import { slotClip } from '../lib/geometry';
import { newId } from '../lib/id';
import { blobToImage, prepareImageFile } from '../lib/image';
import { CANVAS_UI } from '../lib/theme';
import { canExportVideo, recordComposite, type Sticker, type VideoPlacement } from '../lib/videoCompose';
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

/** Tạo video có khung: chọn khung (hoặc không), chọn video, thêm chữ / ảnh / logo, xuất video */
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

  const [video, setVideo] = useState<{ el: HTMLVideoElement; url: string; name: string } | null>(null);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [trim, setTrim] = useState({ start: 0, end: 0 });
  const [placement, setPlacement] = useState<VideoPlacement | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [extras, setExtras] = useState<TextElement[]>([]);
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
  const supported = useMemo(canExportVideo, []);

  // Danh sách khung của người dùng
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

  // Kích thước khung hình & vùng đặt video
  const vw = video?.el.videoWidth || 1080;
  const vh = video?.el.videoHeight || 1350;
  const preset = ASPECTS.find((a) => a.id === aspect)!;
  // "Theo video": giữ tỉ lệ video, cạnh dài 1080px
  const k = 1080 / Math.max(vw, vh);
  const W = tpl ? tpl.width : 'w' in preset ? preset.w : Math.round(vw * k);
  const H = tpl ? tpl.height : 'h' in preset ? preset.h : Math.round(vh * k);
  const slot: PhotoSlot = tpl ? tpl.photoSlot : { x: 0, y: 0, width: W, height: H, radius: 0 };
  const bg = tpl ? tpl.background : background;

  const scale = useFitScale(wrapRef, W, H, 0.55);
  const fontsVersion = useFontsReady([...(tpl?.texts ?? []), ...extras].map((t) => t.fontFamily));

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

  // Vẽ lại liên tục khi video đang phát
  useEffect(() => {
    if (!video || !layerRef.current) return;
    const anim = new Konva.Animation(() => {}, layerRef.current);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [video]);

  // Phát lặp trong đoạn đã cắt
  useEffect(() => {
    if (!video) return;
    const el = video.el;
    const onTime = () => {
      setTime(el.currentTime);
      if (!exportingRef.current && trim.end > 0 && el.currentTime >= trim.end) el.currentTime = trim.start;
    };
    el.addEventListener('timeupdate', onTime);
    return () => el.removeEventListener('timeupdate', onTime);
  }, [video, trim]);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selected && selected !== 'video' ? stage.findOne('#' + selected) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selected, stickers, extras, fontsVersion]);

  useArrowNudge(
    selected
      ? (dx, dy) => {
          if (selected === 'video') setPlacement((p) => (p ? { ...p, cx: p.cx + dx, cy: p.cy + dy } : p));
          setStickers((xs) => xs.map((s) => (s.id === selected ? { ...s, x: s.x + dx, y: s.y + dy } : s)));
          setExtras((xs) => xs.map((t) => (t.id === selected ? { ...t, x: t.x + dx, y: t.y + dy } : t)));
        }
      : null,
  );

  async function pickVideo(file: File | undefined) {
    if (!file) return;
    setError('');
    const url = URL.createObjectURL(file);
    const el = document.createElement('video');
    el.src = url;
    el.muted = true;
    el.playsInline = true;
    el.loop = true;
    el.preload = 'auto';
    try {
      await new Promise<void>((resolve, reject) => {
        el.onloadeddata = () => resolve();
        el.onerror = () => reject(new Error('Không đọc được video này. Hãy thử video MP4 hoặc quay lại bằng điện thoại.'));
      });
    } catch (e) {
      setError((e as Error).message);
      URL.revokeObjectURL(url);
      return;
    }
    if (video) {
      video.el.pause();
      URL.revokeObjectURL(video.url);
    }
    audioRef.current = null;
    setTrim({ start: 0, end: el.duration || 0 });
    setVideo({ el, url, name: file.name.replace(/\.[^.]+$/, '') });
    setSelected('video');
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }

  async function addStickers(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      const { img } = await prepareImageFile(f, 1600, true);
      const w = Math.round(W * 0.3);
      const h = Math.round((w * img.naturalHeight) / img.naturalWidth);
      const s: Sticker = { id: newId(), img, x: Math.round((W - w) / 2), y: Math.round(H * 0.06), width: w, height: h, rotation: 0 };
      setStickers((xs) => [...xs, s]);
      setSelected(s.id);
    }
  }

  function addText() {
    const el = createTextElement('fixed', W, H, newId());
    el.text = 'Nhập chữ…';
    el.fill = '#ffffff';
    el.stroke = '#000000';
    el.strokeWidth = Math.round(el.fontSize / 12);
    setExtras((xs) => [...xs, el]);
    setSelected(el.id);
  }

  function togglePlay() {
    if (!video) return;
    if (video.el.paused) video.el.play().then(() => setPlaying(true)).catch(() => {});
    else {
      video.el.pause();
      setPlaying(false);
    }
  }

  async function exportVideo() {
    if (!video || !placement) return;
    const el = video.el;
    setError('');
    setSelected(null);
    exportingRef.current = true;
    cancelRef.current = { cancelled: false };
    setExporting(0);
    // Bật tiếng ngay trong thao tác bấm nút (iPhone chỉ cho phép phát có tiếng khi người dùng chạm)
    if (withAudio) el.muted = false;
    try {
      const blob = await recordComposite({
        scene: { width: W, height: H, background: bg, slot, template: tpl, frameImg, values, extras, stickers },
        video: el,
        placement,
        start: trim.start,
        end: trim.end || el.duration,
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
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      setResult({ blob, name: `${video.name || 'video'}-khung-${Date.now().toString(36)}.${ext}` });
    } catch (e) {
      if (!cancelRef.current.cancelled) setError('Xuất video thất bại: ' + (e as Error).message);
    } finally {
      exportingRef.current = false;
      setExporting(null);
      el.muted = true;
      el.loop = true;
      el.currentTime = trim.start;
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }

  const selSticker = stickers.find((s) => s.id === selected);
  const selText = extras.find((t) => t.id === selected);
  const inputLabels = Object.keys(values);
  const duration = video?.el.duration || 0;
  const clipLen = Math.max(0, (trim.end || duration) - trim.start);

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
        <button className="btn" onClick={() => videoInput.current?.click()} disabled={exporting !== null}>
          <Icon name="replace" /> {video ? 'Đổi video' : 'Chọn video'}
        </button>
      </div>
      {!supported && (
        <p className="error">
          Trình duyệt này chưa hỗ trợ xuất video. Hãy mở bằng Safari (iPhone, iOS 14.5+) hoặc Chrome bản mới.
        </p>
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
                      text="Chạm để chọn video"
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
                {stickers.map((s) => (
                  <KImage
                    key={s.id}
                    id={s.id}
                    image={s.img}
                    x={s.x}
                    y={s.y}
                    width={s.width}
                    height={s.height}
                    rotation={s.rotation}
                    draggable
                    onMouseDown={() => setSelected(s.id)}
                    onTouchStart={() => setSelected(s.id)}
                    onDragEnd={(e) => setStickers((xs) => xs.map((x) => (x.id === s.id ? { ...x, x: e.target.x(), y: e.target.y() } : x)))}
                    onTransformEnd={(e) => {
                      const n = e.target;
                      const patch = { x: n.x(), y: n.y(), rotation: n.rotation(), width: n.width() * n.scaleX(), height: n.height() * n.scaleY() };
                      n.scaleX(1);
                      n.scaleY(1);
                      setStickers((xs) => xs.map((x) => (x.id === s.id ? { ...x, ...patch } : x)));
                    }}
                  />
                ))}
                {extras.map((t) => (
                  <TextNode
                    key={t.id + fontsVersion}
                    el={t}
                    value={t.text}
                    interactive
                    onSelect={() => setSelected(t.id)}
                    onChange={(p) => setExtras((xs) => xs.map((x) => (x.id === t.id ? { ...x, ...p } : x)))}
                  />
                ))}
                <Transformer
                  ref={trRef}
                  keepRatio={!!selSticker}
                  anchorSize={14}
                  anchorCornerRadius={4}
                  borderStroke={CANVAS_UI.accent}
                  anchorStroke={CANVAS_UI.accent}
                />
              </Layer>
            </Stage>
          </div>

          {video && (
            <div className="video-bar">
              <button className="icon-btn" onClick={togglePlay} aria-label={playing ? 'Tạm dừng' : 'Phát'} disabled={exporting !== null}>
                <Icon name={playing ? 'pause' : 'play'} size={20} />
              </button>
              <span className="muted small-text">
                {fmt(time)} / {fmt(duration)}
              </span>
              <span className="grow" />
              <span className="muted small-text">Đoạn xuất: {fmt(clipLen)}</span>
            </div>
          )}

          <div className="chips">
            {video && (
              <button className={selected === 'video' ? 'chip on' : 'chip'} onClick={() => setSelected('video')}>
                <Icon name="video" size={15} /> Video
              </button>
            )}
            {stickers.map((s, i) => (
              <button key={s.id} className={selected === s.id ? 'chip on' : 'chip'} onClick={() => setSelected(s.id)}>
                <Icon name="image" size={15} /> Ảnh {i + 1}
              </button>
            ))}
            {extras.map((t) => (
              <button key={t.id} className={selected === t.id ? 'chip on' : 'chip'} onClick={() => setSelected(t.id)}>
                <Icon name="type" size={15} /> {t.text.slice(0, 14) || 'Chữ'}
              </button>
            ))}
          </div>

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
              <p className="hint">Kéo video để chỉnh vị trí trong khung.</p>
            </SettingsPanel>
          ) : selSticker ? (
            <SettingsPanel title="Ảnh chèn" onClose={() => setSelected(null)}>
              <p className="hint">Kéo để di chuyển, kéo góc để đổi kích thước hoặc xoay.</p>
              <div className="row wrap">
                <button
                  className="btn ghost sm"
                  onClick={() => setStickers((xs) => xs.map((s) => (s.id === selSticker.id ? { ...s, x: Math.round((W - s.width) / 2) } : s)))}
                >
                  <Icon name="center" /> Căn giữa ngang
                </button>
                <button
                  className="btn danger sm"
                  onClick={() => {
                    setStickers((xs) => xs.filter((s) => s.id !== selSticker.id));
                    setSelected(null);
                  }}
                >
                  <Icon name="trash" /> Xoá ảnh
                </button>
              </div>
            </SettingsPanel>
          ) : selText ? (
            <SettingsPanel title={selText.text || 'Chữ'} onClose={() => setSelected(null)}>
              <TextPropsPanel
                el={selText}
                canvasWidth={W}
                allowKind={false}
                onChange={(p) => setExtras((xs) => xs.map((x) => (x.id === selText.id ? { ...x, ...p } : x)))}
                onDelete={() => {
                  setExtras((xs) => xs.filter((x) => x.id !== selText.id));
                  setSelected(null);
                }}
              />
            </SettingsPanel>
          ) : (
            <p className="hint">Chạm vào video, ảnh chèn hoặc chữ để chỉnh. Khung và chữ của khung lấy từ khung bạn chọn.</p>
          )}
        </div>

        <div className="side-col">
          {!video && (
            <button className="btn primary lg block" onClick={() => videoInput.current?.click()}>
              <Icon name="video" /> Chọn video
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

          <div className="panel">
            <h3>Chèn thêm</h3>
            <div className="row wrap">
              <button className="btn" onClick={() => stickerInput.current?.click()}>
                <Icon name="image" /> Chèn ảnh / logo
              </button>
              <button className="btn" onClick={addText}>
                <Icon name="type" /> Thêm chữ
              </button>
            </div>
          </div>

          {video && (
            <div className="panel">
              <h3>Đoạn video</h3>
              <label className="field">
                <span className="slider-label">
                  Bắt đầu <b>{fmt(trim.start)}</b>
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trim.start}
                  onChange={(e) => {
                    const start = Math.min(Number(e.target.value), (trim.end || duration) - 0.5);
                    setTrim((t) => ({ ...t, start }));
                    video.el.currentTime = start;
                  }}
                />
              </label>
              <label className="field">
                <span className="slider-label">
                  Kết thúc <b>{fmt(trim.end || duration)}</b>
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={trim.end || duration}
                  onChange={(e) => setTrim((t) => ({ ...t, end: Math.max(Number(e.target.value), t.start + 0.5) }))}
                />
              </label>
              <label className="check">
                <input type="checkbox" checked={withAudio} onChange={(e) => setWithAudio(e.target.checked)} />
                Giữ âm thanh
              </label>
              <label className="field inline">
                <span>Chất lượng</span>
                <select value={quality} onChange={(e) => setQuality(Number(e.target.value))}>
                  <option value={1080}>Cao (1080p)</option>
                  <option value={720}>Nhẹ (720p)</option>
                </select>
              </label>
            </div>
          )}

          {exporting !== null ? (
            <div className="panel">
              <strong>Đang xuất video… {Math.round(exporting * 100)}%</strong>
              <div className="progress">
                <div style={{ width: `${exporting * 100}%` }} />
              </div>
              <p className="hint">Video được ghi theo thời gian thực (khoảng {fmt(clipLen)}). Giữ màn hình mở, không chuyển ứng dụng.</p>
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
