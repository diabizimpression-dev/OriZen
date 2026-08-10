"use client";

// ─── Analytics anonymes OriZen ────────────────────────────────────────────────
// RGPD : zéro cookie, zéro données personnelles, zéro fingerprinting
// Envoie uniquement : page vue, action optionnelle, scénario optionnel

import { useEffect } from "react";

interface TrackOptions {
  action?: string;
  scenario?: string;
}

/**
 * Composant à monter sur n'importe quelle page pour tracker la vue.
 * Usage : <Analytics page="/droits" />
 *         <Analytics page="/assistant" action="situation-click" scenario="logement" />
 */
export function Analytics({ page, action, scenario }: { page: string } & TrackOptions) {
  useEffect(() => {
    // Fire and forget — silencieux en cas d'erreur
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page, action, scenario }),
    }).catch(() => {});
  }, [page, action, scenario]);

  return null;
}

/**
 * Hook pour tracker des events déclenchés par l'utilisateur.
 * Usage :
 *   const track = useTrack();
 *   track({ action: "sos-opened" });
 *   track({ action: "scenario-click", scenario: "logement" });
 */
export function useTrack() {
  return ({ page, action, scenario }: { page?: string } & TrackOptions) => {
    const currentPage = page ?? (typeof window !== "undefined" ? window.location.pathname : "/");
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: currentPage, action, scenario }),
    }).catch(() => {});
  };
}
