import { FONTS } from '../lib/fonts';
import type { FontStyle, TextElement } from '../types';

interface Props {
  el: TextElement;
  canvasWidth: number;
  /** Trong trang tạo ảnh không cho đổi loại text / tên ô nhập */
  allowKind: boolean;
  onChange: (patch: Partial<TextElement>) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  /** Thay ô "Nội dung" bằng ô nhập giá trị (dùng cho text nhập ở trang tạo ảnh) */
  content?: { label: string; value: string; onChange: (v: string) => void };
  /** Khôi phục kiểu chữ & vị trí theo khung mẫu */
  onReset?: () => void;
}

export function TextPropsPanel({ el, canvasWidth, allowKind, onChange, onDelete, onDuplicate, content, onReset }: Props) {
  const bold = el.fontStyle.includes('bold');
  const italic = el.fontStyle.includes('italic');
  const setStyle = (b: boolean, i: boolean) =>
    onChange({ fontStyle: (((i ? 'italic ' : '') + (b ? 'bold' : '')).trim() || 'normal') as FontStyle });
  const maxFont = Math.round(canvasWidth / 3);

  return (
    <div className="panel">
      {allowKind && (
        <div className="seg">
          <button className={el.kind === 'fixed' ? 'on' : ''} onClick={() => onChange({ kind: 'fixed' })}>
            Text cố định
          </button>
          <button
            className={el.kind === 'input' ? 'on' : ''}
            onClick={() => onChange({ kind: 'input', label: el.label || 'Mã sản phẩm' })}
          >
            Text nhập (input)
          </button>
        </div>
      )}

      {el.kind === 'input' && allowKind && (
        <label className="field">
          <span>Tên ô nhập (hiện khi tạo ảnh)</span>
          <input value={el.label} placeholder="vd: Mã sản phẩm" onChange={(e) => onChange({ label: e.target.value })} />
          <small>Các text nhập cùng tên sẽ dùng chung một ô nhập.</small>
        </label>
      )}

      {content ? (
        <label className="field">
          <span>{content.label}</span>
          <textarea rows={2} value={content.value} onChange={(e) => content.onChange(e.target.value)} />
        </label>
      ) : (
        <label className="field">
          <span>{el.kind === 'input' ? 'Giá trị mẫu / mặc định' : 'Nội dung'}</span>
          <textarea rows={2} value={el.text} onChange={(e) => onChange({ text: e.target.value })} />
        </label>
      )}

      <div className="row">
        <label className="field grow">
          <span>Phông chữ</span>
          <select value={el.fontFamily} onChange={(e) => onChange({ fontFamily: e.target.value })}>
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="field color">
          <span>Màu</span>
          <input type="color" value={el.fill} onChange={(e) => onChange({ fill: e.target.value })} />
        </label>
      </div>

      <label className="field">
        <span>Cỡ chữ: {el.fontSize}px</span>
        <input
          type="range"
          min={8}
          max={Math.max(maxFont, el.fontSize)}
          value={el.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
        />
      </label>

      <div className="row wrap">
        <div className="seg small">
          <button className={bold ? 'on' : ''} onClick={() => setStyle(!bold, italic)} title="Đậm">
            <b>B</b>
          </button>
          <button className={italic ? 'on' : ''} onClick={() => setStyle(bold, !italic)} title="Nghiêng">
            <i>I</i>
          </button>
          <button className={el.uppercase ? 'on' : ''} onClick={() => onChange({ uppercase: !el.uppercase })} title="In hoa">
            AA
          </button>
        </div>
        <div className="seg small">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button key={a} className={el.align === a ? 'on' : ''} onClick={() => onChange({ align: a })}>
              {a === 'left' ? 'Trái' : a === 'center' ? 'Giữa' : 'Phải'}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <label className="field grow">
          <span>Viền chữ: {el.strokeWidth}px</span>
          <input
            type="range"
            min={0}
            max={Math.max(4, Math.round(el.fontSize / 5))}
            step={0.5}
            value={el.strokeWidth}
            onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
          />
        </label>
        <label className="field color">
          <span>Màu viền</span>
          <input type="color" value={el.stroke} onChange={(e) => onChange({ stroke: e.target.value })} />
        </label>
      </div>

      <div className="row wrap">
        <button className="btn ghost sm" onClick={() => onChange({ x: Math.round((canvasWidth - el.width) / 2) })}>
          ↔ Căn giữa ngang
        </button>
        {el.rotation !== 0 && (
          <button className="btn ghost sm" onClick={() => onChange({ rotation: 0 })}>
            ⟲ Bỏ xoay
          </button>
        )}
        {onReset && (
          <button className="btn ghost sm" onClick={onReset}>
            ↺ Như khung mẫu
          </button>
        )}
        {onDuplicate && (
          <button className="btn ghost sm" onClick={onDuplicate}>
            ⧉ Nhân bản
          </button>
        )}
        <button className="btn danger sm" onClick={onDelete}>
          🗑 Xoá text
        </button>
      </div>
    </div>
  );
}
