import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: 'core/static/js/vite',
    rollupOptions: {
      output: {
        entryFileNames: 'bundle.js',  
         manualChunks: {
          'vendor-ui': ['lit'], // UI libraries
        }
      }
    }
  }
})
