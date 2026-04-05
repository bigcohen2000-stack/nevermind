/* NeverMind: Service Worker בסיסי - ניווט: רשת קודם, בלי רשת עמוד offline */
const CACHE_NAME = "nevermind-v2";
const OFFLINE = "/offline.html";
const PRECACHE_URLS = ["/", "/manifest.webmanifest", OFFLINE];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE).then((r) => r || new Response("", { status: 503 })))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        try {
          const url = new URL(req.url);
          if (res.ok && url.origin === self.location.origin) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
        } catch {
          /* ignore */
        }
        return res;
      });
    })
  );
});
