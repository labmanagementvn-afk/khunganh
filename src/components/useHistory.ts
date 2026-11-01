import { useCallback, useEffect, useRef, useState } from 'react';

const LIMIT = 100;
/** Các thay đổi cùng loại (cùng mergeKey) liên tiếp trong khoảng này được gộp thành 1 bước undo */
const MERGE_MS = 1000;

type Updater<T> = T | ((prev: T) => T);

interface State<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Lưu lịch sử trạng thái để Hoàn tác / Làm lại.
 * `set(value, mergeKey)`: các lần gọi liên tiếp cùng mergeKey (vd khi kéo thanh trượt, gõ chữ)
 * chỉ tạo 1 bước trong lịch sử. Không truyền mergeKey = mỗi lần gọi là 1 bước riêng.
 */
export function useHistory<T>(initial: T) {
  const [state, setState] = useState<State<T>>({ past: [], present: initial, future: [] });
  const last = useRef<{ key: string | null; time: number }>({ key: null, time: 0 });

  const set = useCallback((u: Updater<T>, mergeKey?: string) => {
    const now = Date.now();
    const merge = !!mergeKey && last.current.key === mergeKey && now - last.current.time < MERGE_MS;
    last.current = { key: mergeKey ?? null, time: now };
    setState((s) => {
      const next = typeof u === 'function' ? (u as (p: T) => T)(s.present) : u;
      if (Object.is(next, s.present)) return s;
      if (merge) return { ...s, present: next, future: [] };
      return { past: [...s.past, s.present].slice(-LIMIT), present: next, future: [] };
    });
  }, []);

  /** Đổi trạng thái mà không ghi vào lịch sử (vd: dữ liệu vừa tải xong) */
  const reset = useCallback((u: Updater<T>, clear = true) => {
    last.current = { key: null, time: 0 };
    setState((s) => {
      const next = typeof u === 'function' ? (u as (p: T) => T)(s.present) : u;
      return clear ? { past: [], present: next, future: [] } : { ...s, present: next };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = { key: null, time: 0 };
    setState((s) =>
      s.past.length
        ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] }
        : s,
    );
  }, []);

  const redo = useCallback(() => {
    last.current = { key: null, time: 0 };
    setState((s) =>
      s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s,
    );
  }, []);

  return {
    present: state.present,
    set,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

/** Ctrl/Cmd+Z: hoàn tác · Ctrl/Cmd+Shift+Z hoặc Ctrl+Y: làm lại. Bỏ qua khi đang gõ trong ô nhập. */
export function useUndoRedoKeys(undo: () => void, redo: () => void) {
  const ref = useRef({ undo, redo });
  ref.current = { undo, redo };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        ref.current.undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        ref.current.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
