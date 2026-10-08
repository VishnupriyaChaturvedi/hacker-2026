import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The React dev server proxies /api to the FastAPI backend so the browser
// talks to a single origin during development (no CORS surprises).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
