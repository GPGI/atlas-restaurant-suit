import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Only register in production, skip in development
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { 
      updateViaCache: 'none',
      scope: '/' 
    })
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, prompt user to reload
                console.log('New service worker available');
                // Don't auto-reload, let user decide
              }
            });
          }
        });
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
        // Unregister if registration fails
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => reg.unregister());
        });
      });
    
    // Clean up old service workers
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        if (!registration.active?.scriptURL.includes('sw.js')) {
          registration.unregister().catch((err) => {
            console.warn('Failed to unregister old service worker', err);
          });
        }
      });
    });
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Unregister service worker in development
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((reg) => {
      reg.unregister().catch((err) => {
        console.warn('Failed to unregister service worker in dev', err);
      });
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
