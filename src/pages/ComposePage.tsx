import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AdjustSliders, FilterPicker } from '../components/PhotoAdjustPanels';
import { ResultModal } from '../components/ResultModal';
import { SettingsPanel } from '../components/SettingsPanel';
import { TextNode, createTextElement } from '../components/TextNode';
import { TextPropsPanel } from '../components/TextPropsPanel';
import { UndoRedoButtons } from '../components/UndoRedoButtons';
import { useAdjustedPhoto } from '../components/useAdjustedPhoto';
import { useArrowNudge } from '../components/useArrowNudge';
import { useHistory, useUndoRedoKeys } from '../components/useHistory';
import { useFitScale } from '../components/useFitScale';
import { useSession } from '../lib/auth';
import { useFontsReady } from '../lib/fonts';
import { slotClip } from '../lib/geometry';
import { defaultValues, fitScale, labelOf, normalizeAngle } from '../lib/compose';
import { historyEntry } from '../lib/history';
import { newId } from '../lib/id';
import { DEFAULT_ADJUST, isIdentity, renderAdjusted, type PhotoAdjust } from '../lib/photoFilters';
import { blobToImage, canvasToBlob, prepareImageFile } from '../lib/image';
import { safeFileName } from '../lib/share';
import type { Template, TextElement } from '../types';

// Cho phép nhận sự kiện chạm 2 ngón khi đang kéo ảnh (để phóng to/thu nhỏ)
Konva.hitOnDragEnabled = true;

interface PhotoState {
  img: HTMLImageElement;
  /** Tâm ảnh trong toạ độ canvas */
  cx: number;
  cy: number;
  scale: number;
  rotation: number;
  /** Bộ lọc & chỉnh màu */
  adjust: PhotoAdjust;
}

/** Toàn bộ trạng thái có thể Hoàn tác / Làm lại khi tạo ảnh */
interface ComposeDoc {
  photo: PhotoState | null;
  values: Record<string, string>;
  /** Bản sao các text của khung – chỉnh sửa ở đây chỉ áp dụng cho ảnh đang tạo (trừ khi lưu vào khung) */
  texts: TextElement[];
  extras: TextElement[];
}


export default function ComposePage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const fromPreset = params.get('new') === '1';
  const { uid, store, guest } = useSession();

  const [tpl, setTpl] = useState<Template | null>(null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const history = useHistory<ComposeDoc>({ photo: null, values: {}, texts: [], extras: [] });
  const { photo, values, texts, extras } = history.present;
  const photoDisplay = useAdjustedPhoto(photo?.img ?? null, photo?.adjust ?? null);
  /** Cập nhật một phần của ComposeDoc; mergeKey gộp các thay đổi liên tục (thu phóng, gõ chữ…) thành 1 bước hoàn tác */
  const field =
    <K extends keyof ComposeDoc>(key: K) =>
    (u: ComposeDoc[K] | ((prev: ComposeDoc[K]) => ComposeDoc[K]), mergeKey?: string) =>
      history.set((d) => {
        const next = typeof u === 'function' ? (u as (prev: ComposeDoc[K]) => ComposeDoc[K])(d[key]) : u;
        return next === d[key] ? d : { ...d, [key]: next };
      }, mergeKey);
  const setPhoto = field('photo');
  const setValues = field('values');
  const setTexts = field('texts');
  const setExtras = field('extras');
  const [savingStyle, setSavingStyle] = useState<'' | 'saving' | 'saved'>('');
  const [selected, setSelected] = useState<string | null>(null);
  const [photoTab, setPhotoTab] = useState<'position' | 'filter' | 'adjust'>('position');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string; saved: 'saving' | 'saved' | 'error' | 'guest' } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pinch = useRef<{ dist: number; angle: number; cx: number; cy: number } | null>(null);

  const scale = useFitScale(wrapRef, tpl?.width ?? 1, tpl?.height ?? 1, 0.58);
  const fontsVersion = useFontsReady([...(tpl?.texts ?? []), ...extras].map((t) => t.fontFamily));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await store.getTemplate(uid, id!);
        if (!t) throw new Error('Không tìm thấy khung mẫu');
        if (!alive) return;
        setTpl(t);
        const init = defaultValues(t.texts);
        history.reset({ photo: null, values: init, texts: t.texts, extras: [] });
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
  }, [id, uid]);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    // Ảnh sản phẩm dùng kéo / thu phóng riêng, không gắn transformer
    const node = selected && selected !== 'photo' ? stage.findOne('#' + selected) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selected, texts, extras, values, fontsVersion]);

  useUndoRedoKeys(history.undo, history.redo);

  useArrowNudge(
    selected
      ? (dx, dy) => {
          const key = 'nudge:' + selected;
          if (selected === 'photo') {
            setPhoto((p) => (p ? { ...p, cx: p.cx + dx, cy: p.cy + dy } : p), key);
            return;
          }
          const move = (xs: TextElement[]) => xs.map((x) => (x.id === selected ? { ...x, x: x.x + dx, y: x.y + dy } : x));
          history.set((d) => ({ ...d, texts: move(d.texts), extras: move(d.extras) }), key);
        }
      : null,
  );

  const inputLabels = useMemo(
    () => Array.from(new Set(texts.filter((t) => t.kind === 'input').map(labelOf))),
    [texts],
  );

  if (error && !tpl) return <div className="page"><p className="error">{error}</p></div>;
  if (!tpl) return <div className="page center"><div className="spinner" /></div>;

  const slot = tpl.photoSlot;

  async function onPickPhoto(file: File | undefined) {
    if (!file || !tpl) return;
    setError('');
    try {
      // Giữ đủ chi tiết cho ảnh xuất nhưng tránh ảnh quá lớn gây treo trên điện thoại
      const maxSide = Math.min(4000, Math.max(tpl.width, tpl.height) * 2);
      const { img } = await prepareImageFile(file, maxSide, true);
      setPhoto({
        img,
        cx: slot.x + slot.width / 2,
        cy: slot.y + slot.height / 2,
        rotation: 0,
        scale: fitScale(img, 0, slot.width, slot.height, 'cover'),
        adjust: DEFAULT_ADJUST,
      });
      setSelected('photo');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const minZoom = photo ? fitScale(photo.img, photo.rotation, slot.width, slot.height, 'contain') * 0.5 : 0.1;
  const maxZoom = photo ? fitScale(photo.img, photo.rotation, slot.width, slot.height, 'cover') * 5 : 1;

  function setZoom(next: number, aroundX = slot.x + slot.width / 2, aroundY = slot.y + slot.height / 2) {
    setPhoto((p) => {
      if (!p) return p;
      const s = Math.min(maxZoom, Math.max(minZoom, next));
      const k = s / p.scale;
      return { ...p, scale: s, cx: aroundX + (p.cx - aroundX) * k, cy: aroundY + (p.cy - aroundY) * k };
    }, 'zoom');
  }

  function fit(mode: 'cover' | 'contain') {
    setPhoto((p) =>
      p
        ? {
            ...p,
            cx: slot.x + slot.width / 2,
            cy: slot.y + slot.height / 2,
            scale: fitScale(p.img, p.rotation, slot.width, slot.height, mode),
          }
        : p,
    );
  }

  const setAdjust = (patch: Partial<PhotoAdjust>, mergeKey?: string) =>
    setPhoto((p) => (p ? { ...p, adjust: { ...p.adjust, ...patch } } : p), mergeKey);

  /** Xoay ảnh quanh tâm của nó (thanh trượt) */
  function setRotation(deg: number) {
    setPhoto((p) => (p ? { ...p, rotation: normalizeAngle(deg) } : p), 'rotate');
  }

  function rotate() {
    setPhoto((p) => {
      if (!p) return p;
      const rotation = normalizeAngle(Math.round(p.rotation / 90) * 90 + 90);
      return {
        ...p,
        rotation,
        cx: slot.x + slot.width / 2,
        cy: slot.y + slot.height / 2,
        scale: fitScale(p.img, rotation, slot.width, slot.height, 'cover'),
      };
    });
  }

  function onTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    const touches = e.evt.touches;
    if (touches.length !== 2 || !photo) return;
    e.evt.preventDefault();
    const stage = stageRef.current!;
    const photoNode = stage.findOne('#photo');
    if (photoNode?.isDragging()) photoNode.stopDrag();
    const rect = stage.container().getBoundingClientRect();
    const p1 = { x: (touches[0].clientX - rect.left) / scale, y: (touches[0].clientY - rect.top) / scale };
    const p2 = { x: (touches[1].clientX - rect.left) / scale, y: (touches[1].clientY - rect.top) / scale };
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    const last = pinch.current;
    pinch.current = { dist, angle, cx, cy };
    if (!last) return;
    setPhoto((p) => {
      if (!p) return p;
      const s = Math.min(maxZoom, Math.max(minZoom, p.scale * (dist / last.dist)));
      const k = s / p.scale;
      const delta = normalizeAngle(angle - last.angle);
      const rad = (delta * Math.PI) / 180;
      // Phóng to + xoay quanh tâm 2 ngón tay, đồng thời di chuyển theo ngón tay
      const vx = p.cx - last.cx;
      const vy = p.cy - last.cy;
      return {
        ...p,
        scale: s,
        rotation: normalizeAngle(p.rotation + delta),
        cx: cx + (vx * Math.cos(rad) - vy * Math.sin(rad)) * k,
        cy: cy + (vx * Math.sin(rad) + vy * Math.cos(rad)) * k,
      };
    }, 'pinch');
  }

  function addExtraText() {
    const el = createTextElement('fixed', tpl!.width, tpl!.height, newId());
    el.text = 'Nhập chữ…';
    el.y = Math.round(tpl!.height * 0.05);
    setExtras((x) => [...x, el]);
    setSelected(el.id);
  }

  // Kéo/thả là 1 bước hoàn tác riêng; chỉnh trong bảng thuộc tính truyền mergeKey để gộp
  const updateText = (tid: string, patch: Partial<TextElement>, mergeKey?: string) =>
    setTexts((xs) => xs.map((x) => (x.id === tid ? { ...x, ...patch } : x)), mergeKey);

  const displayValue = (t: TextElement) => (t.kind === 'input' ? values[labelOf(t)] ?? '' : t.text);

  async function exportImage() {
    if (!tpl || !photo) return;
    setBusy(true);
    setError('');
    try {
      trRef.current?.nodes([]);
      setSelected(null);
      const stage = stageRef.current!;
      stage.findOne('#slot-hint')?.hide();
      stage.find('.placeholder').forEach((n) => n.hide());
      // Ảnh xem trước đã lọc ở độ phân giải thấp: xử lý lại ảnh gốc cho ảnh xuất
      const photoNode = stage.findOne('#photo') as Konva.Image | undefined;
      const previewImage = photoNode?.image();
      if (photoNode && !isIdentity(photo.adjust)) {
        // Chỉ cần xử lý ở đúng kích thước ảnh hiện ra trong ảnh xuất (nhanh hơn nhiều so với ảnh gốc)
        const shownSide = Math.ceil(Math.max(photo.img.naturalWidth, photo.img.naturalHeight) * photo.scale * 1.05);
        photoNode.image(renderAdjusted(photo.img, photo.adjust, shownSide));
      }
      stage.draw();
      const canvas = stage.toCanvas({ pixelRatio: tpl.width / stage.width() });
      if (photoNode && previewImage) photoNode.image(previewImage);
      stage.findOne('#slot-hint')?.show();
      stage.find('.placeholder').forEach((n) => n.show());
      const blob = await canvasToBlob(canvas, format, format === 'image/jpeg' ? 0.92 : undefined);
      const code = Object.values(values).filter(Boolean).join('_');
      const name = `${safeFileName(code || tpl.name)}-${Date.now().toString(36)}.${format === 'image/png' ? 'png' : 'jpg'}`;
      setResult({ blob, name, saved: guest ? 'guest' : 'saving' });

      if (guest) return;
      // Lưu lịch sử (chạy nền)
      store
        .addHistory(uid, historyEntry(tpl, values, canvas, format))
        .then(() => setResult((r) => (r && r.blob === blob ? { ...r, saved: 'saved' } : r)))
        .catch(() => setResult((r) => (r && r.blob === blob ? { ...r, saved: 'error' } : r)));
    } catch (e) {
      setError('Xuất ảnh thất bại: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function nextImage() {
    setResult(null);
    history.set((d) => ({
      ...d,
      photo: null,
      values: defaultValues(d.texts),
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const frameNode = frameImg && tpl.frame && (
    <KImage key="frame" image={frameImg} listening={false} {...tpl.frame} />
  );
  const photoNode = (
    <Group key="photo" clipFunc={(ctx) => slotClip(ctx, slot)}>
      {photo ? (
        <KImage
          id="photo"
          image={photoDisplay ?? photo.img}
          width={photo.img.naturalWidth}
          height={photo.img.naturalHeight}
          x={photo.cx}
          y={photo.cy}
          offsetX={photo.img.naturalWidth / 2}
          offsetY={photo.img.naturalHeight / 2}
          scaleX={photo.scale}
          scaleY={photo.scale}
          rotation={photo.rotation}
          draggable
          onMouseDown={() => setSelected('photo')}
          onTouchStart={() => setSelected('photo')}
          onDragEnd={(e) => {
            const x = e.target.x();
            const y = e.target.y();
            setPhoto((p) => (p ? { ...p, cx: x, cy: y } : p));
          }}
        />
      ) : (
        <Group id="slot-hint" onClick={() => fileInput.current?.click()} onTap={() => fileInput.current?.click()}>
          <Rect {...slot} cornerRadius={slot.radius} fill="#eef0ff" />
          <Text
            x={slot.x}
            y={slot.y + slot.height / 2 - 16 / scale}
            width={slot.width}
            align="center"
            text={'📷 Chạm để chọn ảnh'}
            fontSize={24 / scale}
            fontStyle="bold"
            fill="#4f46e5"
          />
        </Group>
      )}
    </Group>
  );

  const selExtra = extras.find((x) => x.id === selected);
  const selText = texts.find((x) => x.id === selected);
  const original = (id: string) => tpl.texts.find((x) => x.id === id);
  const textsChanged = JSON.stringify(texts) !== JSON.stringify(tpl.texts);

  async function saveStyleToTemplate() {
    if (!tpl) return;
    setSavingStyle('saving');
    try {
      const updated = { ...tpl, texts, updatedAt: Date.now() };
      await store.saveTemplate(uid, updated);
      setTpl(updated);
      setSavingStyle('saved');
    } catch (e) {
      setError('Không lưu được vào khung: ' + (e as Error).message);
      setSavingStyle('');
    }
  }

  return (
    <div className="page editor">
      <div className="toolbar">
        <h1 className="grow ellipsis">{tpl.name}</h1>
        <Link className="btn ghost sm" to={`/batch/${tpl.id}`} title="Chọn nhiều ảnh, tạo nhiều kết quả cùng lúc">
          📚 Hàng loạt
        </Link>
        <Link className="btn ghost sm" to={`/templates/${tpl.id}/edit`}>
          ✎ Sửa khung
        </Link>
      </div>
      {fromPreset && (
        <div className="banner">
          <span>✓ Đã thêm “{tpl.name}” vào Khung mẫu của bạn. Bạn có thể sửa chữ, màu, vị trí bất kỳ lúc nào.</span>
          <span className="row">
            <Link className="btn sm" to={`/templates/${tpl.id}/edit`}>
              ✎ Sửa khung
            </Link>
            <button className="icon-btn" aria-label="Đóng" onClick={() => setParams({}, { replace: true })}>
              ✕
            </button>
          </span>
        </div>
      )}
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
              onTouchMove={onTouchMove}
              onTouchEnd={() => (pinch.current = null)}
              onWheel={(e) => {
                if (!photo) return;
                e.evt.preventDefault();
                const pos = stageRef.current!.getPointerPosition()!;
                setZoom(photo.scale * (e.evt.deltaY < 0 ? 1.08 : 1 / 1.08), pos.x / scale, pos.y / scale);
              }}
              onMouseDown={(e) => e.target === e.target.getStage() && setSelected(null)}
            >
              <Layer>
                <Rect width={tpl.width} height={tpl.height} fill={tpl.background} listening={false} />
                {tpl.photoOnTop ? [frameNode, photoNode] : [photoNode, frameNode]}
                {texts.map((t) => {
                  const v = displayValue(t);
                  // Text nhập chưa có giá trị: hiện mờ tên ô để vẫn chọn/kéo được (ẩn khi xuất ảnh)
                  const empty = t.kind === 'input' && !v;
                  return (
                    <TextNode
                      key={t.id + fontsVersion}
                      el={t}
                      value={empty ? `‹${labelOf(t)}›` : v}
                      opacity={empty ? 0.35 : 1}
                      name={empty ? 'placeholder' : 'text'}
                      interactive
                      onSelect={() => setSelected(t.id)}
                      onChange={(p) => updateText(t.id, p)}
                    />
                  );
                })}
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
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
                  anchorSize={14}
                  anchorCornerRadius={4}
                  borderStroke="#4f46e5"
                  anchorStroke="#4f46e5"
                />
              </Layer>
            </Stage>
          </div>
          <UndoRedoButtons
            canUndo={history.canUndo}
            canRedo={history.canRedo}
            onUndo={history.undo}
            onRedo={history.redo}
          />

          <div className="chips">
            {photo && (
              <button className={selected === 'photo' ? 'chip on' : 'chip'} onClick={() => setSelected('photo')}>
                📷 Ảnh
              </button>
            )}
            {[...texts, ...extras].map((t) => (
              <button key={t.id} className={selected === t.id ? 'chip on' : 'chip'} onClick={() => setSelected(t.id)}>
                {t.kind === 'input' ? '✏️ ' + labelOf(t) : '🔤 ' + (t.text.slice(0, 14) || 'Text')}
              </button>
            ))}
          </div>
          {selected === 'photo' && photo ? (
            <SettingsPanel title="📷 Ảnh sản phẩm" onClose={() => setSelected(null)}>
              <div className="seg tabs">
                {(
                  [
                    ['position', 'Vị trí'],
                    ['filter', 'Bộ lọc'],
                    ['adjust', 'Chỉnh sửa'],
                  ] as const
                ).map(([k, label]) => (
                  <button key={k} className={photoTab === k ? 'on' : ''} onClick={() => setPhotoTab(k)}>
                    {label}
                  </button>
                ))}
              </div>
              {photoTab === 'filter' ? (
                <FilterPicker img={photo.img} adjust={photo.adjust} onChange={setAdjust} />
              ) : photoTab === 'adjust' ? (
                <AdjustSliders img={photo.img} adjust={photo.adjust} onChange={setAdjust} />
              ) : (
                <>
                  <label className="field">
                    <span>Thu phóng ảnh (hoặc chụm/mở 2 ngón tay, con lăn chuột)</span>
                    <input
                      type="range"
                      min={Math.log(minZoom)}
                      max={Math.log(maxZoom)}
                      step={0.001}
                      value={Math.log(photo.scale)}
                      onChange={(e) => setZoom(Math.exp(Number(e.target.value)))}
                    />
                  </label>
                  <label className="field">
                    <span>
                      Xoay ảnh: {Math.round(photo.rotation)}° (hoặc xoay 2 ngón tay)
                    </span>
                    <div className="row">
                      <input
                        className="grow"
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={Math.round(photo.rotation)}
                        onChange={(e) => setRotation(Number(e.target.value))}
                      />
                      <button
                        className="btn ghost sm"
                        disabled={photo.rotation === 0}
                        onClick={() => setPhoto((p) => (p ? { ...p, rotation: 0 } : p))}
                      >
                        0°
                      </button>
                    </div>
                  </label>
                  <div className="row wrap">
                    <button className="btn ghost sm" onClick={() => fit('cover')}>⛶ Lấp đầy</button>
                    <button className="btn ghost sm" onClick={() => fit('contain')}>▣ Hiện toàn bộ</button>
                    <button className="btn ghost sm" onClick={rotate}>⟳ Xoay 90°</button>
                    <button className="btn ghost sm" onClick={() => fileInput.current?.click()}>🔁 Đổi ảnh</button>
                  </div>
                  <p className="hint">Kéo ảnh để di chuyển. Dùng 2 ngón tay để vừa phóng to/thu nhỏ vừa xoay ảnh.</p>
                </>
              )}
            </SettingsPanel>
          ) : selText ? (
            <SettingsPanel
              title={selText.kind === 'input' ? '✏️ ' + labelOf(selText) : '🔤 ' + (selText.text || 'Chữ của khung')}
              onClose={() => setSelected(null)}
            >
              <TextPropsPanel
                el={selText}
                canvasWidth={tpl.width}
                allowKind={false}
                content={
                  selText.kind === 'input'
                    ? {
                        label: labelOf(selText),
                        value: values[labelOf(selText)] ?? '',
                        onChange: (v) => setValues((vs) => ({ ...vs, [labelOf(selText)]: v }), 'value:' + labelOf(selText)),
                      }
                    : undefined
                }
                onChange={(p) => updateText(selText.id, p, 'text:' + selText.id)}
                onReset={
                  original(selText.id) &&
                  JSON.stringify(original(selText.id)) !== JSON.stringify(selText)
                    ? () => updateText(selText.id, original(selText.id)!)
                    : undefined
                }
                onDelete={() => {
                  setTexts((xs) => xs.filter((x) => x.id !== selText.id));
                  setSelected(null);
                }}
              />
            </SettingsPanel>
          ) : selExtra ? (
            <SettingsPanel title={'🔤 ' + (selExtra.text || 'Chữ thêm')} onClose={() => setSelected(null)}>
              <TextPropsPanel
                el={selExtra}
                canvasWidth={tpl.width}
                allowKind={false}
                onChange={(p) =>
                  setExtras((xs) => xs.map((x) => (x.id === selExtra.id ? { ...x, ...p } : x)), 'text:' + selExtra.id)
                }
                onDelete={() => {
                  setExtras((xs) => xs.filter((x) => x.id !== selExtra.id));
                  setSelected(null);
                }}
              />
            </SettingsPanel>
          ) : (
            <p className="hint">
              Chạm vào ảnh hoặc chữ (hoặc các nút phía trên) để hiện phần chỉnh sửa ngay tại đây. Trên máy tính: phím mũi
              tên dịch chuyển phần tử đang chọn (giữ Shift: 10px).
            </p>
          )}
        </div>

        <div className="side-col">
          {!photo && (
            <button className="btn primary lg block" onClick={() => fileInput.current?.click()}>
              📷 Chọn ảnh sản phẩm
            </button>
          )}

          {inputLabels.length > 0 && (
            <div className="panel">
              <h3>Thông tin</h3>
              {inputLabels.map((label) => (
                <label key={label} className="field">
                  <span>{label}</span>
                  <input
                    value={values[label] ?? ''}
                    placeholder={texts.find((t) => t.kind === 'input' && labelOf(t) === label)?.text || label}
                    onChange={(e) => setValues((v) => ({ ...v, [label]: e.target.value }), 'value:' + label)}
                    autoCapitalize="characters"
                  />
                </label>
              ))}
            </div>
          )}

          {textsChanged && (
            <div className="panel">
              <p className="hint">Bạn đã chỉnh chữ của khung cho ảnh này. Lưu lại để lần sau dùng luôn kiểu này?</p>
              <div className="row wrap">
                <button className="btn sm" disabled={savingStyle === 'saving'} onClick={saveStyleToTemplate}>
                  {savingStyle === 'saving' ? 'Đang lưu…' : '💾 Lưu vào khung mẫu'}
                </button>
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    setTexts(tpl.texts);
                    setSelected(null);
                  }}
                >
                  ↺ Bỏ tất cả chỉnh sửa
                </button>
              </div>
            </div>
          )}
          {!textsChanged && savingStyle === 'saved' && <p className="hint">✓ Đã lưu kiểu chữ vào khung mẫu.</p>}

          <div className="panel">
            <div className="row wrap">
              <button className="btn" onClick={addExtraText}>＋ Thêm chữ</button>
              <label className="field inline">
                <span>Định dạng</span>
                <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
                  <option value="image/jpeg">JPG (nhẹ)</option>
                  <option value="image/png">PNG (nét nhất)</option>
                </select>
              </label>
            </div>
          </div>

          <button className="btn primary lg block" disabled={!photo || busy} onClick={exportImage}>
            {busy ? 'Đang xuất…' : '⬇️ Xuất ảnh'}
          </button>
          {!photo && <p className="hint center-text">Chọn ảnh sản phẩm để xuất ảnh.</p>}
        </div>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onPickPhoto(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {result && (
        <ResultModal
          blob={result.blob}
          filename={result.name}
          status={
            result.saved === 'guest'
              ? 'Bạn đang dùng không đăng nhập nên ảnh không được lưu vào lịch sử – nhớ tải ảnh về máy.'
              : result.saved === 'saving'
                ? 'Đang lưu vào lịch sử…'
                : result.saved === 'saved'
                  ? '✓ Đã lưu vào lịch sử'
                  : '⚠ Không lưu được lịch sử'
          }
          onClose={() => setResult(null)}
          extraAction={
            <button className="btn" onClick={nextImage}>
              ➕ Tạo ảnh tiếp
            </button>
          }
        />
      )}
    </div>
  );
}
