interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl';

function UndoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
    </svg>
  );
}

/** Thanh Hoàn tác / Làm lại đặt ngay dưới ảnh */
export function UndoRedoButtons({ canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <div className="undo-bar">
      <button className="btn" onClick={onUndo} disabled={!canUndo} title={`Hoàn tác (${mod}+Z)`}>
        <UndoIcon /> Hoàn tác
      </button>
      <button className="btn" onClick={onRedo} disabled={!canRedo} title={`Làm lại (${mod}+Shift+Z)`}>
        Làm lại <RedoIcon />
      </button>
    </div>
  );
}
