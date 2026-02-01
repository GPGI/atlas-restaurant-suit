import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, reload page
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
    
    // Unregister old service workers if they exist
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        if (registration.active?.scriptURL.includes('sw.js')) {
          // Keep current registration
          return;
        }
        registration.unregister();
      });
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
