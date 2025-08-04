import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// Tailwind Configuration
import path from "path"
import tailwindcss from "@tailwindcss/vite"



export default defineConfig({
  plugins: [react(), cloudflare(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      // AI SDKs and providers
      'ai',
      '@ai-sdk/google',
      '@ai-sdk/openai',
      '@ai-sdk/react',
      '@openrouter/ai-sdk-provider',

      // UI libraries
      'clsx',
      'class-variance-authority',
      'framer-motion',
      'lucide-react',
      'sonner',
      'shiki',
      'react-markdown',
      'remark-gfm',

      // Radix UI (often ESM-heavy)
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-tooltip',

      // Utility
      'remeda',
      'zod',
    ],
    exclude: [
      // Avoid pre-bundling things that are already optimized or not needed
      'hono', // Cloudflare edge-ready, avoid if using serverless
      'dotenv', // Only used at build/runtime
    ],
  },
});
