# Khung Ảnh Sản Phẩm

Web app (chạy tốt trên điện thoại) để chèn ảnh sản phẩm vào khung mẫu, tự động điền mã sản phẩm và xuất ảnh.

## Tính năng

- **Đăng nhập bằng Gmail** (Google) – khung mẫu và lịch sử ảnh được lưu theo tài khoản, dùng được trên nhiều thiết bị.
- **Tạo khung mẫu**
  - Tải ảnh khung từ điện thoại/máy tính (nên dùng PNG có vùng trong suốt).
  - Kéo/thả, phóng to/thu nhỏ khung và **vùng đặt ảnh sản phẩm** (có bo góc, nhập số chính xác X/Y/Rộng/Cao).
  - Thêm **text cố định** (vd: `Mã sản phẩm:`) và **text nhập** (vd: ô `Mã sản phẩm` → điền `AC-989VN` khi tạo ảnh).
  - Chỉnh phông chữ (hỗ trợ tiếng Việt), cỡ chữ, màu, đậm/nghiêng, in hoa, căn lề, viền chữ, xoay.
  - Chọn kích thước ảnh xuất (theo khung, 1:1, 4:5, 9:16…), màu nền, ảnh nằm dưới hoặc đè lên khung.
  - Xem thử với 1 ảnh mẫu trước khi lưu. Lưu với tên để dùng lại; sửa/xoá bất kỳ lúc nào.
- **Tạo ảnh**
  - Chọn khung → chọn ảnh từ thư viện ảnh / máy ảnh / bộ nhớ.
  - Kéo để di chuyển, chụm 2 ngón tay (hoặc thanh trượt / con lăn chuột) để phóng to, xoay 90°, “Lấp đầy” / “Hiện toàn bộ”.
  - Nhập mã sản phẩm → chữ tự xuất hiện đúng vị trí. Có thể **thêm chữ** tuỳ ý cho riêng ảnh đó.
  - **Xuất ảnh** đúng độ phân giải của khung (JPG hoặc PNG) → **Lưu vào Ảnh / Chia sẻ** (bảng chia sẻ của iPhone/Android) hoặc **Tải về**.
  - “Tạo ảnh tiếp” giữ nguyên khung để làm hàng loạt sản phẩm nhanh.
- **Lịch sử**: mọi ảnh đã xuất được lưu lại (kèm mã đã nhập, thời gian) để xem/tải lại hoặc xoá.

## Chạy thử nhanh (không cần Firebase)

```bash
npm install
npm run dev
```

Mở địa chỉ hiển thị (vd `http://localhost:5173`). Khi chưa cấu hình Firebase, app chạy ở **chế độ demo**:
không đăng nhập Google, dữ liệu lưu trong trình duyệt (IndexedDB).

## Bật đăng nhập Gmail + lưu dữ liệu online (Firebase – gói miễn phí Spark)

1. Vào <https://console.firebase.google.com> → **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable**.
3. **Build → Firestore Database → Create database** (chọn location gần, ví dụ `asia-southeast1`).
4. **Project settings → General → Your apps → Web (</>)** → đăng ký app, sao chép cấu hình.
5. Tạo file `.env.local` từ `.env.example` và điền các giá trị:

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<project-id>
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   ```

6. Triển khai quy tắc bảo mật và đưa web lên Firebase Hosting:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add          # chọn project vừa tạo
   npm run build
   firebase deploy             # deploy Hosting + Firestore rules
   ```

   App sẽ chạy tại `https://<project-id>.web.app`. Mở trên điện thoại và có thể “Thêm vào màn hình chính” để dùng như app.

> Nếu deploy lên tên miền khác (Vercel, Netlify, GitHub Pages…), thêm tên miền đó vào
> **Authentication → Settings → Authorized domains**.

### Tự động deploy bằng GitHub Actions (khuyên dùng)

Workflow `.github/workflows/deploy.yml` tự build và deploy (Hosting + Firestore rules) mỗi khi có commit vào `main`,
hoặc chạy tay ở tab **Actions → Deploy to Firebase → Run workflow**. Chỉ cần cài đặt một lần:

1. **Cấu hình web** – trong GitHub repo: **Settings → Secrets and variables → Actions → tab Variables → New repository variable**,
   tạo 5 biến với giá trị lấy ở bước 4 phía trên:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`.
2. **Tài khoản dịch vụ để deploy** – mở <https://console.cloud.google.com/iam-admin/serviceaccounts> (chọn đúng project)
   → **Create service account** (vd tên `github-deploy`) → gán các role:
   **Firebase Admin**, **API Keys Viewer**, **Service Usage Consumer** → Done.
   Bấm vào tài khoản vừa tạo → **Keys → Add key → Create new key → JSON** → tải file về.
3. Trong GitHub: **Settings → Secrets and variables → Actions → tab Secrets → New repository secret**,
   tên `FIREBASE_SERVICE_ACCOUNT`, dán **toàn bộ nội dung file JSON** vào. Sau đó xoá file JSON khỏi máy.
4. Vào tab **Actions → Deploy to Firebase → Run workflow**. Khi xong, app chạy tại `https://<project-id>.web.app`.

### Lưu trữ ảnh

Ảnh khung được lưu trực tiếp trong Firestore (chia thành các khối < 1 MB) nên **không cần
Cloud Storage / gói Blaze** và không gặp lỗi CORS khi vẽ lên canvas.

Để tiết kiệm dung lượng, **lịch sử chỉ giữ 10 ảnh gần nhất** của mỗi tài khoản và chỉ lưu ảnh xem lại cỡ vừa
(≤720px, ~100 KB) cùng thông tin đã nhập – không lưu file ảnh gốc (người dùng tải ảnh về máy khi tạo).
Mỗi tài khoản vì vậy chỉ chiếm khoảng 1 MB cho lịch sử, cộng dung lượng các ảnh khung.

### Dùng không cần đăng nhập

Khách chưa đăng nhập vẫn tạo, chỉnh và tải ảnh bình thường (kể cả hàng loạt). Khung tự tạo được lưu trong
trình duyệt của máy đó, và ảnh tạo ra **không** được lưu lịch sử. Khách không dùng Firestore nên không tốn
hạn mức của project.

Cấu trúc dữ liệu (chỉ chủ tài khoản được đọc/ghi – xem `firestore.rules`):

```
users/{uid}/templates/{id}        khung mẫu (vị trí khung, vùng ảnh, các text, ảnh thu nhỏ)
users/{uid}/history/{id}          lịch sử: 10 ảnh gần nhất (ảnh xem lại + thông tin đã nhập)
users/{uid}/blobs/{id}/chunks/{n} dữ liệu ảnh nhị phân
```

## Công nghệ

React 18 + TypeScript + Vite, [Konva](https://konvajs.org) (canvas kéo/thả), Firebase Auth + Firestore.

```
src/
  pages/TemplateEditorPage.tsx  trình tạo/sửa khung mẫu
  pages/ComposePage.tsx         chèn ảnh, nhập mã, xuất ảnh
  pages/HistoryPage.tsx         lịch sử ảnh
  lib/backend/                  firebase.ts (online) và local.ts (chế độ demo)
```
