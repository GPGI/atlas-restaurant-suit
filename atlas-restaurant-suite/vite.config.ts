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
          // CRITICAL: React and React DOM MUST be in the main bundle or load first
          // Don't split React - it causes loading order issues
          // Keep React in main bundle to ensure it's always available
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react/jsx-runtime')) {
            // Return undefined to include in main bundle
            return undefined;
          }
          
          // React Router - depends on React
          if (id.includes('react-router')) {
            return 'vendor-router';
          }
          
          // Admin pages - only loaded when staff accesses admin
          if (id.includes('src/pages/StaffDashboard') || id.includes('src/pages/MenuEditor')) {
            return 'admin';
          }
          
          // Drag and drop library - only needed in MenuEditor
          if (id.includes('@dnd-kit')) {
            return 'dnd';
          }
          
          // UI libraries - shared across app (depends on React)
          if (id.includes('@radix-ui')) {
            return 'ui';
          }
          
          // Supabase - large library
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // Other vendor libraries (but NOT React)
          if (id.includes('node_modules') && 
              !id.includes('react') && 
              !id.includes('react-dom') &&
              !id.includes('react-router')) {
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
