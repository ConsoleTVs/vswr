import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: 'src/vswr.ts',
      name: 'vswr',
      fileName: 'vswr',
    },
    rollupOptions: {
      external: ['swrev', 'vue'],
      output: {
        globals: {
          swrev: 'swrev',
          vue: 'Vue',
        },
      },
    },
  },
})
