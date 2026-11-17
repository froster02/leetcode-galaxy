import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// GITHUB_PAGES_BASE_PATH is set by the deploy workflow from configure-pages output
// e.g. '/leetcode-galaxy' for https://froster02.github.io/leetcode-galaxy
// Vercel sets VERCEL=1 during its builds; surface it to the client so the
// analytics scripts are only mounted there (see ON_VERCEL in src/App.jsx)
if (process.env.VERCEL === '1' && !process.env.VITE_VERCEL) process.env.VITE_VERCEL = '1'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES_BASE_PATH
    ? `${process.env.GITHUB_PAGES_BASE_PATH}/`
    : '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['framer-motion'],
        },
      },
    },
  },
})
