import type { ReactNode } from 'react';

/** Khung cài đặt của phần tử đang chọn, hiển thị ngay dưới ảnh */
export function SettingsPanel({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="panel settings">
      <div className="settings-head">
        <h3>{title}</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Đóng phần chỉnh sửa" title="Bỏ chọn">
          ✕
        </button>
      </div>
      {children}
    </div>
  );
}
