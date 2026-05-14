import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // Tauri configuration
  clearScreen: false,
  build: {
    minify: 'esbuild',
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
          if (id.includes('mermaid')) return 'vendor-mermaid'
          if (id.includes('@milkdown') || id.includes('prosemirror')) return 'vendor-milkdown'
          if (id.includes('@codemirror') || id.includes('codemirror')) return 'vendor-codemirror'
          if (id.includes('katex')) return 'vendor-katex'
          if (id.includes('lucide-react')) return 'vendor-icons'
          return 'vendor-misc'
        },
      },
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
})
