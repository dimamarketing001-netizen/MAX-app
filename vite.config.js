import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/page4/',
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ['xn--b1ajdba5acbodeeeaj1qb.xn--p1ai'],
    proxy: {
      '/api': {
        target: 'http://localhost:5004',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
  }
})