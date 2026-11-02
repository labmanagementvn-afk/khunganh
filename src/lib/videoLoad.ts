// Mở file video người dùng chọn sao cho chạy được cả trên iPhone (Safari) lẫn Chrome / Android.

const HEVC_HINT =
  'Video này có thể quay ở định dạng HEVC (H.265, mặc định của iPhone) mà trình duyệt này không giải mã được. ' +
  'Hãy mở trang bằng Safari trên iPhone, hoặc trên iPhone vào Cài đặt → Camera → Định dạng → chọn "Tương thích nhất" rồi quay lại, ' +
  'hoặc chia sẻ video qua Zalo/Messenger rồi tải về (video sẽ được chuyển sang MP4).';

function mediaErrorMessage(el: HTMLVideoElement): string {
  const code = el.error?.code;
  if (code === 4 || code === 3) return HEVC_HINT; // MEDIA_ERR_SRC_NOT_SUPPORTED / MEDIA_ERR_DECODE
  return 'Không đọc được video này. Hãy thử lại hoặc chọn video khác.';
}

/**
 * Tạo thẻ <video> từ file và đợi tới khi có khung hình đầu tiên.
 * - Gắn vào trang (ẩn) và gọi play() ngay: Safari trên iPhone không tải dữ liệu của video
 *   nằm ngoài trang cho tới khi được yêu cầu phát, nên đợi "loadeddata" trước sẽ treo mãi.
 * - Video không giải mã được phần hình (thường là HEVC trên Chrome/Android) có videoWidth = 0
 *   dù vẫn phát được tiếng → báo lỗi rõ ràng thay vì im lặng.
 */
export async function loadVideoFile(file: File, timeoutMs = 30000): Promise<{ el: HTMLVideoElement; url: string }> {
  const url = URL.createObjectURL(file);
  const el = document.createElement('video');
  el.muted = true;
  el.defaultMuted = true;
  el.playsInline = true;
  el.setAttribute('playsinline', '');
  el.setAttribute('webkit-playsinline', '');
  el.loop = true;
  el.preload = 'auto';
  // Không dùng display:none – một số trình duyệt ngừng giải mã khung hình của video bị ẩn hẳn
  el.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1';
  document.body.appendChild(el);
  el.src = url;
  el.load();
  el.play().catch(() => {
    /* sẽ thử phát lại sau khi có dữ liệu */
  });

  const fail = (msg: string) => {
    el.pause();
    el.removeAttribute('src');
    el.load();
    el.remove();
    URL.revokeObjectURL(url);
    return new Error(msg);
  };

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const done = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ['loadeddata', 'canplay', 'playing', 'timeupdate'].forEach((ev) => el.removeEventListener(ev, check));
      if (err) reject(err);
      else resolve();
    };
    const check = () => {
      if (el.readyState < 2) return;
      if (el.videoWidth > 0 && el.videoHeight > 0) done();
      else done(fail(HEVC_HINT));
    };
    ['loadeddata', 'canplay', 'playing', 'timeupdate'].forEach((ev) => el.addEventListener(ev, check));
    el.addEventListener('error', () => done(fail(mediaErrorMessage(el))), { once: true });
    const timer = setTimeout(
      () => done(fail(file.size > 300 * 1024 * 1024 ? 'Video quá nặng để xử lý trên trình duyệt. Hãy cắt ngắn hoặc giảm chất lượng video trước.' : HEVC_HINT)),
      timeoutMs,
    );
    check();
  });
  if (el.paused) await el.play().catch(() => {});
  return { el, url };
}

/** Giải phóng video cũ khi đổi video */
export function disposeVideo(v: { el: HTMLVideoElement; url: string }) {
  v.el.pause();
  v.el.removeAttribute('src');
  v.el.load();
  v.el.remove();
  URL.revokeObjectURL(v.url);
}
