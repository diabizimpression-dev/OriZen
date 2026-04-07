const CACHE_NAME = 'orizen-v7-final-revert';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/index_content.html',
    '/assistant_content.html',
    '/carte_content.html',
    '/silence_content.html',
    '/vault_content.html',
    '/urgence_content.html',
    '/logement_content.html',
    '/droits_content.html',
    '/css/design-system.css',
    '/js/foundation-api.js',
    '/js/security.js',
    '/js/i18n.js',
    '/js/app.js',
    '/js/theme-init.js',
    '/manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Specific strategy for Map Structures API: Stale-While-Revalidate
    if (url.pathname === '/api/structures') {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    const fetchPromise = fetch(event.request).then(networkResponse => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // Default strategy: Cache First, falling back to Network
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                // Do not cache analytics
                if (url.hostname.includes('google-analytics')) {
                    return fetchResponse;
                }
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        }).catch(() => {
            // Offline fallback for HTML pages
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
