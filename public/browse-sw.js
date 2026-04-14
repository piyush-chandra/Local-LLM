// Stub service worker — prevents 404 on /browse-sw.js
// Add actual caching/offline logic here if needed.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
