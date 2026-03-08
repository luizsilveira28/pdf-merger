const CACHE_NAME = 'etiquetas-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/etiquetas.html',
    '/agradecimento.html',
    '/product-label.html',
    '/css/styles.css',
    '/js/global.js',
    '/js/main.js',
    '/js/thermal.js',
    '/js/a4.js',
    '/js/single.js',
    '/js/thank-you.js',
    '/js/icon-data.js',
    '/js/product-label.js',
    '/js/product-icons.js',
    '/favicon.svg',
    '/manifest.json'
];

// Instalar service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

// Buscar do cache, fallback para rede
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((response) => {
                    // Não cachear se não for uma resposta válida
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    // Cachear a nova resposta
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                });
            })
    );
});

// Limpar caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
