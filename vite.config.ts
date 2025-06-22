import { defineConfig } from "vite";
import * as path from "node:path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  optimizeDeps: {
    // required by ccxt
    include: ["http-proxy-agent", "https-proxy-agent", "socks-proxy-agent"],
  },
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
