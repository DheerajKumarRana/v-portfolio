import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        photo: resolve(__dirname, 'photo.html'),
        videoServices: resolve(__dirname, 'video-services.html'),
        tag: resolve(__dirname, 'tag.html'),
      },
    },
  },
});
