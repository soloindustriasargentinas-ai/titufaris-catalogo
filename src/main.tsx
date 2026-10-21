import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any legacy or stale service workers to guarantee all browsers (Brave, Edge, Chrome) fetch fresh assets
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().catch(() => {});
    }
  }).catch(() => {});
}

// Forzar navegación segura HTTPS en producción (titufaris.online, tiendas.titufaris.online, etc.)
if (
  typeof window !== 'undefined' &&
  window.location.protocol === 'http:' &&
  window.location.hostname !== 'localhost' &&
  !window.location.hostname.endsWith('.run.app') &&
  !window.location.hostname.includes('webcontainer') &&
  !window.location.hostname.endsWith('.local')
) {
  window.location.href = window.location.href.replace('http:', 'https:');
}

// Pre-set document title according to hostname before React mounts to avoid title flashing
if (typeof window !== 'undefined') {
  const host = window.location.hostname.toLowerCase();
  if (host.includes('zapas')) {
    document.title = 'Zapas - Calzado & Sneakers Oficial';
  } else if (host.includes('claudia')) {
    document.title = 'Claudia Soft - Lencería & Moda Femenina';
  } else if (host.includes('tiendas')) {
    document.title = 'Plataforma de Tiendas Online - Catálogo & POS';
  } else if (host.includes('titufaris')) {
    document.title = 'Titufaris - Equipamiento Comercial & Racks';
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
