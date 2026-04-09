import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // base: '/page4/', // Убрали эту строку
  plugins: [react()],
  server: {
    port: 5004,
    host: '0.0.0.0',
    allowedHosts: ['xn--b1ajdba5acbodeeeaj1qb.xn--p1ai'],
  },
})
