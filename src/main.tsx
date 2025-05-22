import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Temporarily disable service worker registration during development
// Comment out service worker registration to avoid errors
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Get the base URL dynamically
      const baseUrl = import.meta.env.BASE_URL;
      const swUrl = `${window.location.origin}${baseUrl}sw.js`;

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: baseUrl
      });

      console.log('SW registered:', registration);

      // Check for updates periodically
      setInterval(() => {
        registration.update().catch(console.error);
      }, 60 * 60 * 1000); // Check every hour

    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });
}
*/

console.log('Service worker registration disabled for development.');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
