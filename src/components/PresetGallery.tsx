import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../lib/auth';
import { PRESETS, PRESET_CATEGORIES, type Preset } from '../presets/presets';
import { createTemplateFromPreset, presetPreview } from '../presets/render';
import { presetThumbUrl } from '../presets/thumbs';

function PresetCard({ preset, busy, disabled, onUse }: { preset: Preset; busy: boolean; disabled: boolean; onUse: () => void }) {
  // Ưu tiên ảnh tạo sẵn; nếu chưa có (mẫu mới sửa) thì vẽ trên trình duyệt khi thẻ sắp hiện ra trên màn hình
  const [src, setSrc] = useState(() => presetThumbUrl(preset));
  const [fallback, setFallback] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!fallback || !ref.current) return;
    let alive = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        presetPreview(preset).then((u) => alive && setSrc(u)).catch(() => {});
      },
      { rootMargin: '400px' },
    );
    io.observe(ref.current);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, [preset, fallback]);

  return (
    <div className="tpl-card">
      <button ref={ref} className="tpl-thumb" onClick={onUse} disabled={disabled} title="Dùng mẫu này">
        {fallback && !src.startsWith('data:') ? (
          <span className="spinner small" />
        ) : (
          <img
            src={src}
            alt={preset.name}
            loading="lazy"
            decoding="async"
            onError={() => {
              if (!fallback) setFallback(true);
            }}
          />
        )}
      </button>
      <div className="tpl-info">
        <strong className="ellipsis">{preset.name}</strong>
        <small className="muted clamp-2">{preset.description}</small>
      </div>
      <div className="tpl-actions">
        <button className="btn primary sm grow" onClick={onUse} disabled={disabled}>
          {busy ? 'Đang tạo…' : 'Dùng mẫu này'}
        </button>
      </div>
    </div>
  );
}

const BIG_PHOTO = 'Ảnh lớn';

/** Thư viện khung mẫu có sẵn: chọn một mẫu sẽ tạo bản sao vào "Khung mẫu của tôi" */
export function PresetGallery() {
  const { uid, store } = useSession();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('Tất cả');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const list =
    category === 'Tất cả'
      ? PRESETS
      : category === BIG_PHOTO
        ? PRESETS.filter((p) => p.photoFirst)
        : PRESETS.filter((p) => p.category === category);

  async function use(preset: Preset) {
    setBusyId(preset.id);
    setError('');
    try {
      const tpl = await createTemplateFromPreset(store, uid, preset);
      navigate(`/compose/${tpl.id}?new=1`);
    } catch (e) {
      setError('Không tạo được khung từ mẫu: ' + (e as Error).message);
      setBusyId('');
    }
  }

  return (
    <section className="section presets" id="presets">
      <div className="section-head">
        <h2>Mẫu có sẵn</h2>
      </div>
      <p className="hint">Chọn một mẫu để tạo khung của riêng bạn – sau đó có thể đổi chữ, màu, vị trí tuỳ ý.</p>
      <div className="chips">
        {['Tất cả', BIG_PHOTO, ...PRESET_CATEGORIES].map((c) => (
          <button key={c} className={c === category ? 'chip on' : 'chip'} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {list.map((p) => (
          <PresetCard key={p.id} preset={p} busy={busyId === p.id} disabled={!!busyId} onUse={() => use(p)} />
        ))}
      </div>
    </section>
  );
}
