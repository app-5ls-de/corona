---
---
const PRECACHE = 'precache-v{{ "now" | date: "%s"}}';
const RUNTIME = "runtime";

// A list of local resources we always want to be cached.
const PRECACHE_URLS = [
    "/",
    "/index.html",
    "/404.html",
    "/config.js",
    "/script.js",
    "/style.css",
    "/graph",
    "/graph.js",
    "/back.svg",
    "https://api.corona.app.5ls.de/districts.geojson",
    "https://api.corona.app.5ls.de/states.geojson",
    "https://api.corona.app.5ls.de/world.geojson",
    "/manifest.json",
    "/favicon.ico",
    "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/leaflet.min.css",
    "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/leaflet.min.js",
    "https://cdn.jsdelivr.net/npm/redom@3.27.1/dist/redom.min.js",
    "https://cdn.jsdelivr.net/npm/highcharts@9.0.1/highcharts.min.js",
    "https://cdn.jsdelivr.net/npm/charts.css@0.9.0/dist/charts.min.css",
    "/icons/android-chrome-192x192.png",
    "/icons/android-chrome-512x512.png",
    "/icons/maskable_icon.png",
    "/icons/apple-touch-icon.png",
    "/icons/favicon-32x32.png",
    "/icons/favicon-16x16.png",
    "/icons/safari-pinned-tab.svg",
    "/icons/browserconfig.xml",
    "/icons/mstile-70x70.png",
    "/icons/mstile-150x150.png",
    "/icons/mstile-310x310.png",
];

// The install handler takes care of precaching the resources we always need.
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(PRECACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            .then(self.skipWaiting())
    );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", (event) => {
    const currentCaches = [PRECACHE];
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return cacheNames.filter(
                    (cacheName) => !currentCaches.includes(cacheName)
                );
            })
            .then((cachesToDelete) => {
                return Promise.all(
                    cachesToDelete.map((cacheToDelete) => {
                        return caches.delete(cacheToDelete);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener("fetch", (event) => {
    // Skip cross-origin requests, like those for Google Analytics.
    if (
        event.request.url.startsWith(self.location.origin) ||
        event.request.url.startsWith("https://cdn.jsdelivr.net/") ||
        event.request.url.endsWith(".geojson")
    ) {
        event.respondWith(
            caches
                .match(event.request, { ignoreSearch: true })
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return caches.open(RUNTIME).then((cache) => {
                        return fetch(event.request).then((response) => {
                            // Put a copy of the response in the runtime cache.
                            return cache
                                .put(event.request, response.clone())
                                .then(() => {
                                    return response;
                                });
                        });
                    });
                })
        );
    }
});
