import type { Backend } from './backend';
import { newId } from './id';
import type { AppUser, PublicTemplate, Template } from '../types';

/** Link chia sẻ trực tiếp tới một mẫu công khai */
export function publicUrl(publicId: string): string {
  return `${location.origin}${location.pathname}#/t/${publicId}`;
}

/** Chia sẻ (hoặc cập nhật bản chia sẻ) khung của người dùng; ghi lại mã công khai vào khung */
export async function publishTemplate(store: Backend, pub: Backend, user: AppUser, tpl: Template): Promise<Template> {
  const frame = tpl.frame?.blobId ? await store.getBlob(user.uid, tpl.frame.blobId) : null;
  const publicId = await pub.publishTemplate(user, tpl, frame);
  const updated = { ...tpl, publicId };
  if (tpl.publicId !== publicId) await store.saveTemplate(user.uid, updated);
  return updated;
}

export async function unpublishTemplate(store: Backend, pub: Backend, user: AppUser, tpl: Template): Promise<Template> {
  if (tpl.publicId) await pub.unpublishTemplate(user, tpl.publicId);
  const updated: Template = { ...tpl };
  delete updated.publicId;
  await store.saveTemplate(user.uid, updated);
  return updated;
}

/** Dùng một mẫu công khai: sao chép vào kho của người dùng (khách: lưu trên máy này) */
export async function copyPublicTemplate(store: Backend, pub: Backend, uid: string, p: PublicTemplate, signedIn: boolean): Promise<Template> {
  const frameBlob = p.frame ? await pub.getPublicFrame(p.id) : null;
  const blobId = frameBlob ? await store.putBlob(uid, frameBlob) : '';
  const now = Date.now();
  const tpl: Template = {
    id: newId(),
    name: p.name,
    width: p.width,
    height: p.height,
    background: p.background,
    frame: p.frame && blobId ? { x: p.frame.x, y: p.frame.y, width: p.frame.width, height: p.frame.height, blobId } : null,
    photoSlot: { ...p.photoSlot },
    photoOnTop: p.photoOnTop,
    texts: p.texts.map((t) => ({ ...t })),
    thumbnail: p.thumbnail,
    createdAt: now,
    updatedAt: now,
    sourcePublicId: p.id,
  };
  await store.saveTemplate(uid, tpl);
  if (signedIn && p.ownerUid !== uid) pub.countPublicUse(p.id).catch(() => {});
  return tpl;
}
