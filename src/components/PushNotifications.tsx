"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Service Worker + Push Notifications ─────────────────────────────────────
// Enregistre le SW et propose l'activation des notifications

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotifications() {
  const [swRegistered, setSwRegistered] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Vérifier si déjà rejeté
    const dismissedAt = localStorage.getItem("orizen_push_dismissed");
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      // Re-proposer après 7 jours
      if (Date.now() - dismissedDate.getTime() < 7 * 24 * 3600 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Enregistrer le service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          setSwRegistered(true);
          // Vérifier si déjà subscrit
          return reg.pushManager.getSubscription();
        })
        .then((sub) => {
          if (sub) {
            setSubscribed(true);
            setPermission("granted");
          } else {
            setPermission(Notification.permission);
            // Proposer après 3s si pas encore accordé
            if (Notification.permission === "default") {
              setTimeout(() => setShowBanner(true), 3000);
            }
          }
        })
        .catch(() => {
          // SW non supporté ou erreur — ignorer silencieusement
        });
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        await subscribe();
      } else {
        setShowBanner(false);
      }
    } catch {
      setShowBanner(false);
    }
  };

  const subscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;

      // Récupérer la clé publique VAPID
      const keyRes = await fetch("/api/push");
      const keyData = await keyRes.json();
      if (!keyData.vapidPublicKey) {
        // VAPID non configuré — SW enregistré mais pas de push server
        setSubscribed(false);
        setShowBanner(false);
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(keyData.vapidPublicKey).buffer as ArrayBuffer;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Enregistrer la subscription côté serveur
      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", subscription: subscription.toJSON() }),
      });

      setSubscribed(true);
      setShowBanner(false);
    } catch {
      setShowBanner(false);
    }
  };

  const dismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("orizen_push_dismissed", new Date().toISOString());
  };

  if (!swRegistered || dismissed || subscribed || permission === "denied") return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 shadow-xl shadow-black/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-950 flex items-center justify-center shrink-0">
                <Bell size={15} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">Alertes Grand Froid & Canicule</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recevez une alerte quand un Plan gouvernemental est activé dans votre zone.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={requestPermission}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                  >
                    <Bell size={11} />
                    Activer
                  </button>
                  <button
                    onClick={dismiss}
                    className="px-3 py-1.5 rounded-lg text-slate-400 text-xs hover:text-white transition-colors"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
              <button onClick={dismiss} className="p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0">
                <X size={13} className="text-slate-500" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
