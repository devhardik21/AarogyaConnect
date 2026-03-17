import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Using PostCSS + @tailwindcss/postcss for Tailwind v4 (more stable than @tailwindcss/vite)
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
