import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // 🚀 ADD THIS TEST BLOCK
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,

    // 🚨 FIXED: Proxies now route exactly where they are supposed to in the cloud
    proxy: {
      '/api': {
        target: 'https://hyperlife-backend.onrender.com', // Rerouted to Laravel
        changeOrigin: true,
        secure: false,
      },
      '/ai': {
        target: 'https://hyperlife-ai-core.onrender.com', // Rerouted to the Python AI Core
        changeOrigin: true,
        secure: false,
      }
    }
  },
});