import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  build: {
    // KaTeX + react-markdown push the main chunk over the default 500KB
    // warning threshold. The bundle is ~200KB gzipped and cached after
    // first load, so this warning isn't actionable here.
    chunkSizeWarningLimit: 900,
  },
})
