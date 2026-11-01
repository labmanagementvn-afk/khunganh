import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { PublicCard } from '../components/PublicCard';
import { useSession } from '../lib/auth';
import { copyPublicTemplate } from '../lib/publicTemplates';
import type { PublicTemplate } from '../types';

const PAGE = 24;

/** Bảng tin: các mẫu mọi người chia sẻ công khai – xem và dùng được cả khi chưa đăng nhập */
export default function FeedPage() {
  const { uid, store, pub, guest } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState<PublicTemplate[] | null>(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    pub
      .listPublic({ limit: PAGE })
      .then((list) => {
        setItems(list);
        setMore(list.length === PAGE);
      })
      .catch((e) => setError('Không tải được Bảng tin: ' + (e as Error).message));
  }, [pub]);

  async function loadMore() {
    const last = items?.[items.length - 1];
    if (!last?.publishedAt) return;
    setLoadingMore(true);
    try {
      const list = await pub.listPublic({ limit: PAGE, after: last.publishedAt });
      setItems((xs) => [...(xs ?? []), ...list]);
      setMore(list.length === PAGE);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function use(p: PublicTemplate) {
    setBusyId(p.id);
    setError('');
    try {
      const tpl = await copyPublicTemplate(store, pub, uid, p, !guest);
      navigate(`/compose/${tpl.id}?new=1`);
    } catch (e) {
      setError('Không mở được mẫu: ' + (e as Error).message);
      setBusyId('');
    }
  }

  return (
    <div className="page">
      <div className="section-head">
        <div>
          <h1>Bảng tin</h1>
          <p className="muted small-text">Khung mẫu do mọi người chia sẻ – chọn một mẫu để dùng ngay.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {!items && !error && (
        <div className="center">
          <div className="spinner" />
        </div>
      )}
      {items && items.length === 0 && (
        <div className="card empty">
          <Icon name="feed" size={32} />
          <p className="muted">Chưa có mẫu nào được chia sẻ. Hãy là người đầu tiên: mở “Khung của tôi” và bấm biểu tượng chia sẻ.</p>
        </div>
      )}
      <div className="grid">
        {items?.map((p) => (
          <PublicCard key={p.id} p={p} busy={busyId === p.id} disabled={!!busyId} onUse={() => use(p)} />
        ))}
      </div>
      {more && (
        <div className="center">
          <button className="btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Đang tải…' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  );
}
