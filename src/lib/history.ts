import type { HistoryEntry } from '../types';
import { newId } from './id';
import { makeThumbnail } from './image';

/** Mỗi tài khoản chỉ giữ bấy nhiêu ảnh gần nhất trong lịch sử */
export const HISTORY_LIMIT = 10;

/**
 * Mục lịch sử chỉ chứa ảnh xem lại cỡ vừa (≤720px, ~100 KB) và thông tin đã nhập –
 * không lưu file ảnh gốc (người dùng đã tải về máy), giảm ~10 lần dung lượng lưu trữ.
 */
export function historyEntry(tpl: { id: string; name: string }, inputs: Record<string, string>, canvas: HTMLCanvasElement, mime: string): HistoryEntry {
  return {
    id: newId(),
    templateId: tpl.id,
    templateName: tpl.name,
    inputs,
    thumbnail: makeThumbnail(canvas, 720),
    mime,
    width: canvas.width,
    height: canvas.height,
    createdAt: Date.now(),
  };
}
