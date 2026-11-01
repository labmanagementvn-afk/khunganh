import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResultModal } from '../components/ResultModal';
import { backend } from '../lib/backend';
import { useUser } from '../lib/auth';
import { safeFileName } from '../lib/share';
import type { HistoryEntry } from '../types';

export default function HistoryPage() {
  const user = useUser();
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<{ entry: HistoryEntry; blob: Blob } | null>(null);
  const [loadingId, setLoadingId] = useState('');

  useEffect(() => {
    backend
      .listHistory(user.uid)
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [user.uid]);

  async function view(entry: HistoryEntry) {
    setLoadingId(entry.id);
    try {
      setOpen({ entry, blob: await backend.getBlob(user.uid, entry.resultBlobId) });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingId('');
    }
  }

  async function remove(entry: HistoryEntry) {
    if (!confirm('Xoá ảnh này khỏi lịch sử?')) return;
    await backend.deleteHistory(user.uid, entry.id);
    backend.deleteBlob(user.uid, entry.resultBlobId).catch(() => {});
    setItems((xs) => xs?.filter((x) => x.id !== entry.id) ?? null);
    setOpen(null);
  }

  const describe = (e: HistoryEntry) =>
    Object.entries(e.inputs)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');

  return (
    <div className="page">
      <div className="toolbar">
        <h1 className="grow">Lịch sử tạo ảnh</h1>
      </div>
      {error && <p className="error">{error}</p>}
      {!items && !error && <div className="center"><div className="spinner" /></div>}
      {items && items.length === 0 && (
        <div className="card empty">
          <p className="muted">Chưa có ảnh nào. Ảnh bạn xuất sẽ được lưu tại đây.</p>
          <Link to="/" className="btn primary">Chọn khung để tạo ảnh</Link>
        </div>
      )}
      <div className="history">
        {items?.map((e) => (
          <div key={e.id} className="history-item">
            <button className="history-thumb" onClick={() => view(e)}>
              <img src={e.thumbnail} alt="" />
              {loadingId === e.id && <span className="spinner small" />}
            </button>
            <div className="history-info" onClick={() => view(e)}>
              <strong className="ellipsis">{describe(e) || e.templateName}</strong>
              <small className="muted">
                {e.templateName} · {new Date(e.createdAt).toLocaleString('vi-VN')}
              </small>
            </div>
            <div className="history-actions">
              <Link className="btn ghost sm" to={`/compose/${e.templateId}`} title="Dùng lại khung">
                ↻
              </Link>
              <button className="btn ghost sm" onClick={() => remove(e)} title="Xoá">
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <ResultModal
          blob={open.blob}
          filename={`${safeFileName(Object.values(open.entry.inputs).filter(Boolean).join('_') || open.entry.templateName)}.${
            open.entry.mime === 'image/png' ? 'png' : 'jpg'
          }`}
          status={`${open.entry.templateName} · ${new Date(open.entry.createdAt).toLocaleString('vi-VN')}`}
          onClose={() => setOpen(null)}
          extraAction={
            <button className="btn danger" onClick={() => remove(open.entry)}>
              🗑 Xoá
            </button>
          }
        />
      )}
    </div>
  );
}
