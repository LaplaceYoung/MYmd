import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function getPackageName(id: string): string {
  const normalized = id.replace(/\\/g, '/')
  const nodeModulesIndex = normalized.lastIndexOf('/node_modules/')
  if (nodeModulesIndex === -1) return ''
  const parts = normalized.slice(nodeModulesIndex + '/node_modules/'.length).split('/')
  if (parts[0]?.startsWith('@')) {
    return `${parts[0]}/${parts[1] ?? ''}`
  }
  return parts[0] ?? ''
}

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

          const packageName = getPackageName(id)

          if (['react', 'react-dom', 'scheduler', 'use-sync-external-store'].includes(packageName)) {
            return 'vendor-react'
          }
          if (packageName === 'katex') return 'vendor-katex'
          if (packageName === 'lucide-react') return 'vendor-icons'
          if (packageName.startsWith('@tauri-apps/')) return 'vendor-tauri'
          if (['zustand', 'p-queue'].includes(packageName)) return 'vendor-state'

          // Editor, diagram, and Markdown render packages have intertwined
          // transitive graphs. Let Rollup place them with their lazy entrypoints
          // so the generated graph stays aligned with runtime loading.
          return undefined
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
