// OriZen Service Worker — PWA offline-first + Web Push
// Mis en cache : numéros urgence, pages statiques, API contexte

const CACHE_VERSION = "orizen-v1";
const CACHE_STATIC = [
  "/",
  "/droits",
  "/assistant",
  "/carte",
  "/emploi",
  "/offline",
];

// Numéros d'urgence en cache offline (données critiques)
const EMERGENCY_DATA = {
  numbers: [
    { label: "SAMU Social",        number: "115", desc: "Hébergement d'urgence · 24h/24" },
    { label: "Police",             number: "17",  desc: "Danger, agression" },
    { label: "Violences Femmes",   number: "3919",desc: "Violences conjugales · gratuit" },
    { label: "SAMU",               number: "15",  desc: "Urgence médicale" },
    { label: "Enfance en Danger",  number: "119", desc: "Mineurs en danger" },
    { label: "Toutes urgences",    number: "112", desc: "Numéro universel européen" },
    { label: "Prévention Suicide", number: "3114",desc: "Crise psychologique · 24h/24" },
  ],
  cachedAt: new Date().toISOString(),
};

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Cache les numéros d'urgence comme JSON
      const emergencyResponse = new Response(JSON.stringify(EMERGENCY_DATA), {
        headers: { "Content-Type": "application/json" },
      });
      cache.put("/api/emergency-numbers", emergencyResponse);

      // Cache les pages statiques (best-effort)
      return cache.addAll(CACHE_STATIC).catch(() => {
        // Certaines pages peuvent ne pas être disponibles au build — ignorer
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch — Stratégie Network-first, Cache fallback ─────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Toujours réseau pour les API dynamiques (sauf emergency-numbers)
  if (url.pathname.startsWith("/api/") && url.pathname !== "/api/emergency-numbers") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((r) => r ?? new Response("Hors ligne", { status: 503 }))
      )
    );
    return;
  }

  // Network-first pour tout le reste
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Mettre en cache les réponses réussies (pages, assets)
        if (response.ok && request.method === "GET") {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback cache
        return caches.match(request).then(
          (cached) => cached ?? new Response("Hors ligne — Vérifiez votre connexion", { status: 503 })
        );
      })
  );
});

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "OriZen", body: event.data.text(), type: "info" };
  }

  const options = {
    body: data.body ?? "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: data.type === "urgence" ? [200, 100, 200, 100, 400] : [100, 50, 100],
    tag: data.tag ?? "orizen-notification",
    renotify: true,
    requireInteraction: data.type === "urgence",
    data: {
      url: data.url ?? "/",
      type: data.type,
    },
    actions:
      data.type === "grand_froid"
        ? [
            { action: "call-115", title: "📞 Appeler le 115" },
            { action: "open-map", title: "🗺 Hébergements proches" },
          ]
        : data.type === "urgence"
        ? [
            { action: "call-sos", title: "🚨 Appel d'urgence" },
          ]
        : [
            { action: "open-app", title: "Ouvrir OriZen" },
          ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "OriZen", options)
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { action, notification } = event;
  const { url, type } = notification.data ?? {};

  let targetUrl = url ?? "/";

  if (action === "call-115") {
    targetUrl = "tel:115";
  } else if (action === "call-sos") {
    targetUrl = "/?sos=1";
  } else if (action === "open-map") {
    targetUrl = "/carte?besoin=logement";
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
          if (targetUrl.startsWith("/")) clients[0].navigate(targetUrl);
        } else {
          self.clients.openWindow(targetUrl);
        }
      })
  );
});
