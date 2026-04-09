"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Utensils, HeartPulse, MessageCircle,
  Clock, Phone, X, MapPin, Thermometer,
  FileText, Baby, Flame, Wallet, Navigation,
  Wind, Snowflake, Sun,
} from "lucide-react";
import dynamic from "next/dynamic";
import { parseOpeningHours } from "@/lib/openingHours";

const PushNotifications = dynamic(() => import("@/components/PushNotifications"), { ssr: false });
const QuickExit = dynamic(() => import("@/components/QuickExit"), { ssr: false });
const DiscreetToggle = dynamic(
  () => import("@/components/DiscreetMode").then((m) => m.DiscreetToggle),
  { ssr: false }
);

// ─── Langues supportées ──────────────────────────────────────────────────────

const LANGS = [
  { code: "fr", label: "FR", flag: "🇫🇷", name: "Français" },
  { code: "ar", label: "AR", flag: "🇲🇦", name: "العربية", rtl: true },
  { code: "en", label: "EN", flag: "🇬🇧", name: "English" },
  { code: "es", label: "ES", flag: "🇪🇸", name: "Español" },
] as const;
type LangCode = "fr" | "ar" | "en" | "es";

// Textes traduits statiquement (les chaînes courtes de l'UI)
const UI_STRINGS: Record<LangCode, {
  title: string;
  subtitle: string;
  urgency: string;
  sleep: string; sleepSub: string;
  eat: string; eatSub: string;
  health: string; healthSub: string;
  talk: string; talkSub: string;
  nearby: string;
  seeMap: string;
  lastSeen: string;
  continue: string;
  callNow: string;
  papers: string; minor: string; violence: string; finance: string;
}> = {
  fr: {
    title: "De quoi avez-vous besoin ?",
    subtitle: "structures trouvées à moins de 5 km",
    urgency: "Urgence — Danger immédiat",
    sleep: "Dormir", sleepSub: "Hébergement d'urgence",
    eat: "Manger", eatSub: "Distribution alimentaire",
    health: "Se soigner", healthSub: "Soins gratuits (PASS)",
    talk: "Assistant", talkSub: "Aide & conseils IA",
    nearby: "Proches de vous", seeMap: "Voir la carte →",
    lastSeen: "Dernière aide consultée", continue: "Continuer →",
    callNow: "Appeler", papers: "Papiers", minor: "Mineur",
    violence: "Violence", finance: "Finances",
  },
  en: {
    title: "What do you need?",
    subtitle: "structures found within 5 km",
    urgency: "Emergency — Immediate danger",
    sleep: "Sleep", sleepSub: "Emergency shelter",
    eat: "Eat", eatSub: "Food distribution",
    health: "Healthcare", healthSub: "Free care (PASS)",
    talk: "Assistant", talkSub: "AI help & advice",
    nearby: "Near you", seeMap: "See map →",
    lastSeen: "Last help viewed", continue: "Continue →",
    callNow: "Call", papers: "Papers", minor: "Minor",
    violence: "Violence", finance: "Finance",
  },
  ar: {
    title: "ماذا تحتاج؟",
    subtitle: "هيكل موجود في أقل من 5 كم",
    urgency: "طوارئ — خطر فوري",
    sleep: "النوم", sleepSub: "إيواء طارئ",
    eat: "الأكل", eatSub: "توزيع الغذاء",
    health: "الصحة", healthSub: "رعاية مجانية",
    talk: "مساعد", talkSub: "مساعدة بالذكاء الاصطناعي",
    nearby: "قريب منك", seeMap: "عرض الخريطة ←",
    lastSeen: "آخر مساعدة", continue: "متابعة →",
    callNow: "اتصل", papers: "أوراق", minor: "قاصر",
    violence: "عنف", finance: "مالية",
  },
  es: {
    title: "¿Qué necesita?",
    subtitle: "estructuras encontradas en 5 km",
    urgency: "Emergencia — Peligro inmediato",
    sleep: "Dormir", sleepSub: "Albergue de emergencia",
    eat: "Comer", eatSub: "Distribución alimentaria",
    health: "Atención médica", healthSub: "Atención gratuita (PASS)",
    talk: "Asistente", talkSub: "Ayuda con IA",
    nearby: "Cerca de usted", seeMap: "Ver mapa →",
    lastSeen: "Última ayuda vista", continue: "Continuar →",
    callNow: "Llamar", papers: "Papeles", minor: "Menor",
    violence: "Violencia", finance: "Finanzas",
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeatherData {
  temperature: number;
  apparent_temperature: number | null;
  weathercode: number;
  windspeed: number | null;
  alert: "grand_froid" | "canicule" | "neige" | "vent" | null;
}

interface LocationData {
  commune: string;
  postcode: string;
  departement: string;
  region: string;
}

interface NearbyStructure {
  id: string;
  name: string;
  type: string;
  addr?: string;
  phone?: string;
  open?: string;
  distance_m?: number;
  reliability_score?: number;
}

// ─── Données statiques ───────────────────────────────────────────────────────

const MAIN_ACTIONS = [
  {
    id: "logement",
    label: "Dormir",
    sublabel: "Hébergement d'urgence",
    icon: Home,
    color: "#6366F1",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.3)",
    href: "/carte?besoin=logement",
    urgence: "115",
  },
  {
    id: "alimentation",
    label: "Manger",
    sublabel: "Distribution alimentaire",
    icon: Utensils,
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.3)",
    href: "/carte?besoin=alimentation",
    urgence: null,
  },
  {
    id: "sante",
    label: "Se soigner",
    sublabel: "Soins gratuits (PASS)",
    icon: HeartPulse,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    href: "/carte?besoin=sante",
    urgence: "15",
  },
  {
    id: "parler",
    label: "Assistant",
    sublabel: "Aide & conseils IA",
    icon: MessageCircle,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.3)",
    href: "/assistant",
    urgence: null,
  },
] as const;

const EXTRA_ACTIONS = [
  { id: "sans-papiers", label: "Papiers", icon: FileText, color: "#8B5CF6", href: "/carte?besoin=sans-papiers" },
  { id: "mineur-isole", label: "Mineur", icon: Baby, color: "#EC4899", href: "/carte?besoin=mineur-isole" },
  { id: "violence-familiale", label: "Violence", icon: Flame, color: "#F97316", href: "/carte?besoin=violence" },
  { id: "aide-financiere", label: "Finances", icon: Wallet, color: "#06B6D4", href: "/carte?besoin=finance" },
] as const;

const SOS_NUMBERS = [
  { label: "SAMU Social", number: "115", desc: "Hébergement d'urgence · 24h/24" },
  { label: "Police", number: "17", desc: "Danger, agression" },
  { label: "Violences Femmes", number: "3919", desc: "Violences conjugales · gratuit" },
  { label: "SAMU", number: "15", desc: "Urgence médicale" },
  { label: "Enfance en Danger", number: "119", desc: "Mineurs en danger" },
  { label: "Toutes urgences", number: "112", desc: "Numéro universel européen" },
] as const;

// ─── Helpers météo ───────────────────────────────────────────────────────────

function weatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫";
  if (code <= 55) return "🌦";
  if (code <= 67) return "🌧";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦";
  return "⛈";
}

function getAlertConfig(alert: WeatherData["alert"], temp: number) {
  switch (alert) {
    case "grand_froid":
      return {
        icon: Snowflake,
        text: temp <= 0
          ? `Gel ${temp}°C — Plan Grand Froid renforcé · Appeler le 115 maintenant`
          : `Nuit froide ${temp}°C — Plan Grand Froid activé · 115 disponible`,
        color: "#93C5FD",
        bg: "rgba(59,130,246,0.14)",
        border: "rgba(59,130,246,0.35)",
      };
    case "canicule":
      return {
        icon: Sun,
        text: `Canicule ${temp}°C — Plan Canicule · Hydratation & fraîcheur essentielles`,
        color: "#FCA5A5",
        bg: "rgba(239,68,68,0.12)",
        border: "rgba(239,68,68,0.3)",
      };
    case "neige":
      return {
        icon: Snowflake,
        text: `Neige en cours — Hébergement d'urgence disponible · 115`,
        color: "#BAE6FD",
        bg: "rgba(14,165,233,0.12)",
        border: "rgba(14,165,233,0.3)",
      };
    case "vent":
      return {
        icon: Wind,
        text: `Vents forts — Rester à l'abri · 115 si besoin`,
        color: "#D4D4D8",
        bg: "rgba(100,116,139,0.14)",
        border: "rgba(100,116,139,0.35)",
      };
    default:
      return null;
  }
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function HomePage() {
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [lang, setLang] = useState<LangCode>("fr");
  const [langOpen, setLangOpen] = useState(false);

  // Données temps réel
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [structureCounts, setStructureCounts] = useState<Record<string, number>>({});
  const [nearbyStructures, setNearbyStructures] = useState<NearbyStructure[]>([]);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [ccas, setCcas] = useState<{
    ccasName: string; ccasPhone: string | null; ccasAddress: string | null;
    commune: string; mairiePhone: string | null; rightsSummary: string;
  } | null>(null);
  const [guichets, setGuichets] = useState<Array<{
    id: string; name: string; typeLabel: string; address: string;
    phone: string | null; color: string; distance_m: number | null; note: string;
  }>>([]);

  // 1. Géolocalisation silencieuse
  useEffect(() => {
    setLastVisit(localStorage.getItem("orizen_last_action"));
    const savedLang = localStorage.getItem("orizen_lang") as LangCode | null;
    if (savedLang && ["fr", "en", "ar", "es"].includes(savedLang)) setLang(savedLang);
    if (!navigator.geolocation) {
      setCoords({ lat: 48.8566, lng: 2.3522 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 48.8566, lng: 2.3522 }),
      { timeout: 6000, maximumAge: 300000 }
    );
  }, []);

  // 2. Fetch contexte + structures dès que coords disponibles
  useEffect(() => {
    if (!coords) return;
    const { lat, lng } = coords;

    // Context (météo + géocodage) — API gratuite Open-Meteo + BAN
    fetch(`/api/context?lat=${lat}&lng=${lng}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.weather) setWeather(data.weather);
        if (data?.location) setLocation(data.location);
        setContextLoaded(true);
      })
      .catch(() => setContextLoaded(true));

    // CCAS local
    fetch(`/api/ccas?lat=${lat}&lng=${lng}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.ok && data.ccas) setCcas(data.ccas); })
      .catch(() => {});

    // Guichets officiels : CAF, CPAM, Préfecture
    fetch(`/api/guichets?lat=${lat}&lng=${lng}&type=tous`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.guichets) setGuichets(data.guichets.slice(0, 4)); })
      .catch(() => {});

    // Structures proches — Overpass/OSM en parallèle
    const types = ["logement", "alimentation", "sante"] as const;
    Promise.allSettled(
      types.map((t) =>
        fetch(`/api/structures?lat=${lat}&lng=${lng}&type=${t}&radius=5000`).then((r) => r.json())
      )
    ).then((results) => {
      const counts: Record<string, number> = {};
      const all: NearbyStructure[] = [];
      results.forEach((res, i) => {
        if (res.status === "fulfilled" && res.value?.structures) {
          const t = types[i];
          counts[t] = res.value.count || 0;
          res.value.structures.slice(0, 2).forEach((s: NearbyStructure) =>
            all.push({ ...s, type: t })
          );
        }
      });
      setStructureCounts(counts);
      setNearbyStructures(
        all
          .filter((s) => s.distance_m != null)
          .sort((a, b) => (a.distance_m ?? 9999) - (b.distance_m ?? 9999))
          .slice(0, 3)
      );
    });
  }, [coords]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleAction = (actionId: string, href: string) => {
    setActiveAction(actionId);
    localStorage.setItem("orizen_last_action", actionId);
    setTimeout(() => { window.location.href = href; }, 140);
  };

  const switchLang = (l: LangCode) => {
    setLang(l);
    setLangOpen(false);
    localStorage.setItem("orizen_lang", l);
    // Direction RTL pour l'arabe
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  };

  // ─── Computed ──────────────────────────────────────────────────────────────

  const t = UI_STRINGS[lang];
  const lastActionData = MAIN_ACTIONS.find((a) => a.id === lastVisit);
  const alertConfig = weather?.alert ? getAlertConfig(weather.alert, weather.temperature) : null;
  const totalStructures = Object.values(structureCounts).reduce((a, b) => a + b, 0);

  const typeColor: Record<string, string> = {
    logement: "#6366F1",
    alimentation: "#10B981",
    sante: "#F59E0B",
  };
  const typeLabel: Record<string, string> = {
    logement: "Logement",
    alimentation: "Alimentation",
    sante: "Santé",
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      <PushNotifications />
      <QuickExit />

      {/* ── Barre contexte : localisation + météo ── */}
      <AnimatePresence>
        {contextLoaded && (location || weather) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-4 pt-3"
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/70 border border-slate-800">
              {location?.commune ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin size={11} className="text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-400 truncate">
                    {location.commune}
                    {location.postcode ? ` · ${location.postcode}` : ""}
                    {location.departement ? ` · ${location.departement}` : ""}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-slate-600 shrink-0" />
                  <span className="text-xs text-slate-600">Localisation…</span>
                </div>
              )}
              {weather && (
                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  <span className="text-sm">{weatherIcon(weather.weathercode)}</span>
                  <span className="text-xs font-bold text-slate-200">{weather.temperature}°C</span>
                  {weather.apparent_temperature != null &&
                    weather.apparent_temperature !== weather.temperature && (
                      <span className="text-xs text-slate-500">
                        ressenti {weather.apparent_temperature}°
                      </span>
                    )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Alerte Plan gouvernemental (Grand Froid / Canicule / Neige) ── */}
      <AnimatePresence>
        {alertConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full px-4 pt-2"
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border"
              style={{
                background: alertConfig.bg,
                borderColor: alertConfig.border,
                color: alertConfig.color,
              }}
            >
              <Thermometer size={13} className="shrink-0" />
              <span>{alertConfig.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barre top : mode discret + langue ── */}
      <div className="w-full px-4 pt-2 flex justify-end items-center gap-1 relative">
        <DiscreetToggle />
        <div className="relative">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            <span>{LANGS.find((l) => l.code === lang)?.flag}</span>
            <span className="font-semibold">{lang.toUpperCase()}</span>
          </button>
          <AnimatePresence>
            {langOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-9 z-30 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl"
              >
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => switchLang(l.code)}
                    className={`flex items-center gap-2 px-3 py-2 text-xs w-full text-left hover:bg-slate-800 transition-colors ${lang === l.code ? "text-white font-semibold" : "text-slate-400"}`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bouton urgence ── */}
      <div className="w-full px-4 pt-2 pb-1">
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSosOpen(true)}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 font-bold text-base transition-colors shadow-lg shadow-red-900/40"
        >
          <span className="text-xl">🚨</span>
          {t.urgency}
        </motion.button>
      </div>

      {/* ── Modale SOS ── */}
      <AnimatePresence>
        {sosOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
            onClick={() => setSosOpen(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl px-5 pt-5 pb-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white text-lg">{t.urgency}</h2>
                <button
                  onClick={() => setSosOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {SOS_NUMBERS.map((s) => (
                  <a
                    key={s.number}
                    href={`tel:${s.number}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-red-950/60 border border-red-800/50 hover:bg-red-900/50 transition-colors"
                  >
                    <div>
                      <p className="font-bold text-white">{s.label}</p>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-red-400">
                      <Phone size={15} />
                      <span className="font-bold text-lg">{s.number}</span>
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-center text-xs text-slate-600 mt-4">
                Tous ces numéros sont gratuits · 24h/24
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Contenu principal ── */}
      <main className="flex-1 flex flex-col items-center px-4 py-3 max-w-lg mx-auto w-full">

        {/* Titre + compteur live */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center mb-4 w-full"
        >
          <h1 className="text-2xl font-bold tracking-tight mb-0.5 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            {t.title}
          </h1>
          <p className="text-slate-500 text-xs">
            {totalStructures > 0
              ? `${totalStructures} ${t.subtitle}`
              : coords
                ? "Recherche des structures proches…"
                : "Localisation en cours…"}
          </p>
        </motion.div>

        {/* ── Grid 2×2 principal ── */}
        <div className="grid grid-cols-2 gap-3 w-full mb-3">
          {MAIN_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            const isActive = activeAction === action.id;
            const count = structureCounts[action.id];
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(action.id, action.href)}
                className="relative flex flex-col items-start p-4 rounded-2xl border transition-all text-left group overflow-hidden"
                style={{
                  background: isActive ? action.color + "30" : action.bg,
                  borderColor: isActive ? action.color : action.border,
                }}
              >
                {/* Icône + badge count */}
                <div className="flex items-start justify-between w-full mb-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: action.color + "22" }}
                  >
                    <Icon size={18} style={{ color: action.color }} />
                  </div>
                  {count != null && count > 0 && (
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded-lg"
                      style={{ background: action.color + "22", color: action.color }}
                    >
                      {count}
                    </span>
                  )}
                </div>

                <p className="font-bold text-sm leading-tight" style={{ color: action.color }}>
                  {action.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{action.sublabel}</p>

                {/* Numéro urgence si applicable */}
                {action.urgence && (
                  <p
                    className="text-xs mt-1.5 font-semibold"
                    style={{ color: action.color + "bb" }}
                  >
                    {action.urgence} →
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── Actions supplémentaires (4 scénarios bonus) ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33 }}
          className="w-full grid grid-cols-4 gap-2 mb-4"
        >
          {EXTRA_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                onClick={() => {
                  localStorage.setItem("orizen_last_action", a.id);
                  window.location.href = a.href;
                }}
                className="flex flex-col items-center gap-1 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
              >
                <Icon size={15} style={{ color: a.color }} />
                <span className="text-xs text-slate-400 font-medium">{a.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Structures à proximité (données OSM temps réel) ── */}
        <AnimatePresence>
          {nearbyStructures.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="w-full mb-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t.nearby}
                </h2>
                <Link href="/carte" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  {t.seeMap}
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {nearbyStructures.map((s, i) => {
                  const color = typeColor[s.type] ?? "#8B5CF6";
                  const label = typeLabel[s.type] ?? s.type;
                  const distKm =
                    s.distance_m != null
                      ? s.distance_m < 1000
                        ? `${s.distance_m} m`
                        : `${(s.distance_m / 1000).toFixed(1)} km`
                      : null;

                  return (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.44 + i * 0.07 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: color + "22" }}
                      >
                        <Navigation size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{s.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: color + "22", color }}
                          >
                            {label}
                          </span>
                          {distKm && (
                            <span className="text-xs text-slate-500">{distKm}</span>
                          )}
                          {(() => {
                            const oh = parseOpeningHours(s.open);
                            if (oh.isOpen === null && !s.open) return null;
                            return (
                              <span className="text-xs font-medium flex items-center gap-1" style={{ color: oh.color }}>
                                <Clock size={9} />
                                {oh.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      {s.phone && (
                        <a
                          href={`tel:${s.phone}`}
                          className="shrink-0 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={13} className="text-slate-300" />
                        </a>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Guichets officiels : CAF · CPAM · Préfecture ── */}
        <AnimatePresence>
          {guichets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48 }}
              className="w-full mb-3"
            >
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Guichets officiels
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {guichets.map((g) => (
                  <div
                    key={g.id}
                    className="p-2.5 rounded-xl border"
                    style={{ background: g.color + "10", borderColor: g.color + "30" }}
                  >
                    <p className="text-xs font-bold truncate" style={{ color: g.color }}>{g.typeLabel}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{g.name}</p>
                    {g.distance_m != null && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        {g.distance_m < 1000 ? `${g.distance_m} m` : `${(g.distance_m / 1000).toFixed(1)} km`}
                      </p>
                    )}
                    {g.phone && (
                      <a
                        href={`tel:${g.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-1 text-xs mt-1 font-semibold"
                        style={{ color: g.color }}
                      >
                        <Phone size={9} /> {g.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CCAS local ── */}
        <AnimatePresence>
          {ccas && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full mb-4 p-3 rounded-xl border border-cyan-800/40 bg-cyan-950/30"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-cyan-400">{ccas.ccasName}</p>
                  {ccas.ccasAddress && (
                    <p className="text-xs text-slate-500 truncate">{ccas.ccasAddress}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{ccas.rightsSummary.slice(0, 100)}…</p>
                </div>
                {(ccas.ccasPhone ?? ccas.mairiePhone) && (
                  <a
                    href={`tel:${(ccas.ccasPhone ?? ccas.mairiePhone)?.replace(/\s/g, "")}`}
                    className="shrink-0 p-1.5 rounded-lg bg-cyan-900/50 hover:bg-cyan-800/50 transition-colors"
                  >
                    <Phone size={13} className="text-cyan-400" />
                  </a>
                )}
              </div>
              <p className="text-xs text-cyan-600">Aide d'urgence locale · 48h · mairie</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Continuer la dernière recherche ── */}
        <AnimatePresence>
          {lastActionData && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50 mb-4"
            >
              <Clock size={14} className="text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{t.lastSeen}</p>
                <p className="text-sm font-semibold text-slate-300">{lastActionData.label}</p>
              </div>
              <button
                onClick={() => handleAction(lastActionData.id, lastActionData.href)}
                className="text-xs text-indigo-400 font-bold hover:text-indigo-300 transition whitespace-nowrap"
              >
                {t.continue}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer liens ── */}
        <p className="text-xs text-slate-600 text-center mt-auto pb-2">
          <Link href="/droits" className="text-slate-400 hover:text-white underline underline-offset-2 transition">
            Droits
          </Link>
          {" · "}
          <Link href="/assistant" className="text-slate-400 hover:text-white underline underline-offset-2 transition">
            Assistant
          </Link>
          {" · "}
          <Link href="/carte" className="text-slate-400 hover:text-white underline underline-offset-2 transition">
            Carte
          </Link>
          {" · "}
          <Link href="/emploi" className="text-slate-400 hover:text-white underline underline-offset-2 transition">
            Emploi
          </Link>
        </p>
      </main>
    </div>
  );
}
