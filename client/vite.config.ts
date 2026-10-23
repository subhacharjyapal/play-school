import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev server proxies API + uploads to the Express backend so the browser
// sees a single origin (cookies work without CORS headaches in dev).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: false },
      "/uploads": { target: "http://localhost:4000", changeOrigin: false },
    },
  },
  build: {
    sourcemap: false,
  },
});
