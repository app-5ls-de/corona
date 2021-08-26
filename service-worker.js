importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.2.4/workbox-sw.js"
);
const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
const { registerRoute, setDefaultHandler } = workbox.routing;
const { cacheNames, setCacheNameDetails } = workbox.core;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;

setCacheNameDetails({ suffix: "v2" });
cacheNames.expiration = cacheNames.prefix + "-expiration-" + cacheNames.suffix;
cacheNames.offline = cacheNames.prefix + "-offline-" + cacheNames.suffix;
cacheNames.network = cacheNames.prefix + "-network-" + cacheNames.suffix;
cacheNames.stale = cacheNames.prefix + "-stale-" + cacheNames.suffix;

registerRoute(
  ({ url }) =>
    ["https://cdn.jsdelivr.net"].includes(url.origin) ||
    (url.origin == location.origin &&
      new RegExp("\\.(json|svg|png|geo.json)$").test(url.pathname)),
  new CacheFirst({
    cacheName: cacheNames.offline,
  })
);

registerRoute(
  ({ url }) => url.origin == location.origin,
  new StaleWhileRevalidate({
    cacheName: cacheNames.stale,
  })
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
  new NetworkFirst({
    cacheName: cacheNames.network,
  })
);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(cacheNames.stale)
      .then((cache) => cache.addAll(["/", "/404", "/graph"]))
  );
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
