import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'core/static/js/vite',
    rollupOptions: {
      input: {
        main: 'core/static/ts/tree-test.ts',
        editor: 'core/static/ts/editor.ts',
        modals: 'core/static/ts/modals.ts',
        treeTest: 'core/static/ts/tree-test.ts',
        misc: 'core/static/ts/misc.ts'
      },
      output: {
        entryFileNames: '[name].js',  
         manualChunks: {
          'vendor-ui': ['lit', 'alpinejs', 'flowbite'], // UI libraries
        }
      }
    }
  }
})
