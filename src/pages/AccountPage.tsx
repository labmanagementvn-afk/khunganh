import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HistorySection } from '../components/HistorySection';
import { Icon } from '../components/Icon';
import { copyText } from '../components/ShareTemplateModal';
import { backend } from '../lib/backend';
import { useSession } from '../lib/auth';
import { HISTORY_LIMIT } from '../lib/history';
import { publicUrl, unpublishTemplate } from '../lib/publicTemplates';
import type { PublicTemplate } from '../types';

/** Mẫu mà người dùng đang chia sẻ công khai */
function MySharedSection() {
  const { user, uid, store, pub } = useSession();
  const [items, setItems] = useState<PublicTemplate[] | null>(null);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    pub
      .listPublic({ limit: 100, ownerUid: uid })
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [pub, uid]);

  async function stop(p: PublicTemplate) {
    if (!user || !confirm(`Ngừng chia sẻ “${p.name}”?`)) return;
    try {
      const mine = (await store.listTemplates(uid)).find((t) => t.publicId === p.id);
      if (mine) await unpublishTemplate(store, pub, user, mine);
      else await pub.unpublishTemplate(user, p.id);
      setItems((xs) => xs?.filter((x) => x.id !== p.id) ?? null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="section">
      <div className="section-head">
        <h2>Mẫu đã chia sẻ</h2>
        <Link to="/feed" className="btn ghost sm">
          Bảng tin <Icon name="arrowRight" />
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      {items && items.length === 0 && (
        <p className="muted small-text">Bạn chưa chia sẻ mẫu nào. Ở “Khung của tôi” trên trang chủ, bấm biểu tượng chia sẻ trên một khung.</p>
      )}
      <div className="history">
        {items?.map((p) => (
          <div key={p.id} className="history-item">
            <Link className="history-thumb" to={`/t/${p.id}`}>
              <img src={p.thumbnail} alt="" />
            </Link>
            <div className="history-info">
              <strong className="ellipsis">{p.name}</strong>
              <small className="muted">{p.uses} lượt dùng · chia sẻ {new Date(p.publishedAt ?? p.createdAt).toLocaleDateString('vi-VN')}</small>
            </div>
            <div className="history-actions">
              <button
                className="icon-btn"
                title="Sao chép link"
                aria-label="Sao chép link"
                onClick={async () => {
                  if (await copyText(publicUrl(p.id))) {
                    setCopied(p.id);
                    setTimeout(() => setCopied(''), 2000);
                  }
                }}
              >
                <Icon name={copied === p.id ? 'check' : 'link'} />
              </button>
              <button className="icon-btn" title="Ngừng chia sẻ" aria-label="Ngừng chia sẻ" onClick={() => stop(p)}>
                <Icon name="x" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AccountPage() {
  const { user, guest } = useSession();

  if (guest || !user) {
    return (
      <div className="page narrow">
        <h1>Tài khoản</h1>
        <div className="card account-guest">
          <span className="action-icon">
            <Icon name="user" size={22} />
          </span>
          <h3>Bạn chưa đăng nhập</h3>
          <ul className="benefits">
            <li>Lưu lịch sử {HISTORY_LIMIT} ảnh gần nhất</li>
            <li>Dùng khung của bạn trên mọi thiết bị</li>
            <li>Chia sẻ khung lên Bảng tin và gửi link cho người khác</li>
          </ul>
          <Link to="/login" className="btn primary lg block">
            Đăng nhập bằng Google
          </Link>
          <p className="hint">Không đăng nhập vẫn tạo ảnh, dùng mẫu trên Bảng tin và tự tạo khung (lưu trên máy này).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page narrow">
      <div className="profile card">
        {user.photoURL ? (
          <img className="avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar">{user.displayName.charAt(0).toUpperCase()}</span>
        )}
        <div className="grow">
          <strong className="ellipsis">{user.displayName}</strong>
          <small className="muted ellipsis">{user.email}</small>
        </div>
        <button className="btn sm" onClick={() => confirm('Đăng xuất?') && backend.signOut()}>
          <Icon name="logout" /> Đăng xuất
        </button>
      </div>
      <MySharedSection />
      <HistorySection />
    </div>
  );
}
