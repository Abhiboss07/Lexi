/**
 * Safe, idempotent Service Worker registration for offline PWA capabilities.
 */
export function registerServiceWorker(): void {
  const isTest = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.TEST);
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    !isTest
  ) {
    window.addEventListener('load', () => {
      const rawBase = (import.meta as any).env?.BASE_URL || '/';
      const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
      const swUrl = `${base}sw.js`;

      navigator.serviceWorker
        .register(swUrl, { scope: base })
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.info('[Lexi] An updated version is ready for the next restart.');
                } else {
                  console.info('[Lexi] Core shell cached for offline learning.');
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[Lexi] ServiceWorker registration failed:', error);
        });
    });
  }
}
