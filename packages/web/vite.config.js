import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Phase 0b: React entry via src/main.tsx
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: false,
  },
});
