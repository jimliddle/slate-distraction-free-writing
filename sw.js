// Optional offline support for Slate. Place this file next to slate.html on the same site.
// Network first, so updates to the page arrive straight away; the cached copy is used when offline.
// Only same-origin GET requests are touched: AI requests to other sites always go straight to the network.
'use strict';
const CACHE = 'slate-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.map(w => {
      const url = new URL(w.url); url.hash = '';
      return cache.add(new Request(url.href, { cache: 'reload' })).catch(() => {});
    }));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch {
      return (await cache.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
