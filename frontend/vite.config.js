import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/analyze': 'http://localhost:5000',
      '/brand-guardian': 'http://localhost:5000',
      '/deep-dive': 'http://localhost:5000',
      '/optimize': 'http://localhost:5000',
      '/health': 'http://localhost:5000',
    }
  }
})
