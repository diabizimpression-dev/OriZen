"use client";

// ─── Mode Discret ─────────────────────────────────────────────────────────────
// Toggle qui transforme l'apparence d'OriZen en site de météo banal
// Actif : fond clair, titres neutres, masque le contenu social
// Stocké dans sessionStorage uniquement (pas de localStorage = disparu à fermeture)

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

// ─── Context global ───────────────────────────────────────────────────────────

interface DiscreetContextType {
  isDiscreet: boolean;
  toggle: () => void;
}

export const DiscreetContext = createContext<DiscreetContextType>({
  isDiscreet: false,
  toggle: () => {},
});

export function useDiscreet() {
  return useContext(DiscreetContext);
}

// ─── Provider (à placer dans layout) ─────────────────────────────────────────

export function DiscreetProvider({ children }: { children: ReactNode }) {
  const [isDiscreet, setIsDiscreet] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("orizen_discreet");
    if (stored === "1") setIsDiscreet(true);
  }, []);

  const toggle = () => {
    setIsDiscreet((v) => {
      const next = !v;
      if (next) sessionStorage.setItem("orizen_discreet", "1");
      else sessionStorage.removeItem("orizen_discreet");
      return next;
    });
  };

  return (
    <DiscreetContext.Provider value={{ isDiscreet, toggle }}>
      {isDiscreet ? <DiscreetOverlay toggle={toggle} /> : children}
    </DiscreetContext.Provider>
  );
}

// ─── Overlay mode discret ────────────────────────────────────────────────────
// Ressemble à un site météo standard, affiche de vraies données Open-Meteo

function DiscreetOverlay({ toggle }: { toggle: () => void }) {
  const [weather, setWeather] = useState<{
    temp: number; city: string; desc: string; icon: string;
  } | null>(null);

  useEffect(() => {
    // Récupérer vraies données météo pour que l'overlay soit crédible
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode&timezone=Europe%2FParis`).then(r => r.json()),
          fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}&limit=1`).then(r => r.json()),
        ]).then(([w, b]) => {
          const temp = Math.round(w.current?.temperature_2m ?? 15);
          const code = w.current?.weathercode ?? 0;
          const city = b.features?.[0]?.properties?.city ?? "France";
          const icons: Record<number, string> = { 0: "☀️", 1: "🌤", 2: "⛅", 3: "☁️" };
          const descs: Record<number, string> = { 0: "Ensoleillé", 1: "Peu nuageux", 2: "Partiellement nuageux", 3: "Couvert" };
          setWeather({
            temp, city,
            icon: code <= 3 ? (icons[code] ?? "⛅") : code <= 48 ? "🌫" : code <= 67 ? "🌧" : code <= 77 ? "❄️" : "⛈",
            desc: code <= 3 ? (descs[code] ?? "Variable") : code <= 48 ? "Brouillard" : code <= 67 ? "Pluie" : code <= 77 ? "Neige" : "Orages",
          });
        }).catch(() => {
          setWeather({ temp: 15, city: "France", icon: "⛅", desc: "Variable" });
        });
      },
      () => setWeather({ temp: 15, city: "France", icon: "⛅", desc: "Variable" })
    );
  }, []);

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 font-sans">
      {/* Faux header météo */}
      <header className="bg-sky-500 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌤</span>
          <span className="font-bold text-lg">MétéoFrance</span>
        </div>
        <nav className="hidden sm:flex gap-4 text-sm">
          <span className="opacity-80">Prévisions</span>
          <span className="opacity-80">Carte</span>
          <span className="opacity-80">Alertes</span>
        </nav>
      </header>

      {/* Contenu météo crédible */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
          <p className="text-sm text-slate-500 mb-1">📍 {weather?.city ?? "Localisation…"}</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{weather?.icon ?? "⛅"}</span>
            <div>
              <p className="text-4xl font-bold text-slate-700">{weather?.temp ?? "--"}°C</p>
              <p className="text-slate-500">{weather?.desc ?? "Chargement…"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: "Vent", value: "12 km/h" },
            { label: "Humidité", value: "68%" },
            { label: "UV", value: "Modéré" },
            { label: "Visibilité", value: "10 km" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 p-3">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="font-semibold text-slate-700">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-sm font-semibold text-slate-600 mb-3">Prévisions 5 jours</p>
          {["Lun", "Mar", "Mer", "Jeu", "Ven"].map((day, i) => (
            <div key={day} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
              <span className="text-sm text-slate-500 w-10">{day}</span>
              <span>{"☀️⛅🌧⛅☀️".split("").filter((_, idx) => [0,2,4,6,8].includes(idx))[i]}</span>
              <span className="text-sm text-slate-600">{[22, 19, 14, 18, 24][i]}°</span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-300 mt-4">météofrance.com · données officielles</p>
      </main>

      {/* Bouton caché pour désactiver le mode discret (triple tap sur le logo) */}
      <button
        onClick={toggle}
        className="fixed bottom-4 right-4 w-10 h-10 rounded-full bg-transparent"
        aria-label="Retour"
        title="Retour à l'application (usage interne)"
        style={{ WebkitTapHighlightColor: "transparent" }}
      />
    </div>
  );
}

// ─── Bouton toggle mode discret ───────────────────────────────────────────────

export function DiscreetToggle() {
  const { isDiscreet, toggle } = useDiscreet();
  return (
    <button
      onClick={toggle}
      title={isDiscreet ? "Mode normal" : "Mode discret (cache l'app)"}
      aria-label={isDiscreet ? "Mode normal" : "Mode discret"}
      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 transition-colors"
    >
      {isDiscreet ? <Eye size={13} /> : <EyeOff size={13} />}
    </button>
  );
}
