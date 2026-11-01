import { Icon } from './Icon';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl';

/** Thanh Hoàn tác / Làm lại đặt ngay dưới ảnh */
export function UndoRedoButtons({ canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <div className="undo-bar">
      <button className="btn" onClick={onUndo} disabled={!canUndo} title={`Hoàn tác (${mod}+Z)`}>
        <Icon name="undo" /> Hoàn tác
      </button>
      <button className="btn" onClick={onRedo} disabled={!canRedo} title={`Làm lại (${mod}+Shift+Z)`}>
        Làm lại <Icon name="redo" />
      </button>
    </div>
  );
}
