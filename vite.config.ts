import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// Tailwind Configuration
import path from "path"
import tailwindcss from "@tailwindcss/vite"

//Build optimization
import { visualizer } from "rollup-plugin-visualizer";
import { loadEnv } from "vite";


export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Pre-bundle common/heavy deps to reduce many small dev requests
    optimizeDeps: {
      include: [
        "framer-motion",
        "@milkdown/kit",
        "@milkdown/react",
        "shiki"
      ]
    },
    plugins: [
      react(), 
      cloudflare({
        persist: { path: ".wrangler/state" },
        configPath: 'wrangler.json',
      }), 
      tailwindcss(), 
      visualizer({
        open: false,
        filename: "dist/stats.html",
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      middlewareMode: false,
    },
    define: {
      // Expose environment variables to the app
      'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'import.meta.env.SUPABASE_SERVICE_KEY': JSON.stringify(env.SUPABASE_SERVICE_KEY),
    }
  };
});
