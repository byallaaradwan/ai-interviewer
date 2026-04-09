import { defineConfig } from 'vite';

// Phase 0a: Vite serves the existing single-file HTML as-is.
// Phase 0b will introduce React components and a new entry point.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
