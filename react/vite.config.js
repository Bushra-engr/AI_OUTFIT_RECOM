import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/wardrobe': 'http://127.0.0.1:8002',
      '/recommend': 'http://127.0.0.1:8002',
      '/outfit': 'http://127.0.0.1:8002',
      '/api': 'http://127.0.0.1:8002',
      '/profile': 'http://127.0.0.1:8002',
      '/health': 'http://127.0.0.1:8002',
    }
  },
  build: {
    outDir: process.env.VERCEL ? 'dist' : '../backend/static',
    emptyOutDir: false
  }
})
