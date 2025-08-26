import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// Tailwind Configuration
import path from "path"
import tailwindcss from "@tailwindcss/vite"

//Build optimization
import { visualizer } from "rollup-plugin-visualizer";


export default defineConfig({
  plugins: [react(), cloudflare(), tailwindcss(), visualizer({
    open: false,
    filename: "dist/stats.html",
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
