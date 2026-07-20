import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': 'http://localhost:3000',
      '/admin': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cars: resolve(__dirname, 'cars.html'),
        'real-estate': resolve(__dirname, 'real-estate.html'),
        'wealth-assets': resolve(__dirname, 'wealth-assets.html'),
        'digital-services': resolve(__dirname, 'digital-services.html'),
        blog: resolve(__dirname, 'blog.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        books: resolve(__dirname, 'books.html'),
        'our-works': resolve(__dirname, 'our-works.html'),
        'signup-ghana': resolve(__dirname, 'signup-ghana.html'),
      },
    },
  },
});
