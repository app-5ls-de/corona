importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.2.4/workbox-sw.js"
);
const { registerRoute, setDefaultHandler } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst } = workbox.strategies;
const { cacheNames, setCacheNameDetails } = workbox.core;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

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
      new CacheableResponsePlugin({ statuses: [200] }),
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
    "/404",
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
    "https://cdn.jsdelivr.net/npm/highcharts@9.2.1/highcharts.min.js",
    "https://cdn.jsdelivr.net/npm/charts.css@0.9.0/dist/charts.min.css",
  ];
  const cacheName = cacheNames.runtime;
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(urls)));
});

self.addEventListener("activate", (event) => {
  const cacheNamesArray = Object.values(cacheNames);
  event.waitUntil(
    caches.keys().then((userCacheNames) =>
      Promise.all(
        userCacheNames.map((cacheName) => {
          if (!cacheNamesArray.includes(cacheName))
            return caches.delete(cacheName);
        })
      )
    )
  );
});
