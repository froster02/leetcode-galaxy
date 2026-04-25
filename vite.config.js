import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// GITHUB_PAGES_BASE_PATH is set by the deploy workflow from configure-pages output
// e.g. '/leetcode-galaxy' for https://froster02.github.io/leetcode-galaxy
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES_BASE_PATH
    ? `${process.env.GITHUB_PAGES_BASE_PATH}/`
    : '/',
})
