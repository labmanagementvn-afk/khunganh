import Konva from 'konva';
import { CANVAS_UI } from '../lib/theme';
import { Icon } from '../components/Icon';
import { useEffect, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Rect, Shape, Stage, Text, Transformer } from 'react-konva';
import { useSearchParams } from 'react-router-dom';
import { AdjustSliders, FilterPicker } from '../components/PhotoAdjustPanels';
import { ResultModal } from '../components/ResultModal';
import { SettingsPanel } from '../components/SettingsPanel';
import { TextNode, createTextElement } from '../components/TextNode';
import { TextPropsPanel } from '../components/TextPropsPanel';
import { UndoRedoButtons } from '../components/UndoRedoButtons';
import { useAdjustedPhoto } from '../components/useAdjustedPhoto';
import { useArrowNudge } from '../components/useArrowNudge';
import { useFitScale } from '../components/useFitScale';
import { useHistory, useUndoRedoKeys } from '../components/useHistory';
import { useSession } from '../lib/auth';
import {
  ASPECTS,
  COLLAGE_COUNTS,
  COLLAGE_LAYOUTS,
  firstLayoutFor,
  layoutById,
  layoutGeometry,
  type AspectId,
  type CollageLayout,
} from '../lib/collageLayouts';
import { fitScale, normalizeAngle } from '../lib/compose';
import { useFontsReady } from '../lib/fonts';
import { historyEntry } from '../lib/history';
import { newId } from '../lib/id';
import { canvasToBlob, prepareImageFile } from '../lib/image';
import { DEFAULT_ADJUST, isIdentity, renderAdjusted, type PhotoAdjust } from '../lib/photoFilters';
import type { TextElement } from '../types';

Konva.hitOnDragEnabled = true;

/** Ảnh trong một ô. Vị trí lưu tương đối theo ô nên vẫn đúng khi đổi bố cục / tỉ lệ / khoảng cách */
interface CellPhoto {
  img: HTMLImageElement;
  /** Độ lệch tâm ảnh so với tâm ô, tính theo chiều rộng / cao của ô */
  dx: number;
  dy: number;
  /** Mức phóng so với "vừa lấp đầy ô" (1 = lấp đầy) */
  zoom: number;
  rotation: number;
  adjust: PhotoAdjust;
}

interface CollageDoc {
  layoutId: string;
  aspect: AspectId;
  gap: number;
  padding: number;
  radius: number;
  background: string;
  /** Ảnh theo thứ tự ô; null = ô trống. Có thể dài hơn số ô (ảnh dư được giữ khi đổi bố cục) */
  photos: (CellPhoto | null)[];
  texts: TextElement[];
}

const INITIAL: CollageDoc = {
  layoutId: COLLAGE_LAYOUTS[0].id,
  aspect: '4:5',
  gap: 16,
  padding: 16,
  radius: 12,
  background: '#ffffff',
  photos: [],
  texts: [],
};

type Box = { x: number; y: number; width: number; height: number };

/** Toạ độ tuyệt đối của ảnh trong ô */
function placement(p: CellPhoto, box: Box) {
  const cover = fitScale(p.img, p.rotation, box.width, box.height, 'cover');
  return {
    x: box.x + box.width / 2 + p.dx * box.width,
    y: box.y + box.height / 2 + p.dy * box.height,
    scale: cover * p.zoom,
  };
}

/** Hình minh hoạ bố cục (dùng chung cho trang chủ) */
function LayoutIcon({ layout }: { layout: CollageLayout }) {
  return (
    <svg viewBox="0 0 40 50" width="40" height="50" aria-hidden>
      {layout.shapes
        ? layout.shapes.map((sh, i) =>
            sh.kind === 'circle' ? (
              <circle key={i} cx={sh.cx * 40} cy={sh.cy * 50} r={sh.r * 40 - 1} />
            ) : (
              <polygon key={i} points={sh.points.map(([x, y]) => `${x * 40},${y * 50}`).join(' ')} />
            ),
          )
        : layout.cells.map(([x, y, w, h], i) => (
            <rect key={i} x={x * 40 + 1} y={y * 50 + 1} width={w * 40 - 2} height={h * 50 - 2} rx="2" />
          ))}
    </svg>
  );
}

function LayoutThumb({ layout, active, onClick }: { layout: CollageLayout; active: boolean; onClick: () => void }) {
  return (
    <button className={active ? 'layout-item on' : 'layout-item'} onClick={onClick} title={layout.name}>
      <LayoutIcon layout={layout} />
      <span>{layout.name}</span>
    </button>
  );
}

/** Ảnh của một ô, đã áp bộ lọc (xử lý ở độ phân giải xem trước) */
function CellImage({ photo, box, index, onSelect, onMove }: {
  photo: CellPhoto;
  box: Box;
  index: number;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
}) {
  const shown = useAdjustedPhoto(photo.img, photo.adjust);
  const pos = placement(photo, box);
  return (
    <KImage
      id={`cell-img-${index}`}
      image={shown ?? photo.img}
      width={photo.img.naturalWidth}
      height={photo.img.naturalHeight}
      offsetX={photo.img.naturalWidth / 2}
      offsetY={photo.img.naturalHeight / 2}
      x={pos.x}
      y={pos.y}
      scaleX={pos.scale}
      scaleY={pos.scale}
      rotation={photo.rotation}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onDragEnd={(e) => onMove((e.target.x() - box.x - box.width / 2) / box.width, (e.target.y() - box.y - box.height / 2) / box.height)}
    />
  );
}

export default function CollagePage() {
  const { uid, store, guest } = useSession();
  const [params] = useSearchParams();
  const history = useHistory<CollageDoc>(INITIAL);
  const doc = history.present;
  const layout = layoutById(doc.layoutId);
  const aspect = ASPECTS.find((a) => a.id === doc.aspect) ?? ASPECTS[1];
  const W = aspect.w;
  const H = aspect.h;
  const geoms = layoutGeometry(layout, W, H, doc.padding, doc.gap, doc.radius);
  const boxes = geoms.map((g) => g.box);

  const [selected, setSelected] = useState<string | null>(null);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);
  const [cellTab, setCellTab] = useState<'position' | 'filter' | 'adjust'>('position');
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string; saved: string } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const multiInput = useRef<HTMLInputElement>(null);
  const cellInput = useRef<HTMLInputElement>(null);
  const targetCell = useRef<number | null>(null);
  const pinch = useRef<{ dist: number; angle: number; cx: number; cy: number } | null>(null);

  const scale = useFitScale(wrapRef, W, H, 0.6);
  const fontsVersion = useFontsReady(doc.texts.map((t) => t.fontFamily));
  const selCell = selected?.startsWith('cell:') ? Number(selected.slice(5)) : null;
  const selText = doc.texts.find((t) => t.id === selected);

  // Mở từ trang chủ với ?n=3 hoặc ?layout=… → chọn sẵn bố cục
  useEffect(() => {
    const id = params.get('layout');
    const n = Number(params.get('n'));
    const l = id ? layoutById(id) : n ? firstLayoutFor(n) : null;
    if (l) history.reset((d) => ({ ...d, layoutId: l.id }));
  }, []);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selText ? stage.findOne('#' + selText.id) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selText, doc.texts, fontsVersion]);

  const setDoc = (fn: (d: CollageDoc) => CollageDoc, mergeKey?: string) => history.set(fn, mergeKey);
  const updatePhoto = (i: number, patch: Partial<CellPhoto>, mergeKey?: string) =>
    setDoc((d) => ({ ...d, photos: d.photos.map((p, k) => (k === i && p ? { ...p, ...patch } : p)) }), mergeKey);
  const updateText = (id: string, patch: Partial<TextElement>, mergeKey?: string) =>
    setDoc((d) => ({ ...d, texts: d.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)) }), mergeKey);

  useUndoRedoKeys(history.undo, history.redo);
  useArrowNudge(
    selCell !== null && doc.photos[selCell]
      ? (dx, dy) => {
          const b = boxes[selCell];
          const p = doc.photos[selCell]!;
          updatePhoto(selCell, { dx: p.dx + dx / b.width, dy: p.dy + dy / b.height }, 'nudge');
        }
      : selText
        ? (dx, dy) => updateText(selText.id, { x: selText.x + dx, y: selText.y + dy }, 'nudge')
        : null,
  );

  async function loadPhotos(files: File[]): Promise<CellPhoto[]> {
    setLoading(files.length);
    const out: CellPhoto[] = [];
    for (const f of files) {
      try {
        const { img } = await prepareImageFile(f, 2400, false);
        out.push({ img, dx: 0, dy: 0, zoom: 1, rotation: 0, adjust: DEFAULT_ADJUST });
      } catch {
        setError(`Không đọc được ảnh "${f.name}"`);
      }
      setLoading((n) => n - 1);
    }
    return out;
  }

  /** Thêm nhiều ảnh: lấp các ô trống trước, phần dư nối vào cuối */
  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const loaded = await loadPhotos(Array.from(files));
    setDoc((d) => {
      const photos = [...d.photos];
      while (photos.length < layout.cells.length) photos.push(null);
      for (const p of loaded) {
        const empty = photos.findIndex((x) => !x);
        if (empty >= 0) photos[empty] = p;
        else photos.push(p);
      }
      // Chưa chọn bố cục phù hợp số ảnh → tự chọn bố cục đầu tiên đúng số ảnh
      const count = photos.filter(Boolean).length;
      const layoutId = d.photos.length === 0 && count !== layout.cells.length && count >= 2 && count <= 6 ? firstLayoutFor(count).id : d.layoutId;
      return { ...d, photos, layoutId };
    });
  }

  async function setCellPhoto(i: number, file: File | undefined) {
    if (!file) return;
    const [p] = await loadPhotos([file]);
    if (!p) return;
    setDoc((d) => {
      const photos = [...d.photos];
      while (photos.length <= i) photos.push(null);
      photos[i] = p;
      return { ...d, photos };
    });
    setSelected(`cell:${i}`);
  }

  function pickForCell(i: number) {
    targetCell.current = i;
    cellInput.current?.click();
  }

  function onCellTap(i: number) {
    if (swapFrom !== null) {
      if (swapFrom !== i) {
        setDoc((d) => {
          const photos = [...d.photos];
          while (photos.length <= Math.max(i, swapFrom)) photos.push(null);
          [photos[i], photos[swapFrom]] = [photos[swapFrom], photos[i]];
          return { ...d, photos };
        });
      }
      setSwapFrom(null);
      setSelected(`cell:${i}`);
      return;
    }
    if (doc.photos[i]) setSelected(`cell:${i}`);
    else pickForCell(i);
  }

  // Chụm 2 ngón: phóng to + xoay ảnh của ô đang chọn
  function onTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    const touches = e.evt.touches;
    if (touches.length !== 2 || selCell === null || !doc.photos[selCell]) return;
    e.evt.preventDefault();
    const stage = stageRef.current!;
    const node = stage.findOne(`#cell-img-${selCell}`);
    if (node?.isDragging()) node.stopDrag();
    const rect = stage.container().getBoundingClientRect();
    const p1 = { x: (touches[0].clientX - rect.left) / scale, y: (touches[0].clientY - rect.top) / scale };
    const p2 = { x: (touches[1].clientX - rect.left) / scale, y: (touches[1].clientY - rect.top) / scale };
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;
    const last = pinch.current;
    pinch.current = { dist, angle, cx, cy };
    if (!last) return;
    const box = boxes[selCell];
    const i = selCell;
    setDoc((d) => {
      const p = d.photos[i];
      if (!p) return d;
      const pos = placement(p, box);
      const rotation = normalizeAngle(p.rotation + (angle - last.angle));
      const cover = fitScale(p.img, rotation, box.width, box.height, 'cover');
      const zoom = Math.min(8, Math.max(0.3, (pos.scale * (dist / last.dist)) / cover));
      const k = (zoom * cover) / pos.scale;
      const rad = ((angle - last.angle) * Math.PI) / 180;
      // Phóng + xoay quanh tâm 2 ngón tay, đồng thời đi theo ngón tay
      const vx = pos.x - last.cx;
      const vy = pos.y - last.cy;
      const nx = cx + (vx * Math.cos(rad) - vy * Math.sin(rad)) * k;
      const ny = cy + (vx * Math.sin(rad) + vy * Math.cos(rad)) * k;
      const next = { ...p, zoom, rotation, dx: (nx - box.x - box.width / 2) / box.width, dy: (ny - box.y - box.height / 2) / box.height };
      return { ...d, photos: d.photos.map((x, n) => (n === i ? next : x)) };
    }, 'pinch');
  }

  function addText() {
    const el = createTextElement('fixed', W, H, newId());
    el.text = 'Nhập chữ…';
    el.y = Math.round(H * 0.06);
    setDoc((d) => ({ ...d, texts: [...d.texts, el] }));
    setSelected(el.id);
  }

  async function exportImage() {
    setBusy(true);
    setError('');
    try {
      trRef.current?.nodes([]);
      setSelected(null);
      setSwapFrom(null);
      const stage = stageRef.current!;
      const hide = stage.find('.ui');
      hide.forEach((n) => n.hide());
      // Ảnh đã lọc: xử lý lại từ ảnh gốc ở đúng kích thước hiện trong ảnh xuất
      const restore: [Konva.Image, CanvasImageSource | undefined][] = [];
      layout.cells.forEach((_, i) => {
        const p = doc.photos[i];
        const node = stage.findOne(`#cell-img-${i}`) as Konva.Image | undefined;
        if (!p || !node || isIdentity(p.adjust)) return;
        restore.push([node, node.image()]);
        const pos = placement(p, boxes[i]);
        node.image(renderAdjusted(p.img, p.adjust, Math.ceil(Math.max(p.img.naturalWidth, p.img.naturalHeight) * pos.scale * 1.05)));
      });
      stage.draw();
      const canvas = stage.toCanvas({ pixelRatio: W / stage.width() });
      restore.forEach(([n, img]) => img && n.image(img));
      hide.forEach((n) => n.show());
      const blob = await canvasToBlob(canvas, format, format === 'image/jpeg' ? 0.92 : undefined);
      const name = `ghep-anh-${layout.cells.length}-${Date.now().toString(36)}.${format === 'image/png' ? 'png' : 'jpg'}`;
      setResult({ blob, name, saved: guest ? 'guest' : 'saving' });
      if (!guest) {
        store
          .addHistory(uid, historyEntry({ id: 'collage', name: `Ghép ${layout.cells.length} ảnh – ${layout.name}` }, {}, canvas, format))
          .then(() => setResult((r) => (r && r.blob === blob ? { ...r, saved: 'saved' } : r)))
          .catch(() => setResult((r) => (r && r.blob === blob ? { ...r, saved: 'error' } : r)));
      }
    } catch (e) {
      setError('Xuất ảnh thất bại: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const filled = layout.cells.filter((_, i) => doc.photos[i]).length;
  const extra = doc.photos.slice(layout.cells.length).filter(Boolean).length;
  const selPhoto = selCell !== null ? doc.photos[selCell] ?? null : null;

  return (
    <div className="page editor">
      <div className="toolbar">
        <h1 className="grow"><Icon name="grid" /> Ghép ảnh</h1>
        <button className="btn primary" onClick={() => multiInput.current?.click()}>
          <Icon name="plus" /> Thêm ảnh
        </button>
      </div>
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
              onTouchMove={onTouchMove}
              onTouchEnd={() => (pinch.current = null)}
              onWheel={(e) => {
                if (selCell === null || !doc.photos[selCell]) return;
                e.evt.preventDefault();
                const p = doc.photos[selCell]!;
                updatePhoto(selCell, { zoom: Math.min(8, Math.max(0.3, p.zoom * (e.evt.deltaY < 0 ? 1.08 : 1 / 1.08))) }, 'zoom');
              }}
              onMouseDown={(e) => e.target === e.target.getStage() && setSelected(null)}
            >
              <Layer>
                <Rect width={W} height={H} fill={doc.background} onMouseDown={() => setSelected(null)} onTouchStart={() => setSelected(null)} />
                {geoms.map((g, i) => {
                  const p = doc.photos[i];
                  const b = g.box;
                  return (
                    <Group key={`${layout.id}-${i}`} clipFunc={(ctx) => g.trace(ctx)}>
                      {p ? (
                        <CellImage
                          photo={p}
                          box={b}
                          index={i}
                          onSelect={() => onCellTap(i)}
                          onMove={(dx, dy) => updatePhoto(i, { dx, dy })}
                        />
                      ) : (
                        <Group name="ui" onClick={() => onCellTap(i)} onTap={() => onCellTap(i)}>
                          <Rect {...b} fill={CANVAS_UI.placeholder} />
                          <Text
                            x={g.center.x - 60 / scale}
                            y={g.center.y - 18 / scale}
                            width={120 / scale}
                            align="center"
                            text={`+\nẢnh ${i + 1}`}
                            fontSize={18 / scale}
                            lineHeight={1.2}
                            fontStyle="bold"
                            fill={CANVAS_UI.placeholderText}
                          />
                        </Group>
                      )}
                    </Group>
                  );
                })}
                {/* Kiểu hiện đại: khoảng cách giữa các ô là viền màu nền vẽ đè lên mép ảnh */}
                {layout.styled &&
                  doc.gap > 0 &&
                  geoms.map((g, i) => (
                    <Shape
                      key={`gap-${layout.id}-${i}`}
                      sceneFunc={(ctx, shape) => {
                        g.trace(ctx);
                        ctx.strokeShape(shape);
                      }}
                      stroke={doc.background}
                      strokeWidth={doc.gap}
                      lineJoin="round"
                      listening={false}
                    />
                  ))}
                {geoms.map((g, i) =>
                  selCell === i || swapFrom !== null ? (
                    <Shape
                      key={`sel-${layout.id}-${i}`}
                      name="ui"
                      sceneFunc={(ctx, shape) => {
                        g.trace(ctx);
                        ctx.strokeShape(shape);
                      }}
                      stroke={selCell === i ? CANVAS_UI.accent : CANVAS_UI.swapTarget}
                      strokeWidth={3 / scale}
                      dash={swapFrom !== null && selCell !== i ? [8 / scale, 6 / scale] : undefined}
                      listening={false}
                    />
                  ) : null,
                )}
                {doc.texts.map((t) => (
                  <TextNode
                    key={t.id + fontsVersion}
                    el={t}
                    value={t.text}
                    interactive
                    onSelect={() => setSelected(t.id)}
                    onChange={(p) => updateText(t.id, p)}
                  />
                ))}
                <Transformer
                  ref={trRef}
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
                  anchorSize={14}
                  anchorCornerRadius={4}
                  borderStroke={CANVAS_UI.accent}
                  anchorStroke={CANVAS_UI.accent}
                />
              </Layer>
            </Stage>
          </div>
          <UndoRedoButtons canUndo={history.canUndo} canRedo={history.canRedo} onUndo={history.undo} onRedo={history.redo} />

          {swapFrom !== null && (
            <div className="banner info">
              <span>Chạm vào ô muốn đổi chỗ với ảnh {swapFrom + 1}.</span>
              <button className="btn sm" onClick={() => setSwapFrom(null)}>
                Huỷ
              </button>
            </div>
          )}

          <div className="layout-strip">
            {COLLAGE_COUNTS.map((n) => (
              <div key={n} className="layout-group">
                <span className="muted">{n} ảnh</span>
                <div className="layout-row">
                  {COLLAGE_LAYOUTS.filter((l) => l.cells.length === n).map((l) => (
                    <LayoutThumb
                      key={l.id}
                      layout={l}
                      active={l.id === layout.id}
                      onClick={() => {
                        setSelected(null);
                        setDoc((d) => ({ ...d, layoutId: l.id }));
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {extra > 0 && <p className="hint">Còn {extra} ảnh chưa có ô – chọn bố cục nhiều ô hơn để hiện thêm.</p>}

          {selPhoto && selCell !== null ? (
            <SettingsPanel title={`Ảnh ${selCell + 1}`} onClose={() => setSelected(null)}>
              <div className="seg tabs">
                {(
                  [
                    ['position', 'Vị trí'],
                    ['filter', 'Bộ lọc'],
                    ['adjust', 'Chỉnh sửa'],
                  ] as const
                ).map(([k, label]) => (
                  <button key={k} className={cellTab === k ? 'on' : ''} onClick={() => setCellTab(k)}>
                    {label}
                  </button>
                ))}
              </div>
              {cellTab === 'filter' ? (
                <FilterPicker
                  img={selPhoto.img}
                  adjust={selPhoto.adjust}
                  onChange={(patch, key) => updatePhoto(selCell, { adjust: { ...selPhoto.adjust, ...patch } }, key)}
                />
              ) : cellTab === 'adjust' ? (
                <AdjustSliders
                  img={selPhoto.img}
                  adjust={selPhoto.adjust}
                  onChange={(patch, key) => updatePhoto(selCell, { adjust: { ...selPhoto.adjust, ...patch } }, key)}
                />
              ) : (
                <>
                  <label className="field">
                    <span>Thu phóng (hoặc chụm 2 ngón tay)</span>
                    <input
                      type="range"
                      min={Math.log(0.3)}
                      max={Math.log(8)}
                      step={0.001}
                      value={Math.log(selPhoto.zoom)}
                      onChange={(e) => updatePhoto(selCell, { zoom: Math.exp(Number(e.target.value)) }, 'zoom')}
                    />
                  </label>
                  <label className="field">
                    <span>Xoay: {Math.round(selPhoto.rotation)}°</span>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={Math.round(selPhoto.rotation)}
                      onChange={(e) => updatePhoto(selCell, { rotation: Number(e.target.value) }, 'rotate')}
                    />
                  </label>
                  <div className="row wrap">
                    <button className="btn ghost sm" onClick={() => updatePhoto(selCell, { dx: 0, dy: 0, zoom: 1 })}>
                      <Icon name="maximize" /> Vừa ô
                    </button>
                    <button
                      className="btn ghost sm"
                      onClick={() => updatePhoto(selCell, { rotation: normalizeAngle(Math.round(selPhoto.rotation / 90) * 90 + 90), dx: 0, dy: 0, zoom: 1 })}
                    >
                      <Icon name="rotate" /> Xoay 90°
                    </button>
                    <button className="btn ghost sm" onClick={() => setSwapFrom(selCell)}>
                      <Icon name="swap" /> Đổi chỗ
                    </button>
                    <button className="btn ghost sm" onClick={() => pickForCell(selCell)}>
                      <Icon name="replace" /> Đổi ảnh
                    </button>
                    <button
                      className="btn danger sm"
                      onClick={() => {
                        setDoc((d) => ({ ...d, photos: d.photos.map((p, k) => (k === selCell ? null : p)) }));
                        setSelected(null);
                      }}
                    >
                      <Icon name="trash" /> Bỏ ảnh
                    </button>
                  </div>
                  <p className="hint">Kéo ảnh để chỉnh vị trí trong ô.</p>
                </>
              )}
            </SettingsPanel>
          ) : selText ? (
            <SettingsPanel title={selText.text || 'Chữ'} onClose={() => setSelected(null)}>
              <TextPropsPanel
                el={selText}
                canvasWidth={W}
                allowKind={false}
                onChange={(p) => updateText(selText.id, p, 'text:' + selText.id)}
                onDelete={() => {
                  setDoc((d) => ({ ...d, texts: d.texts.filter((t) => t.id !== selText.id) }));
                  setSelected(null);
                }}
              />
            </SettingsPanel>
          ) : (
            <p className="hint">Chạm vào một ô để chọn ảnh hoặc chỉnh ảnh trong ô đó. Đổi bố cục bất kỳ lúc nào ở trên – ảnh được giữ nguyên.</p>
          )}
        </div>

        <div className="side-col">
          {filled === 0 && (
            <button className="btn primary lg block" onClick={() => multiInput.current?.click()}>
              <Icon name="image" /> Chọn {layout.cells.length} ảnh
            </button>
          )}
          {loading > 0 && <p className="hint">Đang đọc {loading} ảnh…</p>}
          <div className="panel">
            <h3>Khung ghép</h3>
            <label className="field">
              <span>Tỉ lệ ảnh</span>
              <select value={doc.aspect} onChange={(e) => setDoc((d) => ({ ...d, aspect: e.target.value as AspectId }))}>
                {ASPECTS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} ({a.w}×{a.h})
                  </option>
                ))}
              </select>
            </label>
            {(
              [
                ['gap', 'Khoảng cách giữa ảnh', 60],
                ['padding', 'Lề ngoài', 80],
                ['radius', 'Bo góc', 80],
              ] as const
            ).map(([key, label, max]) => (
              <label key={key} className="field">
                <span className="slider-label">
                  {label}
                  <b>{doc[key]}px</b>
                </span>
                <input type="range" min={0} max={max} value={doc[key]} onChange={(e) => setDoc((d) => ({ ...d, [key]: Number(e.target.value) }), key)} />
              </label>
            ))}
            <div className="row">
              <label className="field color">
                <span>Màu nền</span>
                <input type="color" value={doc.background} onChange={(e) => setDoc((d) => ({ ...d, background: e.target.value }), 'bg')} />
              </label>
              <button className="btn" onClick={addText}>
                <Icon name="plus" /> Thêm chữ
              </button>
            </div>
            <label className="field inline">
              <span>Định dạng</span>
              <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
                <option value="image/jpeg">JPG (nhẹ)</option>
                <option value="image/png">PNG (nét nhất)</option>
              </select>
            </label>
          </div>
          <button className="btn primary lg block" disabled={filled === 0 || busy} onClick={exportImage}>
            {busy ? 'Đang xuất…' : <><Icon name="download" /> Xuất ảnh</>}
          </button>
          {filled > 0 && filled < layout.cells.length && (
            <p className="hint center-text">Còn {layout.cells.length - filled} ô trống – ô trống sẽ hiện màu nền.</p>
          )}
        </div>
      </div>

      <input
        ref={multiInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addPhotos(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={cellInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (targetCell.current !== null) setCellPhoto(targetCell.current, e.target.files?.[0]);
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
                  ? 'Đã lưu vào lịch sử.'
                  : 'Không lưu được lịch sử.'
          }
          onClose={() => setResult(null)}
        />
      )}
    </div>
  );
}
