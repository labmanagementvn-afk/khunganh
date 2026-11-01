interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl';

export function UndoRedoButtons({ canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <div className="seg small undo-redo">
      <button onClick={onUndo} disabled={!canUndo} title={`Hoàn tác (${mod}+Z)`} aria-label="Hoàn tác">
        ↶
      </button>
      <button onClick={onRedo} disabled={!canRedo} title={`Làm lại (${mod}+Shift+Z)`} aria-label="Làm lại">
        ↷
      </button>
    </div>
  );
}
