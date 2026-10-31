import type Konva from 'konva';
import { useEffect, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import { useNavigate, useParams } from 'react-router-dom';
import { TextNode, createTextElement } from '../components/TextNode';
import { TextPropsPanel } from '../components/TextPropsPanel';
import { useFitScale } from '../components/useFitScale';
import { backend } from '../lib/backend';
import { useUser } from '../lib/auth';
import { useFontsReady } from '../lib/fonts';
import { newId } from '../lib/id';
import { slotClip } from '../lib/geometry';
import { blobToImage, makeThumbnail, prepareImageFile } from '../lib/image';
import type { PhotoSlot, Rect as R, Template, TextElement } from '../types';

const MAX_FRAME_SIDE = 3000;

const SIZE_PRESETS = [
  { label: '1:1 – 1080×1080', w: 1080, h: 1080 },
  { label: '4:5 – 1080×1350', w: 1080, h: 1350 },
  { label: '3:4 – 1200×1600', w: 1200, h: 1600 },
  { label: '9:16 – 1080×1920', w: 1080, h: 1920 },
  { label: '16:9 – 1920×1080', w: 1920, h: 1080 },
];

function defaultSlot(w: number, h: number): PhotoSlot {
  const sw = Math.round(w * 0.7);
  const sh = Math.round(h * 0.6);
  return { x: Math.round((w - sw) / 2), y: Math.round(h * 0.12), width: sw, height: sh, radius: 0 };
}

function emptyTemplate(): Template {
  return {
    id: newId(),
    name: '',
    width: 1080,
    height: 1080,
    background: '#ffffff',
    frame: null,
    photoSlot: defaultSlot(1080, 1080),
    photoOnTop: false,
    texts: [],
    thumbnail: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** Đặt rect (w×h) vừa khít bên trong canvas, căn giữa */
function containRect(w: number, h: number, cw: number, ch: number): R {
  const s = Math.min(cw / w, ch / h);
  return { x: Math.round((cw - w * s) / 2), y: Math.round((ch - h * s) / 2), width: Math.round(w * s), height: Math.round(h * s) };
}

type Sel = 'frame' | 'slot' | string | null;

export default function TemplateEditorPage() {
  const { id } = useParams();
  const user = useUser();
  const navigate = useNavigate();
  const isNew = !id;

  const [tpl, setTpl] = useState<Template | null>(isNew ? emptyTemplate() : null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const [newFrameBlob, setNewFrameBlob] = useState<Blob | null>(null);
  const [frameRemoved, setFrameRemoved] = useState(false);
  const [sampleImg, setSampleImg] = useState<HTMLImageElement | null>(null);
  const [selected, setSelected] = useState<Sel>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(!isNew);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const frameInput = useRef<HTMLInputElement>(null);
  const sampleInput = useRef<HTMLInputElement>(null);

  const scale = useFitScale(wrapRef, tpl?.width ?? 1, tpl?.height ?? 1);
  const fontsVersion = useFontsReady(tpl?.texts.map((t) => t.fontFamily) ?? []);

  // Tải khung khi sửa
  useEffect(() => {
    if (isNew) return;
    let alive = true;
    (async () => {
      try {
        const t = await backend.getTemplate(user.uid, id!);
        if (!t) throw new Error('Không tìm thấy khung mẫu');
        if (!alive) return;
        setTpl(t);
        if (t.frame) {
          const img = await blobToImage(await backend.getBlob(user.uid, t.frame.blobId));
          if (alive) setFrameImg(img);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isNew, user.uid]);

  // Gắn transformer vào phần tử đang chọn
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selected ? stage.findOne('#' + selected) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selected, tpl, frameImg, fontsVersion]);

  if (error && !tpl) return <div className="page"><p className="error">{error}</p></div>;
  if (!tpl) return <div className="page center"><div className="spinner" /></div>;

  const update = (patch: Partial<Template>) => setTpl((t) => (t ? { ...t, ...patch } : t));
  const updateText = (tid: string, patch: Partial<TextElement>) =>
    setTpl((t) => (t ? { ...t, texts: t.texts.map((x) => (x.id === tid ? { ...x, ...patch } : x)) } : t));
  const updateSlot = (patch: Partial<PhotoSlot>) => setTpl((t) => (t ? { ...t, photoSlot: { ...t.photoSlot, ...patch } } : t));
  const updateFrame = (patch: Partial<R>) =>
    setTpl((t) => (t && t.frame ? { ...t, frame: { ...t.frame, ...patch } } : t));

  async function onPickFrame(file: File | undefined) {
    if (!file) return;
    try {
      const { blob, img } = await prepareImageFile(file, MAX_FRAME_SIDE, true);
      setFrameImg(img);
      setNewFrameBlob(blob);
      setFrameRemoved(false);
      setTpl((t) => {
        if (!t) return t;
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!started) {
          // Lần đầu: kích thước ảnh xuất = kích thước khung
          return {
            ...t,
            width: w,
            height: h,
            frame: { blobId: '', x: 0, y: 0, width: w, height: h },
            photoSlot: defaultSlot(w, h),
          };
        }
        return { ...t, frame: { blobId: t.frame?.blobId ?? '', ...containRect(w, h, t.width, t.height) } };
      });
      setStarted(true);
      setSelected('slot');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onPickSample(file: File | undefined) {
    if (!file) return;
    const { img } = await prepareImageFile(file, 2000, false);
    setSampleImg(img);
  }

  function changeCanvasSize(w: number, h: number) {
    setTpl((t) => {
      if (!t) return t;
      const sx = w / t.width;
      const sy = h / t.height;
      return {
        ...t,
        width: w,
        height: h,
        frame: t.frame && frameImg ? { ...t.frame, ...containRect(frameImg.naturalWidth, frameImg.naturalHeight, w, h) } : t.frame,
        photoSlot: {
          ...t.photoSlot,
          x: Math.round(t.photoSlot.x * sx),
          y: Math.round(t.photoSlot.y * sy),
          width: Math.round(t.photoSlot.width * sx),
          height: Math.round(t.photoSlot.height * sy),
        },
        texts: t.texts.map((x) => ({
          ...x,
          x: Math.round(x.x * sx),
          y: Math.round(x.y * sy),
          width: Math.round(x.width * sx),
        })),
      };
    });
  }

  function addText(kind: TextElement['kind']) {
    const el = createTextElement(kind, tpl!.width, tpl!.height, newId());
    if (kind === 'input') {
      // Đặt text nhập ngay dưới text cố định cuối cùng nếu có
      const last = tpl!.texts[tpl!.texts.length - 1];
      if (last) el.y = Math.min(tpl!.height - el.fontSize, last.y + last.fontSize * 1.4);
    }
    update({ texts: [...tpl!.texts, el] });
    setSelected(el.id);
  }

  async function save() {
    if (!tpl) return;
    if (!tpl.name.trim()) {
      setError('Vui lòng nhập tên khung mẫu');
      return;
    }
    setError('');
    setSaving(true);
    try {
      // Ảnh thu nhỏ: ẩn transformer rồi chụp stage
      trRef.current?.nodes([]);
      setSelected(null);
      const stage = stageRef.current!;
      stage.draw();
      const thumbCanvas = stage.toCanvas({ pixelRatio: Math.min(2, 400 / (Math.max(tpl.width, tpl.height) * scale)) });
      const thumbnail = makeThumbnail(thumbCanvas);

      let frame = tpl.frame;
      const oldBlobId = !isNew && (newFrameBlob || frameRemoved) ? tpl.frame?.blobId || null : null;
      if (frameRemoved) frame = null;
      if (newFrameBlob && frame) frame = { ...frame, blobId: await backend.putBlob(user.uid, newFrameBlob) };

      const toSave: Template = { ...tpl, name: tpl.name.trim(), frame, thumbnail, updatedAt: Date.now() };
      await backend.saveTemplate(user.uid, toSave);
      if (oldBlobId && oldBlobId !== frame?.blobId) backend.deleteBlob(user.uid, oldBlobId).catch(() => {});
      navigate('/', { replace: true });
    } catch (e) {
      setError('Lưu thất bại: ' + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ---------- Màn hình bắt đầu (tạo mới) ----------
  if (!started) {
    return (
      <div className="page narrow">
        <h1>Tạo khung mới</h1>
        <div className="card start">
          <p>Bước 1: Tải lên ảnh khung (nên dùng ảnh PNG có vùng trong suốt để đặt ảnh sản phẩm).</p>
          <button className="btn primary lg" onClick={() => frameInput.current?.click()}>
            🖼️ Chọn ảnh khung từ máy
          </button>
          <button className="btn ghost" onClick={() => setStarted(true)}>
            Bỏ qua – không dùng ảnh khung
          </button>
        </div>
        <input ref={frameInput} type="file" accept="image/*" hidden onChange={(e) => onPickFrame(e.target.files?.[0])} />
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  const hasFrame = Boolean(tpl.frame && frameImg && !frameRemoved);
  const slot = tpl.photoSlot;
  const selText = tpl.texts.find((t) => t.id === selected);
  const presetValue = SIZE_PRESETS.find((p) => p.w === tpl.width && p.h === tpl.height);

  const frameNode = hasFrame && (
    <KImage
      key="frame"
      id="frame"
      image={frameImg!}
      x={tpl.frame!.x}
      y={tpl.frame!.y}
      width={tpl.frame!.width}
      height={tpl.frame!.height}
      draggable
      onMouseDown={() => setSelected('frame')}
      onTouchStart={() => setSelected('frame')}
      onDragEnd={(e) => updateFrame({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) })}
      onTransformEnd={(e) => {
        const n = e.target;
        updateFrame({
          x: Math.round(n.x()),
          y: Math.round(n.y()),
          width: Math.round(n.width() * n.scaleX()),
          height: Math.round(n.height() * n.scaleY()),
        });
        n.scaleX(1);
        n.scaleY(1);
      }}
    />
  );

  const sampleCover = sampleImg
    ? (() => {
        const s = Math.max(slot.width / sampleImg.naturalWidth, slot.height / sampleImg.naturalHeight);
        const w = sampleImg.naturalWidth * s;
        const h = sampleImg.naturalHeight * s;
        return { x: slot.x + (slot.width - w) / 2, y: slot.y + (slot.height - h) / 2, width: w, height: h };
      })()
    : null;

  const slotNode = (
    <Group key="slot">
      {sampleImg && sampleCover && (
        <Group
          listening={false}
          clipFunc={(ctx) => slotClip(ctx, slot)}
        >
          <KImage image={sampleImg} {...sampleCover} />
        </Group>
      )}
      <Rect
        id="slot"
        x={slot.x}
        y={slot.y}
        width={slot.width}
        height={slot.height}
        cornerRadius={slot.radius}
        fill={sampleImg ? 'rgba(79,70,229,0.06)' : 'rgba(79,70,229,0.18)'}
        stroke="#4f46e5"
        strokeWidth={Math.max(2, 3 / scale)}
        dash={[12 / scale, 8 / scale]}
        draggable
        onMouseDown={() => setSelected('slot')}
        onTouchStart={() => setSelected('slot')}
        onDragEnd={(e) => updateSlot({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) })}
        onTransformEnd={(e) => {
          const n = e.target;
          updateSlot({
            x: Math.round(n.x()),
            y: Math.round(n.y()),
            width: Math.round(n.width() * n.scaleX()),
            height: Math.round(n.height() * n.scaleY()),
          });
          n.scaleX(1);
          n.scaleY(1);
        }}
      />
      {!sampleImg && (
        <Text
          listening={false}
          x={slot.x}
          y={slot.y + slot.height / 2 - 14 / scale}
          width={slot.width}
          align="center"
          text="📷 Vùng ảnh sản phẩm"
          fontSize={22 / scale}
          fontStyle="bold"
          fill="#4f46e5"
        />
      )}
    </Group>
  );

  return (
    <div className="page editor">
      <div className="toolbar">
        <input
          className="name-input"
          placeholder="Tên khung mẫu (vd: Khung Shopee)"
          value={tpl.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <button className="btn primary" disabled={saving} onClick={save}>
          {saving ? 'Đang lưu…' : '💾 Lưu khung'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="layout">
        <div className="canvas-col">
          <div className="canvas-wrap" ref={wrapRef}>
            <Stage
              ref={stageRef}
              width={tpl.width * scale}
              height={tpl.height * scale}
              scaleX={scale}
              scaleY={scale}
              className="stage"
              onMouseDown={(e) => e.target === e.target.getStage() && setSelected(null)}
              onTouchStart={(e) => e.target === e.target.getStage() && setSelected(null)}
            >
              <Layer>
                <Rect
                  x={0}
                  y={0}
                  width={tpl.width}
                  height={tpl.height}
                  fill={tpl.background}
                  onMouseDown={() => setSelected(null)}
                  onTouchStart={() => setSelected(null)}
                />
                {tpl.photoOnTop ? [frameNode, slotNode] : [slotNode, frameNode]}
                {tpl.texts.map((t) => (
                  <TextNode
                    key={t.id + fontsVersion}
                    el={t}
                    value={t.kind === 'input' ? t.text || `<${t.label || 'nhập'}>` : t.text}
                    interactive
                    onSelect={() => setSelected(t.id)}
                    onChange={(p) => updateText(t.id, p)}
                  />
                ))}
                <Transformer
                  ref={trRef}
                  rotateEnabled={Boolean(selText)}
                  keepRatio={selected === 'frame'}
                  enabledAnchors={
                    selText
                      ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']
                      : undefined
                  }
                  anchorSize={Math.max(14, 10)}
                  anchorCornerRadius={4}
                  borderStroke="#4f46e5"
                  anchorStroke="#4f46e5"
                  boundBoxFunc={(oldBox, newBox) => (newBox.width < 10 || newBox.height < 10 ? oldBox : newBox)}
                />
              </Layer>
            </Stage>
          </div>

          <div className="chips">
            {hasFrame && (
              <button className={selected === 'frame' ? 'chip on' : 'chip'} onClick={() => setSelected('frame')}>
                🖼️ Khung
              </button>
            )}
            <button className={selected === 'slot' ? 'chip on' : 'chip'} onClick={() => setSelected('slot')}>
              📷 Vùng ảnh
            </button>
            {tpl.texts.map((t) => (
              <button key={t.id} className={selected === t.id ? 'chip on' : 'chip'} onClick={() => setSelected(t.id)}>
                {t.kind === 'input' ? '✏️ ' + (t.label || 'Text nhập') : '🔤 ' + (t.text.slice(0, 14) || 'Text')}
              </button>
            ))}
          </div>
          <div className="row wrap">
            <button className="btn" onClick={() => addText('fixed')}>
              ＋ Text cố định
            </button>
            <button className="btn" onClick={() => addText('input')}>
              ＋ Text nhập (input)
            </button>
          </div>
        </div>

        <div className="side-col">
          {selText ? (
            <>
              <h3>{selText.kind === 'input' ? 'Text nhập' : 'Text cố định'}</h3>
              <TextPropsPanel
                el={selText}
                canvasWidth={tpl.width}
                allowKind
                onChange={(p) => updateText(selText.id, p)}
                onDuplicate={() => {
                  const copy = { ...selText, id: newId(), y: selText.y + selText.fontSize * 1.3 };
                  update({ texts: [...tpl.texts, copy] });
                  setSelected(copy.id);
                }}
                onDelete={() => {
                  update({ texts: tpl.texts.filter((x) => x.id !== selText.id) });
                  setSelected(null);
                }}
              />
            </>
          ) : selected === 'slot' ? (
            <>
              <h3>Vùng đặt ảnh sản phẩm</h3>
              <div className="panel">
                <p className="hint">Kéo và kéo góc để chỉnh vị trí, kích thước vùng ảnh sẽ được chèn vào.</p>
                <NumberRow rect={slot} onChange={updateSlot} />
                <label className="field">
                  <span>Bo góc: {slot.radius}px</span>
                  <input
                    type="range"
                    min={0}
                    max={Math.round(Math.min(slot.width, slot.height) / 2)}
                    value={slot.radius}
                    onChange={(e) => updateSlot({ radius: Number(e.target.value) })}
                  />
                </label>
                <div className="row wrap">
                  <button className="btn ghost sm" onClick={() => updateSlot({ x: 0, y: 0, width: tpl.width, height: tpl.height })}>
                    ⛶ Toàn khung
                  </button>
                  <button className="btn ghost sm" onClick={() => updateSlot({ x: Math.round((tpl.width - slot.width) / 2) })}>
                    ↔ Căn giữa ngang
                  </button>
                  <button className="btn ghost sm" onClick={() => sampleInput.current?.click()}>
                    🧪 {sampleImg ? 'Đổi ảnh thử' : 'Xem thử với 1 ảnh'}
                  </button>
                  {sampleImg && (
                    <button className="btn ghost sm" onClick={() => setSampleImg(null)}>
                      Bỏ ảnh thử
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : selected === 'frame' && hasFrame ? (
            <>
              <h3>Ảnh khung</h3>
              <div className="panel">
                <NumberRow rect={tpl.frame!} onChange={updateFrame} />
                <div className="row wrap">
                  <button
                    className="btn ghost sm"
                    onClick={() => updateFrame(containRect(frameImg!.naturalWidth, frameImg!.naturalHeight, tpl.width, tpl.height))}
                  >
                    ⛶ Vừa canvas
                  </button>
                  <button className="btn ghost sm" onClick={() => updateFrame({ x: 0, y: 0, width: tpl.width, height: tpl.height })}>
                    ⤢ Kéo giãn toàn canvas
                  </button>
                  <button className="btn ghost sm" onClick={() => frameInput.current?.click()}>
                    🔁 Đổi ảnh khung
                  </button>
                  <button
                    className="btn danger sm"
                    onClick={() => {
                      setFrameRemoved(true);
                      setSelected(null);
                    }}
                  >
                    🗑 Bỏ khung
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3>Cài đặt khung</h3>
              <div className="panel">
                <p className="hint">Chạm vào phần tử trên ảnh (hoặc các nút bên dưới ảnh) để chỉnh sửa.</p>
                <label className="field">
                  <span>Kích thước ảnh xuất</span>
                  <select
                    value={presetValue ? `${presetValue.w}x${presetValue.h}` : 'custom'}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'frame' && frameImg) changeCanvasSize(frameImg.naturalWidth, frameImg.naturalHeight);
                      else if (v !== 'custom') {
                        const [w, h] = v.split('x').map(Number);
                        changeCanvasSize(w, h);
                      }
                    }}
                  >
                    <option value="custom">
                      {tpl.width}×{tpl.height}
                      {frameImg && tpl.width === frameImg.naturalWidth && tpl.height === frameImg.naturalHeight ? ' (theo khung)' : ''}
                    </option>
                    {frameImg && <option value="frame">Theo kích thước ảnh khung</option>}
                    {SIZE_PRESETS.map((p) => (
                      <option key={p.label} value={`${p.w}x${p.h}`}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="row">
                  <label className="field color">
                    <span>Màu nền</span>
                    <input type="color" value={tpl.background} onChange={(e) => update({ background: e.target.value })} />
                  </label>
                  <label className="check grow">
                    <input type="checkbox" checked={tpl.photoOnTop} onChange={(e) => update({ photoOnTop: e.target.checked })} />
                    Ảnh sản phẩm nằm đè lên khung
                  </label>
                </div>
                {!hasFrame && (
                  <button className="btn" onClick={() => frameInput.current?.click()}>
                    🖼️ Thêm ảnh khung
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <input
        ref={frameInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onPickFrame(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={sampleInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onPickSample(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function NumberRow({ rect, onChange }: { rect: R; onChange: (p: Partial<R>) => void }) {
  const fields: [keyof R, string][] = [
    ['x', 'X'],
    ['y', 'Y'],
    ['width', 'Rộng'],
    ['height', 'Cao'],
  ];
  return (
    <div className="num-row">
      {fields.map(([k, label]) => (
        <label key={k} className="field">
          <span>{label}</span>
          <input
            type="number"
            inputMode="numeric"
            value={Math.round(rect[k])}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!Number.isNaN(v)) onChange({ [k]: k === 'width' || k === 'height' ? Math.max(10, v) : v });
            }}
          />
        </label>
      ))}
    </div>
  );
}
