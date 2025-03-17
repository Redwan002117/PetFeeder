import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from 'fs';

// Check if CNAME exists to determine if we're using a custom domain
const hasCNAME = fs.existsSync('./public/CNAME');

// Custom plugin for Supabase initialization
const injectSupabaseInit = () => {
  return {
    name: 'inject-supabase-init',
    transformIndexHtml(html) {
      // Add Supabase initialization script to the head
      return html.replace(
        '</head>',
        `<script>
          // Initialize Supabase client
          document.addEventListener('DOMContentLoaded', function() {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            if (supabaseUrl && supabaseAnonKey) {
              console.log('Supabase client initialized with environment variables');
            } else {
              console.warn('Supabase environment variables not found');
            }
          });
        </script>
        </head>`
      );
    }
  };
};

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
    injectSupabaseInit(),
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
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
            'class-variance-authority',
            'clsx',
            'lucide-react',
            'tailwind-merge'
          ],
        },
      },
    },
  },
  preview: {
    port: 8080,
  },
}));
