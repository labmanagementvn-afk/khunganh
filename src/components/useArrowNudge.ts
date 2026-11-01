import { useEffect, useRef } from 'react';

/**
 * Phím mũi tên di chuyển phần tử đang chọn: 1px mỗi lần, giữ Shift để di chuyển 10px.
 * Bỏ qua khi đang gõ trong ô nhập liệu.
 */
export function useArrowNudge(onNudge: ((dx: number, dy: number) => void) | null) {
  const ref = useRef(onNudge);
  ref.current = onNudge;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!dir || !ref.current || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      ref.current(dir[0] * step, dir[1] * step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
