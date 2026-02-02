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
          // CRITICAL: React and React DOM MUST be in the main bundle
          // Keep React in main bundle to ensure it's always available first
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react/jsx-runtime')) {
            return undefined; // Include in main bundle
          }
          
          // CRITICAL: Any code that uses React.createContext or React hooks
          // must also be in main bundle or load after React
          // This includes our context files and React-dependent UI components
          if (id.includes('src/context/') || 
              id.includes('src/components/ui/') ||
              id.includes('@radix-ui')) {
            return undefined; // Include in main bundle to ensure React is available
          }
          
          // React Router - depends on React, but can be lazy loaded
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
          
          // Supabase - large library, doesn't depend on React
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // Other vendor libraries (but NOT React or React-dependent code)
          if (id.includes('node_modules') && 
              !id.includes('react') && 
              !id.includes('react-dom') &&
              !id.includes('react-router') &&
              !id.includes('@radix-ui')) {
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
