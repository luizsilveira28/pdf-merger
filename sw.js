// Versão: 2026-03-08 - Network-first strategy
const CACHE_NAME = 'etiquetas-cache';

const PRECACHE_URLS = [
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

// Instalar: pré-cacheia arquivos essenciais
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Ativar: limpa caches antigos e toma controle
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    // Deleta qualquer cache que não seja o atual
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
        .then(() => caches.delete(CACHE_NAME)) // Limpa o cache atual também para forçar refresh
        .then(() => caches.open(CACHE_NAME))
        .then((cache) => cache.addAll(PRECACHE_URLS))
        .then(() => self.clients.claim())
    );
});

// Network-first: sempre busca da rede, cache só para offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});
