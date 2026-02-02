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
            'cmdk',                // React command menu library (uses React hooks)
            'input-otp',           // React OTP input library (uses React)
            '@hookform/resolvers', // React Hook Form resolvers
          ];
          
          if (reactDependentLibs.some(lib => id.includes(lib))) {
            return undefined; // Include in main bundle
          }
          
          // ALL source code must be in main bundle (it all uses React)
          if (id.includes('src/')) {
            return undefined; // Include in main bundle
          }
          
          // Admin pages - only loaded when staff accesses admin
          // But wait, they're in src/, so they're already in main bundle
          // Actually, let's keep lazy loading for admin pages
          // But they'll still need React, so they should import from main bundle
          // Actually, since we're lazy loading, they can be separate chunks
          // But they'll still have React as a dependency from the main bundle
          
          // Drag and drop library - only needed in MenuEditor (admin page)
          // But it might use React hooks, so let's keep it in main bundle to be safe
          if (id.includes('@dnd-kit')) {
            return undefined; // Include in main bundle to be safe
          }
          
          // Supabase - large library, doesn't depend on React
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // Only truly standalone, non-React utilities in vendor chunk
          // These are pure JavaScript libraries with no React dependencies
          const safeVendorLibs = [
            'date-fns',              // Date utility library (no React)
            'zod',                   // Schema validation (no React)
            'clsx',                  // Class name utility (no React)
            'tailwind-merge',        // Tailwind class merger (no React)
            'class-variance-authority', // Class variant utility (no React)
            'tailwindcss-animate',   // Tailwind animation (no React)
          ];
          
          if (id.includes('node_modules') && 
              safeVendorLibs.some(lib => id.includes(lib))) {
            return 'vendor';
          }
          
          // Everything else from node_modules that we're not sure about
          // should go in main bundle to be safe
          if (id.includes('node_modules')) {
            return undefined; // Include in main bundle to be safe
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
