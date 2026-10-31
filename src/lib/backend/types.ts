import type { AppUser, HistoryEntry, Template } from '../../types';

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
}
