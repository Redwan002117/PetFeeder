import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from 'fs';

// Check if CNAME exists to determine if we're using a custom domain
const hasCNAME = fs.existsSync('./public/CNAME');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Use root path for custom domains, otherwise use repo name for GitHub Pages
  base: hasCNAME ? '/' : '/PetFeeder/',
  server: {
    host: "::",
    port: 3000,
    open: true,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  preview: {
    port: 5000,
  },
}));
