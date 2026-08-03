// Workora service worker — minimal, safe PWA shell.
// Network-first passthrough: the app is fully functional online (it's a realtime
// workspace), so we never serve stale content from cache. The SW exists so the app
// is installable (add-to-home-screen) and so static assets can fall back to cache
// if the network blips mid-session.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Only handle same-origin GET requests; let everything else (POST, API, sockets,
  // cross-origin) go straight to the network untouched.
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        // Cache successful static responses for offline resilience, but never use
        // stale app-shell data as a source of truth.
        if (res.ok && new URL(req.url).pathname.startsWith("/assets/")) {
          const copy = res.clone();
          caches.open("workora-shell-v1").then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("/index.html") : undefined))
      )
  );
});
