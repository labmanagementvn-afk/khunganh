// Tạo sẵn ảnh xem trước cho mọi mẫu có sẵn → public/preset-thumbs/<id>-<mã băm>.jpg
// Chạy lại sau khi thêm / sửa mẫu:  npm run thumbs
// Cần Playwright + Chromium:        npm i -D playwright && npx playwright install chromium
const fs = require('fs');
const path = require('path');

(async () => {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    console.error('Cần Playwright: npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }
  const { createServer } = await import('vite');
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'public', 'preset-thumbs');
  const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(server.resolvedUrls.local[0]);
    const items = await page.evaluate(async () => {
      await document.fonts.ready;
      const { PRESETS } = await import('/src/presets/presets.ts');
      const { renderPresetPreview } = await import('/src/presets/render.ts');
      const { presetThumbKey } = await import('/src/presets/thumbs.ts');
      const out = [];
      for (const p of PRESETS) out.push({ key: presetThumbKey(p), url: await renderPresetPreview(p, 480) });
      return out;
    });
    fs.mkdirSync(outDir, { recursive: true });
    const keep = new Set(items.map((i) => `${i.key}.jpg`));
    let added = 0;
    for (const { key, url } of items) {
      const file = path.join(outDir, `${key}.jpg`);
      if (fs.existsSync(file)) continue;
      fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
      added++;
    }
    let removed = 0;
    for (const f of fs.readdirSync(outDir)) {
      if (!keep.has(f)) {
        fs.unlinkSync(path.join(outDir, f));
        removed++;
      }
    }
    console.log(`Ảnh xem trước: ${items.length} mẫu · thêm ${added} · xoá ${removed} ảnh cũ`);
  } finally {
    await browser.close();
    await server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
