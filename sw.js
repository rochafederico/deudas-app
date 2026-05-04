// sw.js — Service Worker de Nivva
// Estrategia: cache-first para el app shell; network-first para navegación.
// Auto-actualización: skipWaiting + clients.claim garantizan activación inmediata
// cuando hay nueva versión disponible e internet.

const CACHE_VERSION = 'nivva-v2';

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './src/icons/icon-192.png',
    './src/icons/icon-512.png',
    './src/styles/bootstrap.css',
    './src/styles/mobile-pwa.css',
    './src/main.js',
    './src/layout/AppShell.js',
];

// ── Instalación: pre-cachea el app shell ──────────────────────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(cache =>
            // Cachear cada recurso individualmente para que un fallo puntual
            // no aborte toda la instalación del SW.
            Promise.allSettled(APP_SHELL.map(url => cache.add(url)))
        ).then(() => self.skipWaiting())
    );
});

// ── Activación: elimina caches de versiones anteriores ───────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== CACHE_VERSION)
                    .map(k => caches.delete(k))
            )
        // clients.claim: toma control inmediato de todas las pestañas abiertas.
        ).then(() => self.clients.claim())
    );
});

// ── Fetch: cache-first, con fallback a red ───────────────────────────────────
self.addEventListener('fetch', event => {
    // Solo interceptar requests GET del mismo origen
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;
            return fetch(event.request).then(response => {
                // Guardar en cache solo responses válidas del mismo origen
                if (
                    response.ok &&
                    response.type === 'basic' &&
                    event.request.url.startsWith(self.location.origin)
                ) {
                    const clone = response.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone)).catch(() => {});
                }
                return response;
            }).catch(() => {
                // Sin red y sin cache: devolver página raíz si es navegación HTML
                if (event.request.destination === 'document') {
                    return caches.match('./');
                }
            });
        })
    );
});
