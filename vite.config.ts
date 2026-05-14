import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function getPackageName(id: string) {
  const normalized = id.split('node_modules/').pop()?.replace(/\\/g, '/')
  if (!normalized) return null

  const parts = normalized.split('/')
  if (parts[0]?.startsWith('@')) {
    return `${parts[0]}/${parts[1] ?? ''}`
  }

  return parts[0]
}

const milkdownPackages = new Set([
  '@prosemirror-adapter/core',
  '@prosemirror-adapter/react',
  'crelt',
  'orderedmap',
  'prosemirror-changeset',
  'prosemirror-commands',
  'prosemirror-dropcursor',
  'prosemirror-gapcursor',
  'prosemirror-history',
  'prosemirror-inputrules',
  'prosemirror-keymap',
  'prosemirror-model',
  'prosemirror-schema-list',
  'prosemirror-state',
  'prosemirror-tables',
  'prosemirror-transform',
  'prosemirror-view',
])

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
          if (!packageName) return

          if (packageName === 'react' || packageName === 'react-dom' || packageName === 'scheduler') {
            return 'vendor-react'
          }
          if (packageName === 'lucide-react') return 'vendor-icons'
          if (packageName.startsWith('@milkdown/') || milkdownPackages.has(packageName)) {
            return 'vendor-milkdown'
          }
          if (packageName.startsWith('@codemirror/') || packageName === 'codemirror' || packageName.startsWith('@lezer/')) {
            return 'vendor-codemirror'
          }
          if (packageName === 'katex') return 'vendor-katex'
          if (packageName === 'marked') return 'vendor-markdown'
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
