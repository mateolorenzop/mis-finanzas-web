// Service worker mínimo: no cachea nada (los datos son de Supabase y
// siempre tienen que venir frescos), sólo existe para que el navegador
// considere el sitio instalable como app.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
