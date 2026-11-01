import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backend } from '../lib/backend';
import { useUser } from '../lib/auth';
import { PRESETS, PRESET_CATEGORIES, type Preset } from '../presets/presets';
import { createTemplateFromPreset, presetPreview } from '../presets/render';

function PresetCard({ preset, busy, disabled, onUse }: { preset: Preset; busy: boolean; disabled: boolean; onUse: () => void }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let alive = true;
    presetPreview(preset).then((u) => alive && setSrc(u)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [preset]);

  return (
    <div className="tpl-card">
      <button className="tpl-thumb" onClick={onUse} disabled={disabled} title="Dùng mẫu này">
        {src ? <img src={src} alt={preset.name} loading="lazy" /> : <span className="spinner small" />}
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

/** Thư viện khung mẫu có sẵn: chọn một mẫu sẽ tạo bản sao vào "Khung mẫu của tôi" */
export function PresetGallery() {
  const user = useUser();
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>('Tất cả');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const list = category === 'Tất cả' ? PRESETS : PRESETS.filter((p) => p.category === category);

  async function use(preset: Preset) {
    setBusyId(preset.id);
    setError('');
    try {
      const tpl = await createTemplateFromPreset(backend, user.uid, preset);
      navigate(`/compose/${tpl.id}?new=1`);
    } catch (e) {
      setError('Không tạo được khung từ mẫu: ' + (e as Error).message);
      setBusyId('');
    }
  }

  return (
    <section className="presets">
      <div className="toolbar">
        <h2 className="grow">✨ Mẫu có sẵn</h2>
      </div>
      <p className="hint">Chọn một mẫu để tạo khung của riêng bạn – sau đó có thể đổi chữ, màu, vị trí tuỳ ý.</p>
      <div className="chips">
        {['Tất cả', ...PRESET_CATEGORIES].map((c) => (
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
