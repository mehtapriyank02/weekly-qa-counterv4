import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the build works whether it's served from a GitHub Pages
// project subpath (username.github.io/repo/) or a custom domain root.
export default defineConfig({
  base: './',
  plugins: [react()],
})
