"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Utensils, HeartPulse, MessageCircle,
  Clock, Phone, X, MapPin, Thermometer,
  FileText, Baby, Flame, Wallet, Navigation,
  Wind, Snowflake, Sun,
} from "lucide-react";
import dynamic from "next/dynamic";
import { parseOpeningHours } from "@/lib/openingHours";
import { Analytics, useTrack } from "@/components/Analytics";

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

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function StructureSkeleton() {
  return (
    <div className="flex flex-col gap-2 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-24 bg-slate-800 rounded-full animate-pulse" />
        <div className="h-3 w-16 bg-slate-800 rounded-full animate-pulse" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/50">
          <div className="w-9 h-9 rounded-xl bg-slate-800 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="h-3.5 w-3/4 bg-slate-800 rounded-full animate-pulse" />
            <div className="h-2.5 w-1/3 bg-slate-800/60 rounded-full animate-pulse" />
          </div>
          <div className="w-16 h-7 bg-slate-800 rounded-xl animate-pulse shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const track = useTrack();
  const pathname = usePathname();
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
            all.push({ ...s, id: `${t}_${s.id}`, type: t })
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
    track({ action: "scenario-click", scenario: actionId });
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

  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = lang === "fr"
    ? (hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir")
    : lang === "ar"
      ? (hour < 12 ? "صباح الخير" : hour < 18 ? "مساء النور" : "مساء الخير")
      : lang === "es"
        ? (hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches")
        : (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");

  // Open structures shown first
  const sortedStructures = [...nearbyStructures].sort((a, b) => {
    const aOpen = parseOpeningHours(a.open).isOpen ?? false;
    const bOpen = parseOpeningHours(b.open).isOpen ?? false;
    if (aOpen !== bOpen) return bOpen ? 1 : -1;
    return (a.distance_m ?? 9999) - (b.distance_m ?? 9999);
  });

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
    <div className="min-h-screen bg-[#030712] text-white flex flex-col" dir={lang === "ar" ? "rtl" : "ltr"}>
      <Analytics page="/" />
      <PushNotifications />
      <QuickExit />

      {/* ══ HEADER compact ══ */}
      <header className="flex items-center justify-between px-4 pt-safe pt-3 pb-2">
        {/* Localisation + météo */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {location?.commune ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={11} className="text-slate-500 shrink-0" />
              <span className="text-xs text-slate-400 truncate font-medium">
                {location.commune}{location.postcode ? ` ${location.postcode}` : ""}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-600">Localisation…</span>
          )}
          {weather && (
            <span className="text-xs text-slate-400 shrink-0">
              {weatherIcon(weather.weathercode)} {weather.temperature}°C
            </span>
          )}
        </div>
        {/* Langue + discret */}
        <div className="flex items-center gap-1.5 shrink-0">
          <DiscreetToggle />
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>{LANGS.find((l) => l.code === lang)?.flag}</span>
              <span className="font-semibold">{lang.toUpperCase()}</span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-8 z-30 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl"
                >
                  {LANGS.map((l) => (
                    <button key={l.code} onClick={() => switchLang(l.code)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs w-full text-left hover:bg-slate-800 ${lang === l.code ? "text-white font-bold" : "text-slate-400"}`}>
                      <span>{l.flag}</span><span>{l.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ══ ALERTE météo ══ */}
      <AnimatePresence>
        {alertConfig && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border mb-2"
              style={{ background: alertConfig.bg, borderColor: alertConfig.border, color: alertConfig.color }}>
              <Thermometer size={12} className="shrink-0" />
              <span>{alertConfig.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODALE SOS fullscreen ══ */}
      <AnimatePresence>
        {sosOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col"
            onClick={() => setSosOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="mt-auto bg-[#0a0f1e] border-t border-red-900/50 rounded-t-3xl px-5 pt-6 pb-10 max-h-[88vh] overflow-y-auto">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-white text-xl">Urgence</h2>
                  <p className="text-xs text-red-400">Numéros gratuits · 24h/24</p>
                </div>
                <button onClick={() => setSosOpen(false)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {SOS_NUMBERS.map((s) => (
                  <a key={s.number} href={`tel:${s.number}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-red-950/40 border border-red-800/40 active:scale-98 transition-all">
                    <div>
                      <p className="font-bold text-white text-sm">{s.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-2xl text-red-400">{s.number}</span>
                      <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center">
                        <Phone size={16} className="text-white" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MAIN ══ */}
      <main className="flex-1 flex flex-col px-4 pb-6 max-w-lg mx-auto w-full">

        {/* ── Bouton URGENCE ── */}
        <motion.button
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setSosOpen(true); track({ action: "sos-opened" }); }}
          className="relative w-full flex items-center justify-between px-5 rounded-2xl font-bold text-sm mb-4 shadow-lg shadow-red-950/50 border border-red-700/60 overflow-hidden"
          style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)", height: "56px" }}
        >
          {/* Pulse ring for visual urgency */}
          <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-red-500 pointer-events-none" style={{ animationDuration: "2.4s" }} />
          <div className="relative flex items-center gap-3">
            <span className="text-lg">🚨</span>
            <span>{t.urgency}</span>
          </div>
          <span className="relative text-red-300 text-xs font-normal">15 · 17 · 115 →</span>
        </motion.button>

        {/* ── Titre avec bonjour contextuel ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="mb-4">
          <p className="text-xs font-medium text-slate-500 mb-0.5">{greeting}</p>
          <h1 className="text-[22px] font-bold tracking-tight text-white leading-tight">{t.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalStructures > 0
              ? `${totalStructures} ${t.subtitle}`
              : coords ? "Recherche en cours…" : "Localisation…"}
          </p>
        </motion.div>

        {/* ══ ACTION LAUNCHER — full width, 68px, 1-hand ══ */}
        <div className="flex flex-col gap-2.5 mb-5">
          {MAIN_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            const isActive = activeAction === action.id;
            const count = structureCounts[action.id as keyof typeof structureCounts];
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAction(action.id, action.href)}
                className="w-full flex items-center justify-between px-4 rounded-2xl border transition-all text-left"
                style={{
                  height: "68px",
                  background: isActive ? action.color + "25" : action.bg,
                  borderColor: isActive ? action.color + "80" : action.border,
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: action.color + "20" }}>
                    <Icon size={20} style={{ color: action.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-[15px] text-white leading-tight">{action.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{action.sublabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {count != null && count > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: action.color + "25", color: action.color }}>
                      {count}
                    </span>
                  )}
                  {action.urgence && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      {action.urgence}
                    </span>
                  )}
                  <span className="text-slate-600 text-lg">›</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* ── Scénarios secondaires (chips horizontaux) ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
          className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {EXTRA_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.id}
                onClick={() => { localStorage.setItem("orizen_last_action", a.id); window.location.href = a.href; }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-800 bg-slate-900/60 hover:border-slate-600 transition-colors shrink-0">
                <Icon size={13} style={{ color: a.color }} />
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{a.label}</span>
              </button>
            );
          })}
          <Link href="/vault"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-800 bg-slate-900/60 hover:border-slate-600 transition-colors shrink-0">
            <span className="text-xs">🔒</span>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Coffre</span>
          </Link>
          <Link href="/droits"
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-800 bg-slate-900/60 hover:border-slate-600 transition-colors shrink-0">
            <span className="text-xs">⚖️</span>
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Droits</span>
          </Link>
        </motion.div>

        {/* ══ IMMEDIATE RESULTS — top 3 structures avec OUVERT/FERMÉ ══ */}
        {/* Skeleton while loading */}
        {coords && nearbyStructures.length === 0 && !contextLoaded && <StructureSkeleton />}

        <AnimatePresence>
          {sortedStructures.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
              className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.nearby}</span>
                <Link href="/carte" className="text-xs text-indigo-400 font-medium hover:text-indigo-300">{t.seeMap}</Link>
              </div>
              <div className="flex flex-col gap-2">
                {sortedStructures.map((s, i) => {
                  const color = typeColor[s.type] ?? "#8B5CF6";
                  const oh = parseOpeningHours(s.open);
                  const dist = s.distance_m != null
                    ? s.distance_m < 1000 ? `${s.distance_m} m` : `${(s.distance_m / 1000).toFixed(1)} km`
                    : null;
                  return (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.42 + i * 0.06 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/50">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: color + "20" }}>
                        <Navigation size={15} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {dist && <span className="text-xs text-slate-500">{dist}</span>}
                          {oh.isOpen !== null && (
                            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                              style={{ background: oh.color + "20", color: oh.color }}>
                              {oh.isOpen ? "OUVERT" : "FERMÉ"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Link href={`/carte?besoin=${s.type}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                          style={{ background: color + "20", color }}>
                          <MapPin size={11} /> Y aller
                        </Link>
                        {s.phone && (
                          <a href={`tel:${s.phone}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700">
                            <Phone size={11} />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Guichets officiels ── */}
        <AnimatePresence>
          {guichets.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="mb-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Guichets officiels</span>
              <div className="grid grid-cols-2 gap-2">
                {guichets.map((g) => (
                  <div key={g.id} className="p-3 rounded-xl border"
                    style={{ background: g.color + "0c", borderColor: g.color + "25" }}>
                    <p className="text-xs font-bold" style={{ color: g.color }}>{g.typeLabel}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{g.name}</p>
                    {g.phone && (
                      <a href={`tel:${g.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-1 text-xs mt-1.5 font-semibold" style={{ color: g.color }}>
                        <Phone size={9} /> {g.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CCAS ── */}
        <AnimatePresence>
          {ccas && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              className="mb-5 flex items-center gap-3 p-3.5 rounded-2xl border border-cyan-800/30 bg-cyan-950/20">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-cyan-400">{ccas.ccasName}</p>
                <p className="text-xs text-slate-500 mt-0.5">Aide locale · 48h</p>
              </div>
              {(ccas.ccasPhone ?? ccas.mairiePhone) && (
                <a href={`tel:${(ccas.ccasPhone ?? ccas.mairiePhone)?.replace(/\s/g, "")}`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-900/40 text-xs font-semibold text-cyan-400">
                  <Phone size={11} /> Appeler
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Continuer ── */}
        <AnimatePresence>
          {lastActionData && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mb-5 flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/40">
              <Clock size={13} className="text-slate-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-600">{t.lastSeen}</p>
                <p className="text-sm font-semibold text-slate-300">{lastActionData.label}</p>
              </div>
              <button onClick={() => handleAction(lastActionData.id, lastActionData.href)}
                className="text-xs text-indigo-400 font-bold shrink-0">{t.continue}</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Nav bottom ── */}
        <nav className="flex justify-around pt-2 border-t border-slate-800/60 mt-auto">
          {[
            { href: "/droits", icon: "⚖️", label: "Droits" },
            { href: "/assistant", icon: "💬", label: "Assistant" },
            { href: "/carte", icon: "🗺️", label: "Carte" },
            { href: "/emploi", icon: "💼", label: "Emploi" },
            { href: "/vault", icon: "🔒", label: "Coffre" },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-colors ${isActive ? "bg-slate-800/70" : "hover:bg-slate-800/40"}`}>
                <span className="text-base">{item.icon}</span>
                <span className={`text-[10px] font-medium ${isActive ? "text-white" : "text-slate-500"}`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
