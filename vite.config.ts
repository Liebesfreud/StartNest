import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('@tanstack/react-query')) return 'query'
          if (id.includes('react-router')) return 'router'
          if (id.includes('@dnd-kit')) return 'dnd'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('zod')) return 'validation'
          return 'vendor'
        },
      },
    },
  },
})
