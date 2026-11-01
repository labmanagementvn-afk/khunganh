import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PresetGallery } from '../components/PresetGallery';
import { backend } from '../lib/backend';
import { useUser } from '../lib/auth';
import type { Template } from '../types';

export default function HomePage() {
  const user = useUser();
  const navigate = useNavigate();
  const [items, setItems] = useState<Template[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    backend
      .listTemplates(user.uid)
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [user.uid]);

  async function remove(t: Template) {
    if (!confirm(`Xoá khung "${t.name}"?`)) return;
    await backend.deleteTemplate(user.uid, t.id);
    if (t.frame?.blobId) backend.deleteBlob(user.uid, t.frame.blobId).catch(() => {});
    setItems((xs) => xs?.filter((x) => x.id !== t.id) ?? null);
  }

  return (
    <div className="page">
      <div className="toolbar">
        <h1 className="grow">Khung mẫu của tôi</h1>
        <Link to="/templates/new" className="btn primary">
          ＋ Tạo khung mới
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {!items && !error && <div className="center"><div className="spinner" /></div>}
      {items && items.length === 0 && (
        <div className="card empty">
          <h3>Chưa có khung mẫu nào</h3>
          <p className="muted">
            Chọn một mẫu có sẵn bên dưới, hoặc tự tạo khung: tải ảnh khung, đặt vùng ảnh sản phẩm, thêm chữ "Mã sản phẩm" và ô
            nhập mã.
          </p>
          <Link to="/templates/new" className="btn lg">
            ＋ Tự tạo khung
          </Link>
        </div>
      )}
      <div className="grid">
        {items?.map((t) => (
          <div key={t.id} className="tpl-card">
            <button className="tpl-thumb" onClick={() => navigate(`/compose/${t.id}`)} title="Dùng khung này">
              {t.thumbnail ? <img src={t.thumbnail} alt={t.name} /> : <span>🖼️</span>}
            </button>
            <div className="tpl-info">
              <strong className="ellipsis">{t.name}</strong>
              <small className="muted">
                {t.width}×{t.height} · {t.texts.filter((x) => x.kind === 'input').length} ô nhập
              </small>
            </div>
            <div className="tpl-actions">
              <Link className="btn primary sm grow" to={`/compose/${t.id}`}>
                Dùng khung
              </Link>
              <Link className="btn ghost sm" to={`/batch/${t.id}`} title="Tạo hàng loạt từ nhiều ảnh">
                📚
              </Link>
              <Link className="btn ghost sm" to={`/templates/${t.id}/edit`} title="Sửa">
                ✎
              </Link>
              <button className="btn ghost sm" onClick={() => remove(t)} title="Xoá">
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
      <PresetGallery />
    </div>
  );
}
