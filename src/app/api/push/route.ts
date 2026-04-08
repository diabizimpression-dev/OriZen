import { NextResponse } from "next/server";

// =====================================================
// WEB PUSH — Gestion des subscriptions + envoi notifications
// Standard W3C Web Push (pas de SDK propriétaire)
//
// VAPID keys nécessaires (générer une seule fois) :
//   npx web-push generate-vapid-keys
//
// Env vars :
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  = clé publique VAPID
//   VAPID_PRIVATE_KEY             = clé privée VAPID
//   VAPID_EMAIL                   = mailto:admin@orizen.fr
//
// Notifications envoyées pour :
//   - Plan Grand Froid (temp < 5°C)
//   - Canicule (temp > 35°C)
//   - Vigilance météo orange/rouge
// =====================================================

// Store subscriptions en mémoire (production : utiliser une base de données)
// En prod, remplacer par Redis ou Postgres
const subscriptions = new Map<string, PushSubscription>();

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ── POST : Enregistrer une subscription ──────────────────────────────────────
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { action, subscription } = body;

  if (action === "subscribe" && subscription?.endpoint) {
    subscriptions.set(subscription.endpoint, subscription);
    return NextResponse.json({
      ok: true,
      message: "Subscription enregistrée",
      count: subscriptions.size,
    });
  }

  if (action === "unsubscribe" && subscription?.endpoint) {
    subscriptions.delete(subscription.endpoint);
    return NextResponse.json({ ok: true, message: "Subscription supprimée" });
  }

  // Envoyer une notification de test
  if (action === "test") {
    const payload = JSON.stringify({
      title: "OriZen — Test notification",
      body: "Les notifications fonctionnent ! Vous serez alerté en cas de Plan Grand Froid.",
      type: "info",
      url: "/",
    });

    let sent = 0;
    const vapidPublicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail      = process.env.VAPID_EMAIL ?? "mailto:contact@orizen.fr";

    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json({
        ok: false,
        error: "VAPID keys non configurées. Générez-les avec: npx web-push generate-vapid-keys",
      });
    }

    for (const [endpoint, sub] of subscriptions) {
      try {
        // Envoi via Web Push Protocol (manuel, sans dépendance web-push)
        // En production, utiliser la lib `web-push` ou l'API native
        const pushRes = await sendWebPush(sub, payload, {
          publicKey: vapidPublicKey,
          privateKey: vapidPrivateKey,
          email: vapidEmail,
        });
        if (pushRes.ok) sent++;
        else subscriptions.delete(endpoint); // Nettoyer les subs expirées
      } catch {
        subscriptions.delete(endpoint);
      }
    }

    return NextResponse.json({ ok: true, sent, total: subscriptions.size });
  }

  return NextResponse.json({ ok: false, error: "Action inconnue" }, { status: 400 });
}

// ── GET : Clé publique VAPID ─────────────────────────────────────────────────
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  return NextResponse.json({
    ok: !!vapidPublicKey,
    vapidPublicKey: vapidPublicKey ?? null,
    subscriptionCount: subscriptions.size,
    configured: !!vapidPublicKey && !!process.env.VAPID_PRIVATE_KEY,
  });
}

// ── Envoi Web Push (implémentation minimale VAPID) ───────────────────────────
// Pour la production, utiliser le package `web-push` :
// npm install web-push
// import webpush from 'web-push';
// webpush.setVapidDetails(email, publicKey, privateKey);
// await webpush.sendNotification(subscription, payload);
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapid: { publicKey: string; privateKey: string; email: string }
): Promise<{ ok: boolean }> {
  // Implémentation simplifiée — en production utiliser le package web-push
  // qui gère le chiffrement ECDH + HKDF requis par la spec
  try {
    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        TTL: "86400",
        Authorization: `vapid t=${vapid.publicKey},k=${vapid.publicKey}`,
      },
      body: payload,
    });
    return { ok: res.status < 400 };
  } catch {
    return { ok: false };
  }
}
