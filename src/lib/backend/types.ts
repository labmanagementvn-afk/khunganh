import type { AppUser, HistoryEntry, PublicTemplate, Template } from '../../types';

export interface Backend {
  mode: 'firebase' | 'local';
  onAuthChange(cb: (user: AppUser | null) => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;

  listTemplates(uid: string): Promise<Template[]>;
  getTemplate(uid: string, id: string): Promise<Template | null>;
  saveTemplate(uid: string, template: Template): Promise<void>;
  deleteTemplate(uid: string, id: string): Promise<void>;

  listHistory(uid: string): Promise<HistoryEntry[]>;
  addHistory(uid: string, entry: HistoryEntry): Promise<void>;
  deleteHistory(uid: string, id: string): Promise<void>;

  putBlob(uid: string, blob: Blob): Promise<string>;
  getBlob(uid: string, id: string): Promise<Blob>;
  deleteBlob(uid: string, id: string): Promise<void>;

  // ---- Mẫu công khai (Bảng tin) – đọc được cả khi chưa đăng nhập ----
  /** Chia sẻ (hoặc cập nhật bản chia sẻ) một khung; trả về mã công khai */
  publishTemplate(owner: AppUser, template: Template, frame: Blob | null): Promise<string>;
  unpublishTemplate(owner: AppUser, publicId: string): Promise<void>;
  listPublic(opts: { limit: number; after?: number; ownerUid?: string; category?: string }): Promise<PublicTemplate[]>;
  getPublic(publicId: string): Promise<PublicTemplate | null>;
  getPublicFrame(publicId: string): Promise<Blob | null>;
  /** Tăng bộ đếm số lần dùng (bỏ qua lỗi) */
  countPublicUse(publicId: string): Promise<void>;
}
