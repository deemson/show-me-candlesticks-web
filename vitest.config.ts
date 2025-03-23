import { defineConfig } from "vite";
import * as path from "node:path";
import process from "node:process";

process.env.TZ = "UTC";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
