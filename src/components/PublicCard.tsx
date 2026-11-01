import { Link } from 'react-router-dom';
import type { PublicTemplate } from '../types';
import { Icon } from './Icon';

export function OwnerBadge({ name, photo }: { name: string; photo: string | null }) {
  return (
    <span className="owner">
      {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" /> : <span className="owner-dot">{name.charAt(0).toUpperCase()}</span>}
      <span className="ellipsis">{name}</span>
    </span>
  );
}

/** Thẻ mẫu công khai trên Bảng tin */
export function PublicCard({ p, busy, disabled, onUse }: { p: PublicTemplate; busy: boolean; disabled: boolean; onUse: () => void }) {
  return (
    <div className="tpl-card">
      <Link className="tpl-thumb" to={`/t/${p.id}`} title="Xem mẫu">
        {p.thumbnail ? <img src={p.thumbnail} alt={p.name} loading="lazy" /> : <Icon name="image" size={28} />}
      </Link>
      <div className="tpl-info">
        <strong className="ellipsis">{p.name}</strong>
        <small className="muted row-between">
          <OwnerBadge name={p.ownerName} photo={p.ownerPhoto} />
          {p.uses > 0 && <span title="Số lần được dùng">{p.uses} lượt dùng</span>}
        </small>
      </div>
      <div className="tpl-actions">
        <button className="btn primary sm grow" onClick={onUse} disabled={disabled}>
          {busy ? 'Đang mở…' : 'Dùng mẫu'}
        </button>
      </div>
    </div>
  );
}
