import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative assets work both on GitHub Pages (/yeita-vie/) and at a root domain (Vercel).
  base: './',
})
