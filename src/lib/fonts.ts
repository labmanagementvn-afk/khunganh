import { useEffect, useState } from 'react';

export const FONTS = [
  'Be Vietnam Pro',
  'Roboto',
  'Montserrat',
  'Oswald',
  'Playfair Display',
  'Dancing Script',
  'Pacifico',
  'Arial',
  'Times New Roman',
];

/**
 * Canvas không tự vẽ lại khi web font tải xong, nên cần chờ font sẵn sàng.
 * Trả về một số tăng dần mỗi khi có font mới tải xong, dùng làm key để vẽ lại.
 */
export function useFontsReady(families: string[]): number {
  const [version, setVersion] = useState(0);
  const key = Array.from(new Set(families)).sort().join('|');
  useEffect(() => {
    if (!('fonts' in document)) return;
    let cancelled = false;
    const loads = key
      .split('|')
      .filter(Boolean)
      .flatMap((f) => ['400', '700', 'italic 400', 'italic 700'].map((v) => `${v} 40px "${f}"`))
      .map((spec) => document.fonts.load(spec, 'Ảnh ếự').catch(() => []));
    Promise.all(loads).then(() => !cancelled && setVersion((v) => v + 1));
    return () => {
      cancelled = true;
    };
  }, [key]);
  return version;
}
