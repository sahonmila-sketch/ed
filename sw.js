/* ==========================================================
   sw.js — O'quv.uz service worker
   Стратегии:
     • навигация (HTML)  — network-first, при офлайне отдаём кэш
     • статика (/assets) — stale-while-revalidate
     • /api/*            — мимо кэша полностью (всегда свежие данные)
   ========================================================== */
const CACHE = 'oquvuz-v48';
const SHELL = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/css/styles.css',
    '/assets/js/app.js',
    '/assets/js/modules/api.js',
    '/assets/js/modules/auth.js',
    '/assets/js/modules/ui.js',
    '/assets/js/modules/landing.js',
    '/assets/img/favicon.svg',
    '/assets/img/icon-192.png',
    '/assets/img/icon-512.png',
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE)
            .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Внешние ресурсы и API — не трогаем
    if (url.origin !== self.location.origin) return;
    if (url.pathname.startsWith('/api/')) return;

    // 1. Навигация — сначала сеть, при ошибке кэш
    if (req.mode === 'navigate') {
        e.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(CACHE).then((c) => c.put('/index.html', copy));
                    return res;
                })
                .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
        );
        return;
    }

    // 2. Статика — из кэша, параллельно обновляем
    e.respondWith(
        caches.match(req).then((cached) => {
            const network = fetch(req)
                .then((res) => {
                    if (res && res.status === 200 && res.type === 'basic') {
                        const copy = res.clone();
                        caches.open(CACHE).then((c) => c.put(req, copy));
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});

self.addEventListener('message', (e) => {
    if (e.data === 'skipWaiting') self.skipWaiting();
});
