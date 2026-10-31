import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Image as KImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import { Link, useParams } from 'react-router-dom';
import { ResultModal } from '../components/ResultModal';
import { TextNode, createTextElement } from '../components/TextNode';
import { TextPropsPanel } from '../components/TextPropsPanel';
import { useFitScale } from '../components/useFitScale';
import { backend } from '../lib/backend';
import { useUser } from '../lib/auth';
import { useFontsReady } from '../lib/fonts';
import { slotClip } from '../lib/geometry';
import { newId } from '../lib/id';
import { blobToImage, canvasToBlob, makeThumbnail, prepareImageFile } from '../lib/image';
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
}

function fitScale(img: HTMLImageElement, rotation: number, w: number, h: number, mode: 'cover' | 'contain') {
  const rotated = rotation % 180 !== 0;
  const iw = rotated ? img.naturalHeight : img.naturalWidth;
  const ih = rotated ? img.naturalWidth : img.naturalHeight;
  return mode === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
}

const labelOf = (t: TextElement) => (t.label || 'Text nhập').trim();

export default function ComposePage() {
  const { id } = useParams();
  const user = useUser();

  const [tpl, setTpl] = useState<Template | null>(null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const [photo, setPhoto] = useState<PhotoState | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [extras, setExtras] = useState<TextElement[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ blob: Blob; name: string; saved: 'saving' | 'saved' | 'error' } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);

  const scale = useFitScale(wrapRef, tpl?.width ?? 1, tpl?.height ?? 1, 0.58);
  const fontsVersion = useFontsReady([...(tpl?.texts ?? []), ...extras].map((t) => t.fontFamily));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await backend.getTemplate(user.uid, id!);
        if (!t) throw new Error('Không tìm thấy khung mẫu');
        if (!alive) return;
        setTpl(t);
        const init: Record<string, string> = {};
        t.texts.filter((x) => x.kind === 'input').forEach((x) => (init[labelOf(x)] ??= ''));
        setValues(init);
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
  }, [id, user.uid]);

  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selected ? stage.findOne('#' + selected) : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selected, extras, fontsVersion]);

  const inputLabels = useMemo(
    () => Array.from(new Set((tpl?.texts ?? []).filter((t) => t.kind === 'input').map(labelOf))),
    [tpl],
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
      });
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
    });
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

  function rotate() {
    setPhoto((p) => {
      if (!p) return p;
      const rotation = (p.rotation + 90) % 360;
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
    const last = pinch.current;
    pinch.current = { dist, cx, cy };
    if (!last) return;
    setPhoto((p) => {
      if (!p) return p;
      const s = Math.min(maxZoom, Math.max(minZoom, p.scale * (dist / last.dist)));
      const k = s / p.scale;
      return {
        ...p,
        scale: s,
        // Phóng to quanh tâm 2 ngón tay và di chuyển theo ngón tay
        cx: cx + (p.cx - last.cx) * k,
        cy: cy + (p.cy - last.cy) * k,
      };
    });
  }

  function addExtraText() {
    const el = createTextElement('fixed', tpl!.width, tpl!.height, newId());
    el.text = 'Nhập chữ…';
    el.y = Math.round(tpl!.height * 0.05);
    setExtras((x) => [...x, el]);
    setSelected(el.id);
  }

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
      stage.draw();
      const canvas = stage.toCanvas({ pixelRatio: tpl.width / stage.width() });
      stage.findOne('#slot-hint')?.show();
      const blob = await canvasToBlob(canvas, format, format === 'image/jpeg' ? 0.92 : undefined);
      const code = Object.values(values).filter(Boolean).join('_');
      const name = `${safeFileName(code || tpl.name)}-${Date.now().toString(36)}.${format === 'image/png' ? 'png' : 'jpg'}`;
      setResult({ blob, name, saved: 'saving' });

      // Lưu lịch sử (chạy nền)
      const thumbnail = makeThumbnail(canvas);
      backend
        .putBlob(user.uid, blob)
        .then((resultBlobId) =>
          backend.addHistory(user.uid, {
            id: newId(),
            templateId: tpl.id,
            templateName: tpl.name,
            inputs: values,
            thumbnail,
            resultBlobId,
            mime: format,
            width: canvas.width,
            height: canvas.height,
            createdAt: Date.now(),
          }),
        )
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
    setPhoto(null);
    setValues((v) => Object.fromEntries(Object.keys(v).map((k) => [k, ''])));
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
          image={photo.img}
          x={photo.cx}
          y={photo.cy}
          offsetX={photo.img.naturalWidth / 2}
          offsetY={photo.img.naturalHeight / 2}
          scaleX={photo.scale}
          scaleY={photo.scale}
          rotation={photo.rotation}
          draggable
          onMouseDown={() => setSelected(null)}
          onTouchStart={() => setSelected(null)}
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

  return (
    <div className="page editor">
      <div className="toolbar">
        <h1 className="grow ellipsis">{tpl.name}</h1>
        <Link className="btn ghost sm" to={`/templates/${tpl.id}/edit`}>
          ✎ Sửa khung
        </Link>
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
                {tpl.texts.map((t) => (
                  <TextNode key={t.id + fontsVersion} el={t} value={displayValue(t)} interactive={false} />
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
                  enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
                  anchorSize={14}
                  anchorCornerRadius={4}
                  borderStroke="#4f46e5"
                  anchorStroke="#4f46e5"
                />
              </Layer>
            </Stage>
          </div>

          {photo && (
            <div className="panel">
              <label className="field">
                <span>Thu phóng ảnh (hoặc dùng 2 ngón tay / con lăn chuột)</span>
                <input
                  type="range"
                  min={Math.log(minZoom)}
                  max={Math.log(maxZoom)}
                  step={0.001}
                  value={Math.log(photo.scale)}
                  onChange={(e) => setZoom(Math.exp(Number(e.target.value)))}
                />
              </label>
              <div className="row wrap">
                <button className="btn ghost sm" onClick={() => fit('cover')}>⛶ Lấp đầy</button>
                <button className="btn ghost sm" onClick={() => fit('contain')}>▣ Hiện toàn bộ</button>
                <button className="btn ghost sm" onClick={rotate}>⟳ Xoay 90°</button>
                <button className="btn ghost sm" onClick={() => fileInput.current?.click()}>🔁 Đổi ảnh</button>
              </div>
              <p className="hint">Kéo ảnh để di chuyển vị trí trong khung.</p>
            </div>
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
                    placeholder={tpl.texts.find((t) => t.kind === 'input' && labelOf(t) === label)?.text || label}
                    onChange={(e) => setValues((v) => ({ ...v, [label]: e.target.value }))}
                    autoCapitalize="characters"
                  />
                </label>
              ))}
            </div>
          )}

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
            {selExtra && (
              <TextPropsPanel
                el={selExtra}
                canvasWidth={tpl.width}
                allowKind={false}
                onChange={(p) => setExtras((xs) => xs.map((x) => (x.id === selExtra.id ? { ...x, ...p } : x)))}
                onDelete={() => {
                  setExtras((xs) => xs.filter((x) => x.id !== selExtra.id));
                  setSelected(null);
                }}
              />
            )}
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
            result.saved === 'saving'
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
