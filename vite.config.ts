import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/PetFeeder/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: mode !== "production",
    rollupOptions: {
      external: [
        'firebase',
        'firebase/app',
        'firebase/auth',
        'firebase/database',
        'firebase/firestore',
        'firebase/storage',
        'firebase/messaging',
      ],
      output: {
        globals: {
          firebase: 'firebase',
          'firebase/app': 'firebase.app',
          'firebase/auth': 'firebase.auth',
          'firebase/database': 'firebase.database',
          'firebase/firestore': 'firebase.firestore',
          'firebase/storage': 'firebase.storage',
          'firebase/messaging': 'firebase.messaging',
        },
      },
    },
  },
}));
