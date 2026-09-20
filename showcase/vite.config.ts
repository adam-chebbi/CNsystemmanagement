import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// The showcase is a standalone static site — in dev it reaches the management app's public API
// through this proxy (same-origin, no CORS involved); in production it calls the API's absolute
// URL directly (see src/config/site.ts, API_BASE_URL) since the two live on different domains.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: env.SHOWCASE_DEV_API_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
