import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' giúp build chạy được ở mọi đường dẫn (Firebase Hosting, GitHub Pages...)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'], konva: ['konva', 'react-konva'] },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
