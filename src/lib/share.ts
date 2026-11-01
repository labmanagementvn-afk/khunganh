export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function canShareFiles(): boolean {
  try {
    const probe = new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Mở bảng chia sẻ của hệ điều hành – trên iPhone/Android có mục "Lưu hình ảnh" / "Lưu vào Ảnh". */
export async function shareBlob(blob: Blob, filename: string): Promise<boolean> {
  const file = new File([blob], filename, { type: blob.type });
  try {
    await navigator.share({ files: [file] });
    return true;
  } catch (e) {
    if ((e as Error).name === 'AbortError') return false;
    throw e;
  }
}

export function safeFileName(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'anh'
  );
}
