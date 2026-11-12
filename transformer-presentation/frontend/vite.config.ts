import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the FastAPI backend runs on :8000; Vite proxies API and WebSocket traffic to it.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // expose on the LAN so participants can join from their own devices
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
});
