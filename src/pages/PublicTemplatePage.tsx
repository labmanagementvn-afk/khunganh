import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { OwnerBadge } from '../components/PublicCard';
import { LinkBox } from '../components/ShareTemplateModal';
import { useSession } from '../lib/auth';
import { copyPublicTemplate, publicUrl } from '../lib/publicTemplates';
import type { PublicTemplate } from '../types';

/** Trang mở từ link chia sẻ: xem trước mẫu và dùng ngay */
export default function PublicTemplatePage() {
  const { id } = useParams();
  const { uid, store, pub, guest } = useSession();
  const navigate = useNavigate();
  const [p, setP] = useState<PublicTemplate | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    pub
      .getPublic(id!)
      .then(setP)
      .catch((e) => setError((e as Error).message));
  }, [id, pub]);

  async function use() {
    if (!p) return;
    setBusy(true);
    setError('');
    try {
      const tpl = await copyPublicTemplate(store, pub, uid, p, !guest);
      navigate(`/compose/${tpl.id}?new=1`);
    } catch (e) {
      setError('Không mở được mẫu: ' + (e as Error).message);
      setBusy(false);
    }
  }

  if (error && p === undefined) return <div className="page"><p className="error">{error}</p></div>;
  if (p === undefined) return <div className="page center"><div className="spinner" /></div>;
  if (p === null) {
    return (
      <div className="page narrow">
        <div className="card empty">
          <Icon name="alert" size={28} />
          <h3>Mẫu không còn được chia sẻ</h3>
          <p className="muted">Chủ mẫu có thể đã ngừng chia sẻ. Xem các mẫu khác trên Bảng tin.</p>
          <Link to="/feed" className="btn primary">
            Mở Bảng tin
          </Link>
        </div>
      </div>
    );
  }

  const inputs = Array.from(new Set(p.texts.filter((t) => t.kind === 'input').map((t) => t.label || 'Text nhập')));

  return (
    <div className="page narrow public-page">
      <Link to="/feed" className="back-link">
        <Icon name="arrowLeft" size={16} /> Bảng tin
      </Link>
      <div className="public-preview">{p.thumbnail ? <img src={p.thumbnail} alt={p.name} /> : <Icon name="image" size={40} />}</div>
      <h1>{p.name}</h1>
      <div className="public-meta muted">
        <OwnerBadge name={p.ownerName} photo={p.ownerPhoto} />
        {p.category && (
          <Link to={`/feed?nganh=${encodeURIComponent(p.category)}`} className="category-link">
            {p.category}
          </Link>
        )}
        <span>
          {p.width}×{p.height}
        </span>
        {p.uses > 0 && <span>{p.uses} lượt dùng</span>}
      </div>
      {inputs.length > 0 && (
        <p className="muted small-text">
          Ô nhập: {inputs.join(', ')}
        </p>
      )}
      {error && <p className="error">{error}</p>}
      <button className="btn primary lg block" onClick={use} disabled={busy}>
        {busy ? 'Đang mở…' : 'Dùng mẫu này'}
      </button>
      {guest && <p className="hint center-text">Không cần đăng nhập – mẫu được lưu trên máy này để bạn dùng lại.</p>}
      <h3 className="mt">Chia sẻ mẫu này</h3>
      <LinkBox url={publicUrl(p.id)} title={p.name} />
    </div>
  );
}
