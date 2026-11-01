import { useEffect, useRef, useState } from 'react';
import { isIdentity, renderAdjusted, type PhotoAdjust } from '../lib/photoFilters';

/** Cạnh dài tối đa của ảnh xem trước khi chỉnh (ảnh xuất vẫn xử lý ở độ phân giải gốc) */
const PREVIEW_MAX = 1200;

/**
 * Ảnh sản phẩm đã áp bộ lọc để hiển thị. Xử lý tối đa 1 lần mỗi khung hình,
 * luôn lấy thông số mới nhất – kéo thanh trượt vẫn mượt.
 */
export function useAdjustedPhoto(img: HTMLImageElement | null, adjust: PhotoAdjust | null): CanvasImageSource | null {
  const [out, setOut] = useState<CanvasImageSource | null>(img);
  const pending = useRef<{ img: HTMLImageElement; adjust: PhotoAdjust } | null>(null);
  const running = useRef(false);

  useEffect(() => {
    if (!img || !adjust || isIdentity(adjust)) {
      pending.current = null;
      setOut(img);
      return;
    }
    pending.current = { img, adjust };
    if (running.current) return;
    running.current = true;
    const run = () => {
      const job = pending.current;
      pending.current = null;
      if (!job) {
        running.current = false;
        return;
      }
      setOut(renderAdjusted(job.img, job.adjust, PREVIEW_MAX));
      requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, [img, adjust]);

  return out;
}
