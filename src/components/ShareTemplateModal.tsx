import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { publicUrl, publishTemplate, unpublishTemplate } from '../lib/publicTemplates';
import type { Template } from '../types';
import { Icon } from './Icon';

/** Sao chép chữ vào bộ nhớ tạm, có phương án dự phòng cho trình duyệt cũ */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  }
}

/** Ô hiện link + nút Sao chép / Chia sẻ */
export function LinkBox({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator.share === 'function';
  return (
    <div className="link-box">
      <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Link chia sẻ" />
      <div className="row wrap">
        <button
          className="btn primary sm grow"
          onClick={async () => {
            setCopied(await copyText(url));
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          <Icon name={copied ? 'check' : 'link'} /> {copied ? 'Đã sao chép' : 'Sao chép link'}
        </button>
        {canShare && (
          <button className="btn sm grow" onClick={() => navigator.share({ title, url }).catch(() => {})}>
            <Icon name="share" /> Gửi link
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  template: Template;
  onClose: () => void;
  onChanged: (t: Template) => void;
}

export function ShareTemplateModal({ template, onClose, onChanged }: Props) {
  const { user, store, pub } = useSession();
  const [tpl, setTpl] = useState(template);
  const [busy, setBusy] = useState<'' | 'publish' | 'unpublish'>('');
  const [error, setError] = useState('');

  async function run(kind: 'publish' | 'unpublish') {
    if (!user) return;
    setBusy(kind);
    setError('');
    try {
      const next = kind === 'publish' ? await publishTemplate(store, pub, user, tpl) : await unpublishTemplate(store, pub, user, tpl);
      setTpl(next);
      onChanged(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Chia sẻ khung</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="share-head">
          {tpl.thumbnail && <img src={tpl.thumbnail} alt="" />}
          <div>
            <strong>{tpl.name}</strong>
            <small className="muted">
              {tpl.publicId ? (
                <>
                  <Icon name="globe" size={14} /> Đang công khai
                </>
              ) : (
                'Chỉ mình bạn thấy'
              )}
            </small>
          </div>
        </div>

        {!user ? (
          <>
            <p className="muted">Đăng nhập để chia sẻ khung của bạn lên Bảng tin và gửi link cho người khác.</p>
            <Link to="/login" className="btn primary lg">
              Đăng nhập bằng Google
            </Link>
          </>
        ) : tpl.publicId ? (
          <>
            <p className="muted">Mọi người thấy khung này trên Bảng tin và mở được bằng link dưới đây – kể cả khi chưa đăng nhập.</p>
            <LinkBox url={publicUrl(tpl.publicId)} title={tpl.name} />
            <div className="row wrap">
              <button className="btn sm" disabled={!!busy} onClick={() => run('publish')}>
                <Icon name="replace" /> {busy === 'publish' ? 'Đang cập nhật…' : 'Cập nhật bản chia sẻ'}
              </button>
              <button className="btn danger sm" disabled={!!busy} onClick={() => confirm('Ngừng chia sẻ khung này?') && run('unpublish')}>
                {busy === 'unpublish' ? 'Đang gỡ…' : 'Ngừng chia sẻ'}
              </button>
            </div>
            <p className="hint">Sửa khung xong, bấm “Cập nhật bản chia sẻ” để mọi người thấy bản mới.</p>
          </>
        ) : (
          <>
            <p className="muted">
              Chia sẻ công khai để khung xuất hiện trên <b>Bảng tin</b> và có link riêng. Người khác có thể dùng khung để tạo ảnh của họ –
              khung gốc của bạn không bị thay đổi.
            </p>
            <button className="btn primary lg" disabled={!!busy} onClick={() => run('publish')}>
              <Icon name="globe" /> {busy ? 'Đang chia sẻ…' : 'Chia sẻ công khai'}
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
