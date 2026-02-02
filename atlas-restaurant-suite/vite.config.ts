import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // OPTIMIZATION: Code splitting for better performance
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React and React DOM should be in vendor chunk (loaded first)
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          
          // Admin pages - only loaded when staff accesses admin
          if (id.includes('src/pages/StaffDashboard') || id.includes('src/pages/MenuEditor')) {
            return 'admin';
          }
          
          // Drag and drop library - only needed in MenuEditor
          if (id.includes('@dnd-kit')) {
            return 'dnd';
          }
          
          // UI libraries - shared across app (but React must be available)
          if (id.includes('@radix-ui')) {
            return 'ui';
          }
          
          // Supabase - large library
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // React Router
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          
          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // OPTIMIZATION: Use esbuild for faster builds (default, but explicit)
    minify: 'esbuild',
    // Note: Console.logs will remain in production for debugging
    // To remove them, install terser: npm install -D terser
    // and change minify to 'terser' with drop_console option
  }
}));
