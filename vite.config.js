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
        services: resolve(__dirname, 'services.html'),
        tag: resolve(__dirname, 'tag.html'),
        subscription: resolve(__dirname, 'subscription.html'),
        booking: resolve(__dirname, 'booking.html'),
        // Owner-only pages — reachable by direct URL, never linked publicly.
        dashboard: resolve(__dirname, 'dashboard.html'),
        resetPassword: resolve(__dirname, 'reset-password.html'),
      },
    },
  },
});
