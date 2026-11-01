import type { AppUser, HistoryEntry, PublicTemplate, Template } from '../../types';
import { HISTORY_LIMIT } from '../history';
import { newId } from '../id';
import type { Backend } from './types';

// Chế độ demo: không cần Firebase, mọi dữ liệu lưu trong IndexedDB của trình duyệt.

const DB_NAME = 'photo-frame-local';
const STORES = ['templates', 'history', 'blobs', 'public'] as const;
type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = () => {
        for (const s of STORES) {
          if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

const getAll = <T>(store: StoreName) => run<T[]>(store, 'readonly', (s) => s.getAll());
const getOne = <T>(store: StoreName, key: string) => run<T | undefined>(store, 'readonly', (s) => s.get(key));
const putOne = (store: StoreName, key: string, value: unknown) =>
  run<IDBValidKey>(store, 'readwrite', (s) => s.put(value, key));
const delOne = (store: StoreName, key: string) => run<undefined>(store, 'readwrite', (s) => s.delete(key));

const LOCAL_USER: AppUser = { uid: 'local', displayName: 'Chế độ demo', email: 'Dữ liệu lưu trên trình duyệt này' };
const SESSION_KEY = 'photo-frame-local-signed-in';

const listeners = new Set<(u: AppUser | null) => void>();
function currentUser(): AppUser | null {
  try {
    return localStorage.getItem(SESSION_KEY) ? LOCAL_USER : null;
  } catch {
    return null;
  }
}
function emit() {
  const u = currentUser();
  listeners.forEach((cb) => cb(u));
}

export const localBackend: Backend = {
  mode: 'local',
  onAuthChange(cb) {
    listeners.add(cb);
    cb(currentUser());
    return () => listeners.delete(cb);
  },
  async signIn() {
    localStorage.setItem(SESSION_KEY, '1');
    emit();
  },
  async signOut() {
    localStorage.removeItem(SESSION_KEY);
    emit();
  },

  async listTemplates() {
    const all = await getAll<Template>('templates');
    return all.sort((a, b) => b.updatedAt - a.updatedAt);
  },
  async getTemplate(_uid, id) {
    return (await getOne<Template>('templates', id)) ?? null;
  },
  async saveTemplate(_uid, t) {
    await putOne('templates', t.id, t);
  },
  async deleteTemplate(_uid, id) {
    await delOne('templates', id);
  },

  async listHistory() {
    const all = await getAll<HistoryEntry>('history');
    return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, HISTORY_LIMIT);
  },
  async addHistory(_uid, entry) {
    await putOne('history', entry.id, entry);
    const all = (await getAll<HistoryEntry>('history')).sort((a, b) => b.createdAt - a.createdAt);
    for (const old of all.slice(HISTORY_LIMIT)) {
      await delOne('history', old.id);
      if (old.resultBlobId) await delOne('blobs', old.resultBlobId);
    }
  },
  async deleteHistory(_uid, id) {
    await delOne('history', id);
  },

  async putBlob(_uid, blob) {
    const id = newId();
    // Lưu dạng ArrayBuffer để tương thích Safari cũ (không lưu được Blob vào IndexedDB)
    await putOne('blobs', id, { type: blob.type, data: await blob.arrayBuffer() });
    return id;
  },
  async getBlob(_uid, id) {
    const rec = await getOne<{ type: string; data: ArrayBuffer }>('blobs', id);
    if (!rec) throw new Error('Không tìm thấy dữ liệu ảnh');
    return new Blob([rec.data], { type: rec.type });
  },
  async deleteBlob(_uid, id) {
    await delOne('blobs', id);
  },

  // Mẫu công khai: ở chế độ demo chỉ nằm trong trình duyệt này
  async publishTemplate(owner, tpl, frame) {
    const id = tpl.publicId || newId();
    const old = await getOne<{ meta: PublicTemplate }>('public', id);
    const now = Date.now();
    const meta: PublicTemplate = {
      id,
      name: tpl.name,
      width: tpl.width,
      height: tpl.height,
      background: tpl.background,
      frame: tpl.frame ? { ...tpl.frame, blobId: id } : null,
      photoSlot: tpl.photoSlot,
      photoOnTop: tpl.photoOnTop,
      texts: tpl.texts,
      thumbnail: tpl.thumbnail,
      createdAt: old?.meta.createdAt ?? now,
      updatedAt: now,
      ownerUid: owner.uid,
      ownerName: owner.displayName,
      ownerPhoto: owner.photoURL ?? null,
      uses: old?.meta.uses ?? 0,
      publishedAt: old?.meta.publishedAt ?? now,
    };
    const data = frame ? { type: frame.type, data: await frame.arrayBuffer() } : null;
    await putOne('public', id, { meta, frame: data });
    return id;
  },
  async unpublishTemplate(_owner, publicId) {
    await delOne('public', publicId);
  },
  async listPublic({ limit, after, ownerUid }) {
    const all = (await getAll<{ meta: PublicTemplate }>('public')).map((r) => r.meta);
    return all
      .filter((m) => (!ownerUid || m.ownerUid === ownerUid) && (!after || (m.publishedAt ?? 0) < after))
      .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
      .slice(0, ownerUid ? undefined : limit);
  },
  async getPublic(publicId) {
    return (await getOne<{ meta: PublicTemplate }>('public', publicId))?.meta ?? null;
  },
  async getPublicFrame(publicId) {
    const rec = await getOne<{ frame: { type: string; data: ArrayBuffer } | null }>('public', publicId);
    return rec?.frame ? new Blob([rec.frame.data], { type: rec.frame.type }) : null;
  },
  async countPublicUse(publicId) {
    const rec = await getOne<{ meta: PublicTemplate; frame: unknown }>('public', publicId);
    if (rec) await putOne('public', publicId, { ...rec, meta: { ...rec.meta, uses: rec.meta.uses + 1 } });
  },
};
