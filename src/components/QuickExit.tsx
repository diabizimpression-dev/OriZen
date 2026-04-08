"use client";

// ─── Quick Exit Component ─────────────────────────────────────────────────────
// Bouton de sortie rapide : 1 clic = redirection vers site neutre + effacement session
// CRITIQUE pour victimes de violences conjugales et personnes en danger

import { useEffect, useCallback } from "react";

// Sites neutres de redirection (rotatifs pour ne pas avoir de pattern)
const EXIT_SITES = [
  "https://www.meteofrance.com",
  "https://www.lemonde.fr",
  "https://www.google.fr",
];

function getExitSite(): string {
  return EXIT_SITES[Math.floor(Math.random() * EXIT_SITES.length)];
}

function clearAllData() {
  try {
    sessionStorage.clear();
    localStorage.removeItem("orizen_last_action");
    localStorage.removeItem("orizen_lang");
    // Ne pas effacer les prefs push (non sensibles)
  } catch {}
}

export default function QuickExit() {
  const exit = useCallback(() => {
    clearAllData();
    // Remplace l'historique pour qu'on ne puisse pas revenir en arrière
    window.location.replace(getExitSite());
  }, []);

  // Raccourci clavier : Échap × 2 rapidement
  useEffect(() => {
    let escCount = 0;
    let timer: ReturnType<typeof setTimeout>;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        escCount++;
        if (escCount >= 2) {
          exit();
          return;
        }
        clearTimeout(timer);
        timer = setTimeout(() => { escCount = 0; }, 800);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      clearTimeout(timer);
    };
  }, [exit]);

  return (
    <button
      onClick={exit}
      aria-label="Quitter rapidement"
      title="Sortie rapide (Échap × 2)"
      className="fixed top-3 right-3 z-[9999] flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-900/80 border border-slate-700 hover:border-red-700 text-slate-400 hover:text-white text-xs font-semibold transition-all backdrop-blur select-none"
      style={{ touchAction: "manipulation" }}
    >
      <span className="text-sm">✕</span>
      <span className="hidden sm:inline">Quitter</span>
    </button>
  );
}
