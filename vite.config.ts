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
    open: true,
    filename: "dist/stats.html",
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'zod': ['zod'],
          '@supabase/node-fetch': ['@supabase/node-fetch'],
          'react-dom': ['react-dom'],
          'ai': ['ai'],
        }
      },
    },
  },
});
