import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Temporary Cloudflare tunnel URLs change on every local testing session.
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
})
