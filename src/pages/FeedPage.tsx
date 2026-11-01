import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { PublicCard } from '../components/PublicCard';
import { useSession } from '../lib/auth';
import { INDUSTRIES, normalizeText } from '../lib/industries';
import { copyPublicTemplate } from '../lib/publicTemplates';
import type { PublicTemplate } from '../types';

const PAGE = 24;

/** Bảng tin: các mẫu mọi người chia sẻ công khai – lọc theo ngành, tìm theo tên; khách cũng xem & dùng được */
export default function FeedPage() {
  const { uid, store, pub, guest } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // Bộ lọc nằm trên đường dẫn → gửi link Bảng tin đã lọc cho người khác được
  const category = params.get('nganh') ?? '';
  const q = params.get('q') ?? '';
  const [items, setItems] = useState<PublicTemplate[] | null>(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const setFilter = (next: { nganh?: string; q?: string }) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    setParams(p, { replace: true });
  };

  useEffect(() => {
    let alive = true;
    setItems(null);
    setError('');
    pub
      .listPublic({ limit: PAGE, category: category || undefined })
      .then((list) => {
        if (!alive) return;
        setItems(list);
        setMore(list.length === PAGE);
      })
      .catch((e) => alive && setError('Không tải được Bảng tin: ' + (e as Error).message));
    return () => {
      alive = false;
    };
  }, [pub, category]);

  async function loadMore() {
    const last = items?.[items.length - 1];
    if (!last?.publishedAt) return;
    setLoadingMore(true);
    try {
      const list = await pub.listPublic({ limit: PAGE, after: last.publishedAt, category: category || undefined });
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

  // Tìm theo tên mẫu, người đăng, ngành và chữ trên khung (không phân biệt dấu)
  const shown = useMemo(() => {
    if (!items) return null;
    const words = normalizeText(q).split(/\s+/).filter(Boolean);
    if (!words.length) return items;
    return items.filter((p) => {
      const hay = normalizeText([p.name, p.ownerName, p.category ?? '', ...p.texts.flatMap((t) => [t.text, t.label])].join(' '));
      return words.every((w) => hay.includes(w));
    });
  }, [items, q]);

  return (
    <div className="page">
      <div className="section-head">
        <div>
          <h1>Bảng tin</h1>
          <p className="muted small-text">Khung mẫu do mọi người chia sẻ – lọc theo ngành hoặc tìm theo tên.</p>
        </div>
      </div>

      <div className="search-box">
        <Icon name="search" />
        <input
          type="search"
          value={q}
          placeholder="Tìm mẫu: phở, son, căn hộ, flash sale…"
          onChange={(e) => setFilter({ q: e.target.value })}
          aria-label="Tìm mẫu"
        />
        {q && (
          <button className="icon-btn" onClick={() => setFilter({ q: '' })} aria-label="Xoá tìm kiếm">
            <Icon name="x" />
          </button>
        )}
      </div>
      <div className="chips">
        <button className={!category ? 'chip on' : 'chip'} onClick={() => setFilter({ nganh: '' })}>
          Tất cả ngành
        </button>
        {INDUSTRIES.map((c) => (
          <button key={c} className={category === c ? 'chip on' : 'chip'} onClick={() => setFilter({ nganh: c })}>
            {c}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {!shown && !error && (
        <div className="center">
          <div className="spinner" />
        </div>
      )}
      {shown && shown.length === 0 && (
        <div className="card empty">
          <Icon name="search" size={30} />
          {q || category ? (
            <>
              <p className="muted">
                Không có mẫu nào {category && <>ngành <b>{category}</b></>} {q && <>khớp “{q}”</>}
                {more ? ' trong các mẫu đã tải.' : '.'}
              </p>
              <div className="row wrap">
                {more && (
                  <button className="btn" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Đang tìm…' : 'Tìm thêm'}
                  </button>
                )}
                <button className="btn ghost" onClick={() => setFilter({ nganh: '', q: '' })}>
                  Bỏ bộ lọc
                </button>
              </div>
            </>
          ) : (
            <p className="muted">Chưa có mẫu nào được chia sẻ. Hãy là người đầu tiên: mở “Khung của tôi” và bấm biểu tượng chia sẻ.</p>
          )}
        </div>
      )}
      <div className="grid">
        {shown?.map((p) => (
          <PublicCard key={p.id} p={p} busy={busyId === p.id} disabled={!!busyId} onUse={() => use(p)} />
        ))}
      </div>
      {more && !!shown?.length && (
        <div className="center">
          <button className="btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Đang tải…' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  );
}
