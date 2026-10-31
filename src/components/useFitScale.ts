import { useEffect, useState, type RefObject } from 'react';

/** Tính tỉ lệ thu nhỏ để canvas (w × h) vừa với khung chứa trên màn hình */
export function useFitScale(ref: RefObject<HTMLElement>, w: number, h: number, maxHeightRatio = 0.62): number {
  const [box, setBox] = useState({ width: 360, vh: 640 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBox({ width: el.clientWidth, vh: window.innerHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref]);
  if (!w || !h) return 1;
  return Math.min(box.width / w, (box.vh * maxHeightRatio) / h);
}
