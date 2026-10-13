import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
