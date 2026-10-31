import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { canShareFiles, downloadBlob, shareBlob } from '../lib/share';

interface Props {
  blob: Blob;
  filename: string;
  status?: string;
  onClose: () => void;
  extraAction?: ReactNode;
}

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export function ResultModal({ blob, filename, status, onClose, extraAction }: Props) {
  const [url, setUrl] = useState('');
  const [shareError, setShareError] = useState('');
  const shareable = useMemo(canShareFiles, []);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Ảnh đã tạo</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>
        {url && <img className="result-img" src={url} alt="Ảnh kết quả" />}
        {status && <p className="hint center-text">{status}</p>}
        <div className="modal-actions">
          {shareable && (
            <button
              className="btn primary lg"
              onClick={() => shareBlob(blob, filename).catch((e) => setShareError((e as Error).message))}
            >
              📲 Lưu vào Ảnh / Chia sẻ
            </button>
          )}
          <button className={shareable ? 'btn lg' : 'btn primary lg'} onClick={() => downloadBlob(blob, filename)}>
            ⬇️ Tải về
          </button>
          {extraAction}
        </div>
        {shareError && <p className="error">{shareError}</p>}
        <p className="hint">
          {isIOS
            ? `iPhone: ${shareable ? 'nhấn "Lưu vào Ảnh / Chia sẻ" rồi chọn "Lưu hình ảnh", hoặc ' : ''}nhấn giữ ảnh phía trên → "Thêm vào Ảnh".`
            : 'Điện thoại: nhấn "Tải về" (ảnh nằm trong thư mục Tải xuống) hoặc nhấn giữ ảnh phía trên để lưu vào Thư viện ảnh.'}
        </p>
      </div>
    </div>
  );
}
