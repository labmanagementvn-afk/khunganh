export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Không đọc được ảnh'));
    img.src = src;
  });
}

export async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return loadImage(URL.createObjectURL(blob));
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không xuất được ảnh'))), type, quality),
  );
}

/**
 * Đọc file ảnh người dùng chọn, thu nhỏ nếu cạnh dài vượt quá maxSide
 * (ảnh điện thoại 12MP+ rất nặng với canvas trên mobile).
 */
export async function prepareImageFile(
  file: Blob,
  maxSide: number,
  keepAlpha: boolean,
): Promise<{ blob: Blob; img: HTMLImageElement }> {
  const original = await blobToImage(file);
  const w = original.naturalWidth;
  const h = original.naturalHeight;
  const ratio = Math.min(1, maxSide / Math.max(w, h));
  if (ratio === 1) return { blob: file, img: original };

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(original.src);
  const blob = keepAlpha ? await canvasToBlob(canvas, 'image/png') : await canvasToBlob(canvas, 'image/jpeg', 0.92);
  return { blob, img: await blobToImage(blob) };
}

/** Tạo ảnh thu nhỏ (data URL JPEG) để hiển thị danh sách */
export function makeThumbnail(source: HTMLCanvasElement, maxSide = 360): string {
  const ratio = Math.min(1, maxSide / Math.max(source.width, source.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(source.width * ratio));
  c.height = Math.max(1, Math.round(source.height * ratio));
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

export { canvasToBlob };
