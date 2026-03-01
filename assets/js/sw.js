// sw.js - Service Worker for offline capability and caching

const CACHE_NAME = 'my-tech-blog-v1';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    './assets/css/critical.css',
    './assets/css/global.css',
    './assets/css/animations.css',
    './assets/js/utils.js',
    './assets/js/theme.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Non-GET requests should bypass cache
    if (event.request.method !== 'GET') return;

    // Ignore external requests except Google Fonts/Cloudflare CDN
    const isDomain = url.hostname === self.location.hostname;
    const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
    const isCDN = url.hostname === 'cdnjs.cloudflare.com';

    if (!isDomain && !isFont && !isCDN) return;

    // Cache-first strategy for static assets (CSS, JS, Fonts, Images)
    if (url.pathname.match(/\.(css|js|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/) || isFont || isCDN) {
        event.respondWith(
            caches.match(event.request).then(response => {
                if (response) return response;

                return fetch(event.request).then(netResponse => {
                    if (!netResponse || netResponse.status !== 200 || netResponse.type !== 'basic' && netResponse.type !== 'cors') {
                        return netResponse;
                    }

                    const responseToCache = netResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return netResponse;
                });
            })
        );
        return;
    }

    // Network-first strategy for HTML files and JSON data
    if (event.request.headers.get('accept').includes('text/html') || url.pathname.endsWith('.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => {
                    // Offline fallback
                    return caches.match(event.request);
                })
        );
    }
});
