// Service worker mínimo: hace la app instalable como PWA.
// No hay caching offline todavía; las requests pasan directo a la red.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", () => {});
