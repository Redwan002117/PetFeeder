// vite.config.ts
import { defineConfig } from "file:///H:/PetFeeder/node_modules/vite/dist/node/index.js";
import react from "file:///H:/PetFeeder/node_modules/@vitejs/plugin-react/dist/index.mjs";
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "H:\\PetFeeder";
var hasCNAME = fs.existsSync("./public/CNAME");
var injectWebSocketTokenFix = () => {
  return {
    name: "inject-ws-token-fix",
    transformIndexHtml(html) {
      return html.replace(
        "</head>",
        `<script>
          // Fix for WebSocket token error in production
          window.__WS_TOKEN__ = window.__WS_TOKEN__ || null;
        </script>
        </head>`
      );
    }
  };
};
var vite_config_default = defineConfig(({ mode }) => ({
  // Use root path for custom domains, otherwise use repo name for GitHub Pages
  base: hasCNAME ? "/" : "/PetFeeder/",
  server: {
    host: "::",
    port: 3e3,
    open: true
  },
  plugins: [
    react(),
    injectWebSocketTokenFix()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: mode === "production"
      },
      mangle: true,
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"]
          // Removed firebase-vendor chunk
        }
      }
    }
  },
  preview: {
    port: 5e3
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJIOlxcXFxQZXRGZWVkZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkg6XFxcXFBldEZlZWRlclxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vSDovUGV0RmVlZGVyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5cclxuLy8gQ2hlY2sgaWYgQ05BTUUgZXhpc3RzIHRvIGRldGVybWluZSBpZiB3ZSdyZSB1c2luZyBhIGN1c3RvbSBkb21haW5cclxuY29uc3QgaGFzQ05BTUUgPSBmcy5leGlzdHNTeW5jKCcuL3B1YmxpYy9DTkFNRScpO1xyXG5cclxuLy8gQ3VzdG9tIHBsdWdpbiB0byBpbmplY3QgV2ViU29ja2V0IHRva2VuIGZpeFxyXG5jb25zdCBpbmplY3RXZWJTb2NrZXRUb2tlbkZpeCA9ICgpID0+IHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ2luamVjdC13cy10b2tlbi1maXgnLFxyXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcclxuICAgICAgLy8gQWRkIHRoZSBXZWJTb2NrZXQgdG9rZW4gZml4IHNjcmlwdCB0byB0aGUgaGVhZFxyXG4gICAgICByZXR1cm4gaHRtbC5yZXBsYWNlKFxyXG4gICAgICAgICc8L2hlYWQ+JyxcclxuICAgICAgICBgPHNjcmlwdD5cclxuICAgICAgICAgIC8vIEZpeCBmb3IgV2ViU29ja2V0IHRva2VuIGVycm9yIGluIHByb2R1Y3Rpb25cclxuICAgICAgICAgIHdpbmRvdy5fX1dTX1RPS0VOX18gPSB3aW5kb3cuX19XU19UT0tFTl9fIHx8IG51bGw7XHJcbiAgICAgICAgPC9zY3JpcHQ+XHJcbiAgICAgICAgPC9oZWFkPmBcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9O1xyXG59O1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICAvLyBVc2Ugcm9vdCBwYXRoIGZvciBjdXN0b20gZG9tYWlucywgb3RoZXJ3aXNlIHVzZSByZXBvIG5hbWUgZm9yIEdpdEh1YiBQYWdlc1xyXG4gIGJhc2U6IGhhc0NOQU1FID8gJy8nIDogJy9QZXRGZWVkZXIvJyxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiOjpcIixcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIGluamVjdFdlYlNvY2tldFRva2VuRml4KCksXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxyXG4gICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICBjb21wcmVzczoge1xyXG4gICAgICAgIGRyb3BfY29uc29sZTogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nLFxyXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyxcclxuICAgICAgfSxcclxuICAgICAgbWFuZ2xlOiB0cnVlLFxyXG4gICAgICBmb3JtYXQ6IHtcclxuICAgICAgICBjb21tZW50czogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAvLyBSZW1vdmVkIGZpcmViYXNlLXZlbmRvciBjaHVua1xyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgcHJldmlldzoge1xyXG4gICAgcG9ydDogNTAwMCxcclxuICB9LFxyXG59KSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBME4sU0FBUyxvQkFBb0I7QUFDdlAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFIZixJQUFNLG1DQUFtQztBQU16QyxJQUFNLFdBQVcsR0FBRyxXQUFXLGdCQUFnQjtBQUcvQyxJQUFNLDBCQUEwQixNQUFNO0FBQ3BDLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLG1CQUFtQixNQUFNO0FBRXZCLGFBQU8sS0FBSztBQUFBLFFBQ1Y7QUFBQSxRQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUtGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjtBQUdBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUE7QUFBQSxFQUV6QyxNQUFNLFdBQVcsTUFBTTtBQUFBLEVBQ3ZCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTix3QkFBd0I7QUFBQSxFQUMxQjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYyxTQUFTO0FBQUEsUUFDdkIsZUFBZSxTQUFTO0FBQUEsTUFDMUI7QUFBQSxNQUNBLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxRQUNOLFVBQVU7QUFBQSxNQUNaO0FBQUEsSUFDRjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBO0FBQUEsUUFFM0Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxFQUNSO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
