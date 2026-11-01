import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FilterPicker } from '../components/PhotoAdjustPanels';
import { backend } from '../lib/backend';
import { useUser } from '../lib/auth';
import { defaultValues, ensureFonts, renderComposite } from '../lib/compose';
import { newId } from '../lib/id';
import { blobToImage, canvasToBlob, makeThumbnail, prepareImageFile } from '../lib/image';
import { DEFAULT_ADJUST, autoBeautify, type PhotoAdjust } from '../lib/photoFilters';
import { canShareFiles, downloadBlob, safeFileName, shareBlobs } from '../lib/share';
import { createZip } from '../lib/zip';
import type { Template } from '../types';

interface Item {
  id: string;
  /** Tên file không có phần mở rộng – dùng để tự điền mã sản phẩm */
  name: string;
  img: HTMLImageElement;
  /** Giá trị riêng của ảnh này (cho các ô "mỗi ảnh một giá trị") */
  values: Record<string, string>;
  fit: 'cover' | 'contain';
  rotation: number;
  preview?: string;
  result?: { blob: Blob; url: string; filename: string };
  error?: string;
}

/** Ô nhập nào nên khác nhau giữa các ảnh: mã/SKU – lấy từ tên file */
const isCodeLabel = (label: string) => /mã|ma sp|code|sku/i.test(label);

export default function BatchPage() {
  const { id } = useParams();
  const user = useUser();
  const [tpl, setTpl] = useState<Template | null>(null);
  const [frameImg, setFrameImg] = useState<HTMLImageElement | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [shared, setShared] = useState<Record<string, string>>({});
  const [perImage, setPerImage] = useState<string[]>([]);
  const [fit, setFit] = useState<'cover' | 'contain'>('cover');
  const [adjust, setAdjust] = useState<PhotoAdjust>(DEFAULT_ADJUST);
  const [beautify, setBeautify] = useState(false);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [loadingFiles, setLoadingFiles] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await backend.getTemplate(user.uid, id!);
        if (!t) throw new Error('Không tìm thấy khung mẫu');
        await ensureFonts(t.texts);
        const img = t.frame ? await blobToImage(await backend.getBlob(user.uid, t.frame.blobId)) : null;
        if (!alive) return;
        setTpl(t);
        setFrameImg(img);
        setShared(defaultValues(t.texts));
        const labels = Object.keys(defaultValues(t.texts));
        setPerImage(labels.filter(isCodeLabel));
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, user.uid]);

  const labels = useMemo(() => (tpl ? Object.keys(defaultValues(tpl.texts)) : []), [tpl]);
  const valuesOf = (it: Item) => {
    const v = { ...shared };
    for (const l of perImage) v[l] = it.values[l] ?? '';
    return v;
  };
  const adjustOf = (it: Item) => (beautify ? autoBeautify(it.img, adjust) : adjust);

  // Ảnh xem trước nhỏ: vẽ lại lần lượt khi thông tin thay đổi (ngắt quãng để giao diện không bị đứng)
  const previewKey = JSON.stringify([shared, perImage, fit, adjust, beautify, items.map((i) => [i.id, i.values, i.fit, i.rotation])]);
  useEffect(() => {
    if (!tpl) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      for (const it of items) {
        if (cancelled) return;
        const url = makeThumbnail(
          renderComposite({ tpl, frameImg, photo: it.img, fit: it.fit, rotation: it.rotation, adjust: adjustOf(it), values: valuesOf(it), maxSide: 420 }),
          420,
        );
        if (cancelled) return;
        setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, preview: url, result: undefined } : x)));
        await new Promise((r) => setTimeout(r, 0));
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [previewKey, tpl, frameImg]);

  if (error && !tpl) return <div className="page"><p className="error">{error}</p></div>;
  if (!tpl) return <div className="page center"><div className="spinner" /></div>;

  async function addFiles(files: FileList | null) {
    if (!files?.length || !tpl) return;
    const list = Array.from(files);
    setLoadingFiles(list.length);
    // Chỉ giữ độ phân giải đủ dùng cho vùng ảnh của khung – tiết kiệm bộ nhớ khi chọn nhiều ảnh
    const maxSide = Math.min(3000, Math.ceil(Math.max(tpl.photoSlot.width, tpl.photoSlot.height) * 1.6));
    for (const f of list) {
      try {
        const { img } = await prepareImageFile(f, maxSide, false);
        const name = f.name.replace(/\.[^.]+$/, '');
        const values: Record<string, string> = {};
        for (const l of labels) values[l] = isCodeLabel(l) ? name : shared[l] ?? '';
        setItems((xs) => [...xs, { id: newId(), name, img, values, fit: 'cover', rotation: 0 }]);
      } catch {
        setError(`Không đọc được ảnh "${f.name}"`);
      }
      setLoadingFiles((n) => n - 1);
    }
  }

  const updateItem = (itemId: string, patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === itemId ? { ...x, ...patch } : x)));

  function togglePerImage(label: string, on: boolean) {
    setPerImage((ls) => (on ? [...ls, label] : ls.filter((l) => l !== label)));
    if (on) {
      // Bật "mỗi ảnh một giá trị": điền sẵn từ tên file (với mã) hoặc giá trị chung
      setItems((xs) => xs.map((x) => ({ ...x, values: { ...x.values, [label]: x.values[label] ?? (isCodeLabel(label) ? x.name : shared[label]) } })));
    }
  }

  async function generateAll() {
    if (!tpl || !items.length) return;
    setError('');
    setNotice('');
    setProgress({ done: 0, total: items.length });
    let saved = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      try {
        const canvas = renderComposite({ tpl, frameImg, photo: it.img, fit: it.fit, rotation: it.rotation, adjust: adjustOf(it), values: valuesOf(it) });
        const blob = await canvasToBlob(canvas, format, format === 'image/jpeg' ? 0.92 : undefined);
        const code = Object.values(valuesOf(it)).filter(Boolean)[0] || it.name;
        const filename = `${String(i + 1).padStart(2, '0')}-${safeFileName(perImage.length ? valuesOf(it)[perImage[0]] || it.name : code)}.${format === 'image/png' ? 'png' : 'jpg'}`;
        const url = URL.createObjectURL(blob);
        updateItem(it.id, { result: { blob, url, filename }, error: undefined });
        try {
          const resultBlobId = await backend.putBlob(user.uid, blob);
          await backend.addHistory(user.uid, {
            id: newId(),
            templateId: tpl.id,
            templateName: tpl.name,
            inputs: valuesOf(it),
            thumbnail: makeThumbnail(canvas),
            resultBlobId,
            mime: format,
            width: canvas.width,
            height: canvas.height,
            createdAt: Date.now(),
          });
          saved++;
        } catch {
          // Lỗi lưu lịch sử không chặn việc tạo ảnh
        }
      } catch (e) {
        updateItem(it.id, { error: (e as Error).message });
      }
      setProgress({ done: i + 1, total: items.length });
      await new Promise((r) => setTimeout(r, 0));
    }
    setNotice(`✓ Đã tạo ${items.length} ảnh${saved === items.length ? ' và lưu vào lịch sử' : ` (lưu lịch sử ${saved}/${items.length})`}.`);
    setTimeout(() => document.getElementById('batch-results')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  const results = items.filter((i) => i.result).map((i) => i.result!);
  const busy = !!progress && progress.done < progress.total;

  async function shareAll() {
    try {
      const ok = await shareBlobs(results.map((r) => ({ blob: r.blob, name: r.filename })));
      if (!ok) setError('Thiết bị không hỗ trợ chia sẻ nhiều ảnh – hãy dùng "Tải tất cả (.zip)".');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function downloadZip() {
    const zip = await createZip(results.map((r) => ({ name: r.filename, blob: r.blob })));
    downloadBlob(zip, `${safeFileName(tpl!.name)}-${results.length}-anh.zip`);
  }

  return (
    <div className="page">
      <div className="toolbar">
        <h1 className="grow ellipsis">📚 Tạo hàng loạt · {tpl.name}</h1>
        <Link className="btn ghost sm" to={`/compose/${tpl.id}`}>
          Tạo từng ảnh
        </Link>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="layout">
        <div className="canvas-col">
          <div className="panel">
            <div className="row wrap">
              <button className="btn primary lg grow" onClick={() => fileInput.current?.click()} disabled={busy}>
                🖼️ {items.length ? 'Thêm ảnh' : 'Chọn nhiều ảnh'}
              </button>
              {items.length > 0 && (
                <button className="btn ghost" disabled={busy} onClick={() => confirm('Bỏ tất cả ảnh đã chọn?') && setItems([])}>
                  Bỏ tất cả
                </button>
              )}
            </div>
            {loadingFiles > 0 && <p className="hint">Đang đọc {loadingFiles} ảnh…</p>}
            {!items.length && (
              <p className="hint">
                Chọn nhiều ảnh cùng lúc từ thư viện ảnh / bộ nhớ. Mỗi ảnh sẽ được chèn vào khung “{tpl.name}”. Mẹo: đặt tên file ảnh
                theo mã sản phẩm (vd <b>AC-989VN.jpg</b>) để mã được điền tự động.
              </p>
            )}
          </div>

          {items.length > 0 && (
            <div className="batch-list">
              {items.map((it, idx) => (
                <div key={it.id} className={it.error ? 'batch-item error-item' : 'batch-item'}>
                  <div className="batch-thumb">
                    {it.preview ? <img src={it.preview} alt="" /> : <span className="spinner small" />}
                    <span className="batch-index">{idx + 1}</span>
                    {it.result && <span className="batch-done">✓</span>}
                  </div>
                  <div className="batch-fields">
                    <small className="muted ellipsis">{it.name}</small>
                    {perImage.map((l) => (
                      <label key={l} className="field">
                        <span>{l}</span>
                        <input value={it.values[l] ?? ''} onChange={(e) => updateItem(it.id, { values: { ...it.values, [l]: e.target.value } })} />
                      </label>
                    ))}
                    <div className="row wrap">
                      <div className="seg small">
                        <button className={it.fit === 'cover' ? 'on' : ''} onClick={() => updateItem(it.id, { fit: 'cover' })}>
                          Lấp đầy
                        </button>
                        <button className={it.fit === 'contain' ? 'on' : ''} onClick={() => updateItem(it.id, { fit: 'contain' })}>
                          Toàn bộ
                        </button>
                      </div>
                      <button className="btn ghost sm" title="Xoay 90°" onClick={() => updateItem(it.id, { rotation: (it.rotation + 90) % 360 })}>
                        ⟳
                      </button>
                      <button
                        className="btn ghost sm"
                        title="Bỏ ảnh này"
                        disabled={busy}
                        onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}
                      >
                        🗑
                      </button>
                    </div>
                    {it.error && <small className="error">{it.error}</small>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="side-col">
          {labels.length > 0 && (
            <div className="panel">
              <h3>Thông tin trên ảnh</h3>
              <p className="hint">Điền một lần cho tất cả ảnh, hoặc đánh dấu “mỗi ảnh khác nhau” để nhập riêng từng ảnh.</p>
              {labels.map((l) => (
                <div key={l} className="field">
                  <span className="slider-label">
                    {l}
                    <label className="check inline-check">
                      <input type="checkbox" checked={perImage.includes(l)} onChange={(e) => togglePerImage(l, e.target.checked)} />
                      mỗi ảnh khác nhau
                    </label>
                  </span>
                  {perImage.includes(l) ? (
                    <button
                      className="btn ghost sm"
                      onClick={() => setItems((xs) => xs.map((x) => ({ ...x, values: { ...x.values, [l]: x.name } })))}
                    >
                      Điền từ tên file ảnh
                    </button>
                  ) : (
                    <input value={shared[l] ?? ''} onChange={(e) => setShared((v) => ({ ...v, [l]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="panel">
            <h3>Áp dụng cho tất cả ảnh</h3>
            <div className="seg tabs">
              <button className={fit === 'cover' ? 'on' : ''} onClick={() => { setFit('cover'); setItems((xs) => xs.map((x) => ({ ...x, fit: 'cover' }))); }}>
                ⛶ Lấp đầy khung
              </button>
              <button className={fit === 'contain' ? 'on' : ''} onClick={() => { setFit('contain'); setItems((xs) => xs.map((x) => ({ ...x, fit: 'contain' }))); }}>
                ▣ Hiện toàn bộ ảnh
              </button>
            </div>
            <label className="check">
              <input type="checkbox" checked={beautify} onChange={(e) => setBeautify(e.target.checked)} />
              ✨ Làm đẹp tự động từng ảnh
            </label>
            {items[0] && (
              <>
                <span className="muted small-label">Bộ lọc</span>
                <FilterPicker img={items[0].img} adjust={adjust} onChange={(p) => setAdjust((a) => ({ ...a, ...p }))} />
              </>
            )}
            <label className="field inline">
              <span>Định dạng</span>
              <select value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
                <option value="image/jpeg">JPG (nhẹ)</option>
                <option value="image/png">PNG (nét nhất)</option>
              </select>
            </label>
          </div>

          <button className="btn primary lg block" disabled={!items.length || busy || loadingFiles > 0} onClick={generateAll}>
            {busy ? `Đang tạo ${progress!.done}/${progress!.total}…` : `⚡ Tạo ${items.length || ''} ảnh`}
          </button>
          {progress && (
            <div className="progress">
              <div style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          )}
          {notice && <p className="hint">{notice}</p>}
        </div>
      </div>

      {results.length > 0 && !busy && (
        <section id="batch-results" className="panel batch-results">
          <h2>Kết quả ({results.length} ảnh)</h2>
          <div className="row wrap">
            {canShareFiles() && (
              <button className="btn primary" onClick={shareAll}>
                📲 Lưu tất cả vào Ảnh / Chia sẻ
              </button>
            )}
            <button className={canShareFiles() ? 'btn' : 'btn primary'} onClick={downloadZip}>
              ⬇️ Tải tất cả (.zip)
            </button>
          </div>
          <div className="grid">
            {results.map((r) => (
              <div key={r.url} className="tpl-card">
                <img className="result-thumb" src={r.url} alt={r.filename} />
                <div className="tpl-actions">
                  <small className="muted ellipsis grow">{r.filename}</small>
                  <button className="btn ghost sm" title="Tải ảnh này" onClick={() => downloadBlob(r.blob, r.filename)}>
                    ⬇️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
