importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.2.4/workbox-sw.js"
);
const { registerRoute, setDefaultHandler } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { cacheNames, setCacheNameDetails } = workbox.core;

setCacheNameDetails({ suffix: "v1" });
cacheNames.expiration = cacheNames.prefix + "-expiration-" + cacheNames.suffix;

registerRoute(
  ({ url }) =>
    ["https://cdn.jsdelivr.net"].includes(url.origin) ||
    url.href.endsWith(".geo.json"),
  new CacheFirst()
);

registerRoute(
  ({ url }) => url.origin == location.origin,
  new StaleWhileRevalidate()
);

registerRoute(
  ({ url }) =>
    ["https://api.corona-zahlen.org", "https://api.corona.app.5ls.de"].includes(
      url.origin
    ),
  new CacheFirst({
    cacheName: cacheNames.expiration,
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 2 * 60 * 60,
        matchOptions: { ignoreVary: true },
      }),
    ],
  })
);

setDefaultHandler(
  new StaleWhileRevalidate({
    cacheName: cacheNames.expiration,
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 1 * 60 * 60,
        matchOptions: { ignoreVary: true },
      }),
    ],
  })
);

self.addEventListener("install", (event) => {
  const urls = [
    "/",
    "/index.html",
    "/404.html",
    "/config.js",
    "/script.js",
    "/style.css",
    "/graph",
    "/graph.js",
    "/back.svg",
    "/districts.geo.json",
    "/states.geo.json",
    "/world.geo.json",
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
  const cacheName = cacheNames.runtime;
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(urls)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async function () {
      const userCacheNames = await caches.keys();
      const cacheNamesArray = Object.values(cacheNames);
      await Promise.all(
        userCacheNames.map(async (cacheName) => {
          if (!cacheNamesArray.includes(cacheName)) {
            return await caches.delete(cacheName);
          }
          return await Promise.resolve();
        })
      );
    })()
  );
});
