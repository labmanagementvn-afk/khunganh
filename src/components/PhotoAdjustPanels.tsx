import { useMemo } from 'react';
import { Icon } from './Icon';
import { DEFAULT_ADJUST, FILTERS, FILTER_IDS, autoBeautify, isIdentity, renderAdjusted, type PhotoAdjust } from '../lib/photoFilters';

interface Props {
  img: HTMLImageElement;
  adjust: PhotoAdjust;
  /** mergeKey: gộp các lần kéo cùng thanh trượt thành 1 bước hoàn tác */
  onChange: (patch: Partial<PhotoAdjust>, mergeKey?: string) => void;
}

/** Ảnh vuông nhỏ ở giữa ảnh gốc – dùng làm ảnh mẫu cho từng bộ lọc */
function thumbSource(img: HTMLImageElement, size = 112): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  c.getContext('2d')!.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
  return c;
}

export function FilterPicker({ img, adjust, onChange }: Props) {
  const thumbs = useMemo(() => {
    const base = thumbSource(img);
    return FILTER_IDS.map((id) => ({ id, url: renderAdjusted(base, { ...DEFAULT_ADJUST, filter: id }).toDataURL('image/jpeg', 0.8) }));
  }, [img]);

  return (
    <>
      <div className="filter-list">
        {thumbs.map(({ id, url }) => (
          <button
            key={id}
            className={adjust.filter === id ? 'filter-item on' : 'filter-item'}
            onClick={() => onChange({ filter: id, filterStrength: adjust.filter === id ? adjust.filterStrength : 100 })}
          >
            <img src={url} alt="" />
            <span>{FILTERS[id].name}</span>
          </button>
        ))}
      </div>
      {adjust.filter !== 'none' && (
        <label className="field">
          <span>Độ mạnh bộ lọc: {adjust.filterStrength}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={adjust.filterStrength}
            onChange={(e) => onChange({ filterStrength: Number(e.target.value) }, 'adj:filterStrength')}
          />
        </label>
      )}
    </>
  );
}

const SLIDERS: { key: keyof PhotoAdjust; label: string; min: number }[] = [
  { key: 'brightness', label: 'Độ sáng', min: -100 },
  { key: 'contrast', label: 'Tương phản', min: -100 },
  { key: 'saturation', label: 'Độ bão hoà màu', min: -100 },
  { key: 'warmth', label: 'Ấm / lạnh', min: -100 },
  { key: 'highlights', label: 'Vùng sáng (kéo trái để giảm chói)', min: -100 },
  { key: 'shadows', label: 'Vùng tối', min: -100 },
  { key: 'smooth', label: 'Làm mịn (da)', min: 0 },
  { key: 'sharpen', label: 'Độ nét', min: 0 },
  { key: 'vignette', label: 'Tối 4 góc', min: 0 },
];

export function AdjustSliders({ img, adjust, onChange }: Props) {
  return (
    <>
      <div className="row wrap">
        <button className="btn primary sm grow" onClick={() => onChange(autoBeautify(img, adjust))}>
          <Icon name="wand" /> Làm đẹp tự động
        </button>
        <button
          className="btn ghost sm"
          disabled={isIdentity({ ...adjust, filter: 'none' })}
          onClick={() => onChange({ ...DEFAULT_ADJUST, filter: adjust.filter, filterStrength: adjust.filterStrength })}
        >
          <Icon name="reset" /> Đặt lại
        </button>
      </div>
      {SLIDERS.map(({ key, label, min }) => (
        <label key={key} className="field">
          <span className="slider-label">
            {label}
            <b>{(adjust[key] as number) > 0 && min < 0 ? '+' : ''}{adjust[key]}</b>
          </span>
          <input
            type="range"
            min={min}
            max={100}
            value={adjust[key] as number}
            onChange={(e) => onChange({ [key]: Number(e.target.value) }, 'adj:' + key)}
            onDoubleClick={() => onChange({ [key]: 0 })}
          />
        </label>
      ))}
    </>
  );
}
