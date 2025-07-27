import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8016,
    host: true
  },
  preview: {
    port: 8016,
    host: true,
    allowedHosts: ['divine-words.assistent.my.id', 'localhost']
  }
})