import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  initializeFirestore,
  limit,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  setDoc,
} from 'firebase/firestore';
import type { HistoryEntry, Template } from '../../types';
import { HISTORY_LIMIT } from '../history';
import { newId } from '../id';
import type { Backend } from './types';

// Ảnh (khung, ảnh kết quả) được lưu thẳng trong Firestore dưới dạng các "chunk" nhị phân
// (mỗi chunk < 1 MiB). Cách này chạy được trên gói Spark miễn phí, không cần Cloud Storage
// và không vướng lỗi CORS khi vẽ ảnh lên canvas.
const CHUNK_SIZE = 900 * 1024;

export function createFirebaseBackend(config: Record<string, string>): Backend {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const userCol = (uid: string, name: string) => collection(db, 'users', uid, name);
  const userDoc = (uid: string, name: string, id: string) => doc(db, 'users', uid, name, id);
  const blobCache = new Map<string, Blob>();

  // Firestore không chấp nhận giá trị undefined
  const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v));

  const api: Backend = {
    mode: 'firebase',
    onAuthChange(cb) {
      return onAuthStateChanged(auth, (u) =>
        cb(
          u
            ? {
                uid: u.uid,
                displayName: u.displayName || u.email || 'Người dùng',
                email: u.email || '',
                photoURL: u.photoURL,
              }
            : null,
        ),
      );
    },
    async signIn() {
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        const code = (e as { code?: string }).code || '';
        if (
          code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment' ||
          code === 'auth/web-storage-unsupported'
        ) {
          await signInWithRedirect(auth, provider);
          return;
        }
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
        throw e;
      }
    },
    async signOut() {
      await fbSignOut(auth);
    },

    async listTemplates(uid) {
      const snap = await getDocs(query(userCol(uid, 'templates'), orderBy('updatedAt', 'desc')));
      return snap.docs.map((d) => ({ ...(d.data() as Template), id: d.id }));
    },
    async getTemplate(uid, id) {
      const snap = await getDoc(userDoc(uid, 'templates', id));
      return snap.exists() ? { ...(snap.data() as Template), id: snap.id } : null;
    },
    async saveTemplate(uid, t) {
      await setDoc(userDoc(uid, 'templates', t.id), clean(t));
    },
    async deleteTemplate(uid, id) {
      await deleteDoc(userDoc(uid, 'templates', id));
    },

    async listHistory(uid) {
      const snap = await getDocs(query(userCol(uid, 'history'), orderBy('createdAt', 'desc'), limit(HISTORY_LIMIT)));
      return snap.docs.map((d) => ({ ...(d.data() as HistoryEntry), id: d.id }));
    },
    async addHistory(uid, entry) {
      await setDoc(userDoc(uid, 'history', entry.id), clean(entry));
      // Chỉ giữ HISTORY_LIMIT mục gần nhất: đếm (rẻ) rồi xoá các mục cũ nhất
      const col = userCol(uid, 'history');
      const total = (await getCountFromServer(col)).data().count;
      if (total <= HISTORY_LIMIT) return;
      const old = await getDocs(query(col, orderBy('createdAt', 'asc'), limit(total - HISTORY_LIMIT)));
      await Promise.all(
        old.docs.map(async (d) => {
          await deleteDoc(d.ref);
          const blobId = (d.data() as HistoryEntry).resultBlobId;
          if (blobId) await api.deleteBlob(uid, blobId).catch(() => {});
        }),
      );
    },
    async deleteHistory(uid, id) {
      await deleteDoc(userDoc(uid, 'history', id));
    },

    async putBlob(uid, blob) {
      const id = newId();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const chunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE));
      for (let i = 0; i < chunks; i++) {
        const part = bytes.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await setDoc(doc(db, 'users', uid, 'blobs', id, 'chunks', String(i)), {
          data: Bytes.fromUint8Array(part),
        });
      }
      // Ghi metadata sau cùng: chỉ khi có metadata thì blob mới được coi là hoàn chỉnh
      await setDoc(userDoc(uid, 'blobs', id), {
        type: blob.type,
        size: bytes.length,
        chunks,
        createdAt: Date.now(),
      });
      blobCache.set(id, blob);
      return id;
    },
    async getBlob(uid, id) {
      const cached = blobCache.get(id);
      if (cached) return cached;
      const meta = await getDoc(userDoc(uid, 'blobs', id));
      if (!meta.exists()) throw new Error('Không tìm thấy dữ liệu ảnh');
      const { type, chunks } = meta.data() as { type: string; chunks: number };
      const parts = await Promise.all(
        Array.from({ length: chunks }, (_, i) =>
          getDoc(doc(db, 'users', uid, 'blobs', id, 'chunks', String(i))).then((s) => {
            if (!s.exists()) throw new Error('Dữ liệu ảnh bị thiếu');
            return (s.data().data as Bytes).toUint8Array();
          }),
        ),
      );
      const blob = new Blob(parts as BlobPart[], { type });
      blobCache.set(id, blob);
      return blob;
    },
    async deleteBlob(uid, id) {
      const meta = await getDoc(userDoc(uid, 'blobs', id));
      const chunks = meta.exists() ? (meta.data().chunks as number) : 0;
      await deleteDoc(userDoc(uid, 'blobs', id));
      await Promise.all(
        Array.from({ length: chunks }, (_, i) =>
          deleteDoc(doc(db, 'users', uid, 'blobs', id, 'chunks', String(i))),
        ),
      );
      blobCache.delete(id);
    },
  };
  return api;
}
