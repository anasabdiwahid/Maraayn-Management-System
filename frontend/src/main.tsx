import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.js';

// Reset any CSS zoom property cleanly
if (typeof window !== 'undefined') {
  localStorage.removeItem('maraayn_ui_zoom');
  document.documentElement.style.zoom = '';
}

// PWA Service Worker: Only active in Production, clear in Development to prevent stale cache
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ [Maraayn PWA] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ [Maraayn PWA] Registration failed:', error);
        });
    });
  } else {
    // In development mode, auto-clean old SW registrations & stale cache
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
        console.log('🧹 [Dev] Cleaned Service Worker:', reg.scope);
      }
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
