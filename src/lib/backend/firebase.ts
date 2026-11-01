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
  increment,
  initializeFirestore,
  limit,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { HistoryEntry, PublicTemplate, Template } from '../../types';
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

    // ---------------- Mẫu công khai ----------------
    // publicTemplates/{id}: thông tin mẫu (ai cũng đọc được); ảnh khung nằm ở publicTemplates/{id}/chunks/{n}.
    // `publishedAt` chỉ được ghi sau khi ảnh khung đã lưu xong → Bảng tin không bao giờ thấy mẫu dở dang.
    async publishTemplate(owner, tpl, frame) {
      const id = tpl.publicId || newId();
      const ref = doc(db, 'publicTemplates', id);
      const existing = tpl.publicId ? await getDoc(ref) : null;
      const now = Date.now();
      const data: Omit<PublicTemplate, 'uses' | 'publishedAt'> = {
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
        createdAt: existing?.exists() ? (existing.data().createdAt as number) : now,
        updatedAt: now,
        ownerUid: owner.uid,
        ownerName: owner.displayName,
        ownerPhoto: owner.photoURL ?? null,
      };
      if (existing?.exists()) await setDoc(ref, clean(data), { merge: true });
      else await setDoc(ref, clean({ ...data, uses: 0 }));

      const oldChunks = existing?.exists() ? ((existing.data().frameChunks as number) ?? 0) : 0;
      let chunks = 0;
      if (frame) {
        const bytes = new Uint8Array(await frame.arrayBuffer());
        chunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE));
        for (let i = 0; i < chunks; i++) {
          await setDoc(doc(db, 'publicTemplates', id, 'chunks', String(i)), {
            data: Bytes.fromUint8Array(bytes.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)),
          });
        }
      }
      for (let i = chunks; i < oldChunks; i++) await deleteDoc(doc(db, 'publicTemplates', id, 'chunks', String(i)));
      await updateDoc(ref, {
        frameChunks: chunks,
        frameType: frame?.type ?? null,
        ...(existing?.exists() && existing.data().publishedAt ? {} : { publishedAt: now }),
      });
      blobCache.delete('public:' + id);
      return id;
    },
    async unpublishTemplate(_owner, publicId) {
      const ref = doc(db, 'publicTemplates', publicId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      // Xoá ảnh trước: quy tắc bảo mật của chunk kiểm tra chủ sở hữu qua tài liệu cha
      const chunks = (snap.data().frameChunks as number) ?? 0;
      await Promise.all(Array.from({ length: chunks }, (_, i) => deleteDoc(doc(db, 'publicTemplates', publicId, 'chunks', String(i)))));
      await deleteDoc(ref);
    },
    async listPublic({ limit: n, after, ownerUid }) {
      const col = collection(db, 'publicTemplates');
      const q = ownerUid
        ? query(col, where('ownerUid', '==', ownerUid))
        : after
          ? query(col, orderBy('publishedAt', 'desc'), startAfter(after), limit(n))
          : query(col, orderBy('publishedAt', 'desc'), limit(n));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ ...(d.data() as PublicTemplate), id: d.id }));
      // Lọc theo chủ sở hữu không cần chỉ mục ghép: sắp xếp phía trình duyệt
      return ownerUid ? list.filter((x) => x.publishedAt).sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0)) : list;
    },
    async getPublic(publicId) {
      const snap = await getDoc(doc(db, 'publicTemplates', publicId));
      if (!snap.exists() || !snap.data().publishedAt) return null;
      return { ...(snap.data() as PublicTemplate), id: snap.id };
    },
    async getPublicFrame(publicId) {
      const key = 'public:' + publicId;
      const cached = blobCache.get(key);
      if (cached) return cached;
      const snap = await getDoc(doc(db, 'publicTemplates', publicId));
      const chunks = snap.exists() ? ((snap.data().frameChunks as number) ?? 0) : 0;
      if (!chunks) return null;
      const parts = await Promise.all(
        Array.from({ length: chunks }, (_, i) =>
          getDoc(doc(db, 'publicTemplates', publicId, 'chunks', String(i))).then((c) => (c.data()!.data as Bytes).toUint8Array()),
        ),
      );
      const blob = new Blob(parts as BlobPart[], { type: (snap.data()!.frameType as string) || 'image/png' });
      blobCache.set(key, blob);
      return blob;
    },
    async countPublicUse(publicId) {
      if (!auth.currentUser) return;
      await updateDoc(doc(db, 'publicTemplates', publicId), { uses: increment(1) }).catch(() => {});
    },
  };
  return api;
}
