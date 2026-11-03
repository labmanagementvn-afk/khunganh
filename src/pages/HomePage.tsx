import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';
import { PresetGallery } from '../components/PresetGallery';
import { ShareTemplateModal } from '../components/ShareTemplateModal';
import { useSession } from '../lib/auth';
import { COLLAGE_COUNTS, firstLayoutFor } from '../lib/collageLayouts';
import type { Template } from '../types';

function ActionTile({ icon, title, text, onClick, to }: { icon: IconName; title: string; text: string; onClick?: () => void; to?: string }) {
  const body = (
    <>
      <span className="action-icon">
        <Icon name={icon} size={22} />
      </span>
      <strong>{title}</strong>
      <small>{text}</small>
    </>
  );
  return to ? (
    <Link to={to} className="action-tile">
      {body}
    </Link>
  ) : (
    <button className="action-tile" onClick={onClick}>
      {body}
    </button>
  );
}

export default function HomePage() {
  const { uid, store, guest } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState<Template[] | null>(null);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState<Template | null>(null);

  useEffect(() => {
    store
      .listTemplates(uid)
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [uid, store]);

  async function remove(t: Template) {
    if (!confirm(`Xoá khung "${t.name}"?`)) return;
    await store.deleteTemplate(uid, t.id);
    if (t.frame?.blobId) store.deleteBlob(uid, t.frame.blobId).catch(() => {});
    setItems((xs) => xs?.filter((x) => x.id !== t.id) ?? null);
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="page home">
      <section className="intro">
        <h1>Ảnh sản phẩm đẹp trong vài giây</h1>
        <p className="muted">Chọn khung, thêm ảnh và mã sản phẩm – xuất ảnh và lưu thẳng vào điện thoại.</p>
        <div className="action-grid">
          <ActionTile icon="frame" title="Dùng khung mẫu" text="80 mẫu cho mọi ngành hàng" onClick={() => scrollTo('presets')} />
          <ActionTile icon="grid" title="Ghép ảnh" text="2–6 ảnh, nhiều bố cục" to="/collage" />
          <ActionTile icon="video" title="Video có khung" text="Chèn khung, chữ, logo vào video" to="/video" />
          <ActionTile icon="plus" title="Tự tạo khung" text="Tải khung của riêng bạn" to="/templates/new" />
        </div>
      </section>

      {guest && (
        <p className="notice">
          <Icon name="user" size={16} />
          <span>
            Đang dùng không đăng nhập – ảnh không được lưu lịch sử. <Link to="/login">Đăng nhập</Link> để lưu và dùng trên mọi thiết bị.
          </span>
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {items && items.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Khung của tôi</h2>
            <Link to="/templates/new" className="btn ghost sm">
              <Icon name="plus" /> Tạo mới
            </Link>
          </div>
          <div className="hscroll">
            {items.map((t) => (
              <div key={t.id} className="tpl-card mine">
                <button className="tpl-thumb" onClick={() => navigate(`/compose/${t.id}`)} title="Dùng khung này">
                  {t.thumbnail ? <img src={t.thumbnail} alt={t.name} /> : <Icon name="image" size={28} />}
                  {t.publicId && (
                    <span className="public-badge" title="Đang chia sẻ công khai">
                      <Icon name="globe" size={13} /> Công khai
                    </span>
                  )}
                </button>
                <div className="tpl-info">
                  <strong className="ellipsis">{t.name}</strong>
                  <small className="muted">
                    {t.width}×{t.height} · {t.texts.filter((x) => x.kind === 'input').length} ô nhập
                  </small>
                </div>
                <div className="tpl-actions mine-actions">
                  <Link className="btn primary sm use-btn" to={`/compose/${t.id}`}>
                    Dùng khung
                  </Link>
                  <div className="icon-row">
                    <button className="icon-btn" onClick={() => setSharing(t)} title="Chia sẻ" aria-label="Chia sẻ">
                      <Icon name="share" />
                    </button>
                    <Link className="icon-btn" to={`/batch/${t.id}`} title="Tạo hàng loạt từ nhiều ảnh" aria-label="Tạo hàng loạt">
                      <Icon name="layers" />
                    </Link>
                    <Link className="icon-btn" to={`/templates/${t.id}/edit`} title="Sửa khung" aria-label="Sửa khung">
                      <Icon name="edit" />
                    </Link>
                    <button className="icon-btn" onClick={() => remove(t)} title="Xoá khung" aria-label="Xoá khung">
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2>Ghép nhiều ảnh</h2>
          <Link to="/collage" className="btn ghost sm">
            Tất cả bố cục <Icon name="arrowRight" />
          </Link>
        </div>
        <div className="collage-counts">
          {COLLAGE_COUNTS.map((n) => (
            <Link key={n} to={`/collage?n=${n}`} className="collage-count">
              <svg viewBox="0 0 40 50" width="34" height="42" aria-hidden>
                {firstLayoutFor(n).cells.map(([x, y, w, h], i) => (
                  <rect key={i} x={x * 40 + 1} y={y * 50 + 1} width={w * 40 - 2} height={h * 50 - 2} rx="2" />
                ))}
              </svg>
              {n} ảnh
            </Link>
          ))}
        </div>
      </section>

      <PresetGallery />
      {sharing && (
        <ShareTemplateModal
          template={sharing}
          onClose={() => setSharing(null)}
          onChanged={(t) => setItems((xs) => xs?.map((x) => (x.id === t.id ? t : x)) ?? null)}
        />
      )}
    </div>
  );
}
