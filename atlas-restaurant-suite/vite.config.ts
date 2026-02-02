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
          // CRITICAL: React and ALL React-dependent libraries MUST be in main bundle
          // This ensures React is available before any code tries to use it
          
          // React core libraries
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react/jsx-runtime')) {
            return undefined; // Include in main bundle
          }
          
          // ALL React-dependent libraries - must be in main bundle
          // These libraries use React hooks, context, or components
          const reactDependentLibs = [
            '@radix-ui',           // UI components using React.createContext
            '@tanstack/react-query', // Uses React hooks
            'react-hook-form',     // Uses React hooks
            'react-router',        // Uses React components
            'react-day-picker',    // React component library
            'react-resizable-panels', // React component library
            'embla-carousel-react', // React component library
            'qrcode.react',        // React component library
            'recharts',            // React chart library
            'sonner',              // React toast library
            'lucide-react',        // React icon library
            'next-themes',         // React theme library
            'vaul',                // React drawer library (uses React)
          ];
          
          if (reactDependentLibs.some(lib => id.includes(lib))) {
            return undefined; // Include in main bundle
          }
          
          // Our React-dependent source code
          if (id.includes('src/context/') || 
              id.includes('src/components/ui/') ||
              id.includes('src/App.tsx') ||
              id.includes('src/main.tsx')) {
            return undefined; // Include in main bundle
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
          // Only include truly non-React libraries in vendor chunk
          if (id.includes('node_modules') && 
              !id.includes('react') && 
              !id.includes('react-dom') &&
              !reactDependentLibs.some(lib => id.includes(lib))) {
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
