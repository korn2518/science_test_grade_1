/* 과학 1 단원평가 기록보관소 서비스 워커 */
const CACHE = "arc-science1-v1.1.0";
const PRECACHE = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.webmanifest",
  "./fonts/GowunBatang-Bold.woff2",
  "./fonts/GowunBatang-Regular.woff2",
  "./fonts/IBMPlexSansKR-Medium.woff2",
  "./fonts/IBMPlexSansKR-Regular.woff2",
  "./fonts/IBMPlexSansKR-SemiBold.woff2",
  "./fonts/NanumPenScript-Regular.woff2",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-64.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("arc-science1-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("message", e => { if (e.data === "SKIP_WAITING") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname.endsWith("/config.js")) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req)));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(caches.match("./index.html").then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
