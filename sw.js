const CACHE_NAME = 'dmts-learning-cache-v1';

// The specific learning files you provided
const ASSETS_TO_CACHE = [
    '/modules.html',
    '/course-flood.html',
    '/course-tornado.html',
    '/course-wildfire.html',
    '/course.html',
    '/modules2.html',
    '/css/modules.css',
    '/css/course.css',
    '/css/style.css',
    '/js/modules.js',
    '/js/course.js',
    // External CDNs required for your layout
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css'
];

// Install Event: Save files to the browser
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // We use map + add to ensure one bad file doesn't stop the whole cache
            return Promise.allSettled(
                ASSETS_TO_CACHE.map(asset => cache.add(asset))
            );
        })
    );
    self.skipWaiting();
});

// Fetch Event: Serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached file if found, otherwise try network
            return response || fetch(event.request);
        })
    );
});