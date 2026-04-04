/**
 * Service Worker עבור Admin Panel PWA
 * מאפשר offline functionality ו-caching
 */

const CACHE_NAME = "nm-admin-v1";
const STATIC_ASSETS = [
  "/admin/",
  "/admin/index",
  "/styles/global.css",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // אל חושבים אם כמה assets לא זמינים
        console.log("Some assets could not be cached");
      });
    })
  );
  // Force new service worker to take over
  self.skipWaiting();
});

// Fetch event - cache first, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // דלג על non-GET requests
  if (request.method !== "GET") return;

  // דלג על external URLs
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) return response;

      return fetch(request)
        .then((response) => {
          // אל תשמור responses שאינם מוצלחים
          if (!response || response.status !== 200 || response.type === "error") {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache dynamic content
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback
          return new Response("Offline - לא ניתן לטעון דף זה כרגע", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({
              "Content-Type": "text/plain; charset=utf-8",
            }),
          });
        });
    })
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
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
  self.clients.claim();
});
