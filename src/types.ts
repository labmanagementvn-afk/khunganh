export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
}

export type FontStyle = 'normal' | 'bold' | 'italic' | 'italic bold';
export type TextAlign = 'left' | 'center' | 'right';

/** Một dòng chữ trên khung. `fixed` = chữ cố định, `input` = chữ lấy từ ô nhập khi tạo ảnh. */
export interface TextElement {
  id: string;
  kind: 'fixed' | 'input';
  /** Nội dung chữ cố định, hoặc giá trị mẫu/mặc định của ô nhập */
  text: string;
  /** Tên ô nhập (chỉ dùng cho kind = input), vd: "Mã sản phẩm" */
  label: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  fontStyle: FontStyle;
  fill: string;
  align: TextAlign;
  stroke: string;
  strokeWidth: number;
  uppercase: boolean;
  /** Khoảng cách giữa các ký tự (px) */
  letterSpacing?: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhotoSlot extends Rect {
  radius: number;
}

/** Khung ảnh mẫu. Toạ độ tính theo pixel của ảnh xuất (width × height). */
export interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  background: string;
  frame: (Rect & { blobId: string }) | null;
  photoSlot: PhotoSlot;
  /** true = ảnh sản phẩm nằm đè lên khung */
  photoOnTop: boolean;
  texts: TextElement[];
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
  /** Ngành (dùng để lọc trên Bảng tin) */
  category?: string;
  /** Mã bản chia sẻ công khai (nếu chủ khung đã chia sẻ) */
  publicId?: string;
  /** Khung được sao chép từ mẫu công khai nào */
  sourcePublicId?: string;
}

/** Mẫu khung được chia sẻ công khai – ai cũng xem và dùng được */
export interface PublicTemplate extends Omit<Template, 'publicId' | 'sourcePublicId' | 'frame'> {
  frame: (Rect & { blobId: string }) | null;
  ownerUid: string;
  ownerName: string;
  ownerPhoto: string | null;
  /** Số lần người khác dùng mẫu này */
  uses: number;
  /** Có giá trị khi đã sẵn sàng hiển thị trên Bảng tin */
  publishedAt?: number;
}

export interface HistoryEntry {
  id: string;
  templateId: string;
  templateName: string;
  /** Giá trị đã nhập: { [label]: value } */
  inputs: Record<string, string>;
  /** Ảnh xem lại (data URL JPEG, cạnh dài ≤720px) */
  thumbnail: string;
  /** Chỉ có ở mục lịch sử cũ: file ảnh gốc lưu riêng */
  resultBlobId?: string;
  mime: string;
  width: number;
  height: number;
  createdAt: number;
}
