"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Utensils, HeartPulse, MessageCircle,
  Phone, X, MapPin, Thermometer,
  FileText, Baby, Flame, Wallet, Navigation, Layers,
  Wind, Snowflake, Sun, Share2, ChevronRight,
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
    color: "#818CF8",
    bg: "rgba(99,102,241,0.18)",
    border: "rgba(99,102,241,0.45)",
    href: "/carte?besoin=logement",
    urgence: "115",
  },
  {
    id: "alimentation",
    label: "Manger",
    sublabel: "Distribution alimentaire",
    icon: Utensils,
    color: "#34D399",
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.4)",
    href: "/carte?besoin=alimentation",
    urgence: null,
  },
  {
    id: "sante",
    label: "Se soigner",
    sublabel: "Soins gratuits (PASS)",
    icon: HeartPulse,
    color: "#FBBF24",
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.4)",
    href: "/carte?besoin=sante",
    urgence: "15",
  },
  {
    id: "parler",
    label: "Assistant",
    sublabel: "Aide & conseils IA",
    icon: MessageCircle,
    color: "#A78BFA",
    bg: "rgba(139,92,246,0.15)",
    border: "rgba(139,92,246,0.4)",
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
        fetch(`/api/structures?lat=${lat}&lng=${lng}&type=${t}&radius=5000`).then((r) => r.ok ? r.json() : null)
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

  // Scenario list (hero + accordion)
  const SCENARIO_LIST = [
    {
      id: "urgence", label: t.urgency, sublabel: "15 · 17 · 115 · 3919 — numéros gratuits",
      icon: "🚨", color: "#EF4444", count: null, urgence: null,
      onClick: () => { setSosOpen(true); track({ action: "sos-opened" }); },
    },
    ...MAIN_ACTIONS.map((a) => ({
      id: a.id, label: a.label, sublabel: a.sublabel,
      icon: null as string | null, lucideIcon: a.icon, color: a.color,
      count: structureCounts[a.id as keyof typeof structureCounts] ?? null,
      urgence: a.urgence,
      onClick: () => handleAction(a.id, a.href),
    })),
    { id: "sans-papiers", label: "Papiers & Droits", sublabel: "Aide juridique, régularisation", icon: null, lucideIcon: FileText, color: "#8B5CF6", count: null, urgence: null, onClick: () => { window.location.href = "/carte?besoin=sans-papiers"; } },
    { id: "mineur-isole", label: "Mineur isolé", sublabel: "Protection ASE, tutelle", icon: null, lucideIcon: Baby, color: "#EC4899", count: null, urgence: "119", onClick: () => { window.location.href = "/carte?besoin=mineur-isole"; } },
    { id: "violence", label: "Violence & Danger", sublabel: "Mise en sécurité immédiate", icon: null, lucideIcon: Flame, color: "#F97316", count: null, urgence: "3919", onClick: () => { window.location.href = "/carte?besoin=violence-familiale"; } },
    { id: "finances", label: "Difficultés financières", sublabel: "RSA, CAF, aides d'urgence", icon: null, lucideIcon: Wallet, color: "#06B6D4", count: null, urgence: null, onClick: () => { window.location.href = "/carte?besoin=aide-financiere"; } },
  ] as const;

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col relative overflow-x-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
      <Analytics page="/" />
      <PushNotifications />

      {/* ── Background gradient — visible indigo aurora at top ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div style={{ position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)", width: "120%", height: "420px", background: "radial-gradient(ellipse at 50% 20%, rgba(79,70,229,0.45) 0%, rgba(99,102,241,0.18) 35%, transparent 65%)", filter: "blur(2px)" }} />
        <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "260px", background: "linear-gradient(180deg, rgba(55,48,163,0.28) 0%, transparent 100%)" }} />
      </div>

      {/* ══ HEADER sticky ══ */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: "rgba(3,7,18,0.85)", backdropFilter: "blur(24px)", borderColor: "rgba(255,255,255,0.07)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Layers size={14} className="text-white" />
          </div>
          <span className="font-black text-white text-sm tracking-tight">OriZen</span>
        </div>

        {/* Location + weather pill (center) */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0 mx-3 flex-1 justify-center">
          {location?.commune && (
            <>
              <MapPin size={10} className="shrink-0" />
              <span className="truncate font-medium">{location.commune}</span>
            </>
          )}
          {weather && <span className="shrink-0">{weatherIcon(weather.weathercode)} {weather.temperature}°C</span>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <DiscreetToggle />
          {/* Lang */}
          <div className="relative">
            <button onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white transition-colors"
              style={{ background: "rgba(30,41,59,0.8)" }}>
              <span>{LANGS.find((l) => l.code === lang)?.flag}</span>
              <span className="font-bold">{lang.toUpperCase()}</span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-9 z-50 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl min-w-[120px]">
                  {LANGS.map((l) => (
                    <button key={l.code} onClick={() => switchLang(l.code)}
                      className={`flex items-center gap-2 px-3 py-2.5 text-xs w-full text-left hover:bg-slate-800 ${lang === l.code ? "text-white font-bold" : "text-slate-400"}`}>
                      <span>{l.flag}</span><span>{l.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Sortie rapide */}
          <QuickExit />
        </div>
      </header>

      {/* ══ ALERTE météo ══ */}
      <AnimatePresence>
        {alertConfig && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 text-xs font-semibold border-b"
              style={{ background: alertConfig.bg, borderColor: alertConfig.border, color: alertConfig.color }}>
              <Thermometer size={13} className="shrink-0" />
              <span className="font-bold uppercase tracking-wide">Alerte météo</span>
              <span className="font-normal opacity-80 truncate">{alertConfig.text}</span>
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
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="mt-auto bg-[#0a0f1e] border-t border-red-900/40 rounded-t-3xl px-5 pt-5 pb-10 max-h-[88vh] overflow-y-auto">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-black text-white text-xl">Urgence</h2>
                  <p className="text-xs text-red-400 mt-0.5">Numéros gratuits · 24h/24 · anonymes</p>
                </div>
                <button onClick={() => setSosOpen(false)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {SOS_NUMBERS.map((s) => (
                  <a key={s.number} href={`tel:${s.number}`}
                    className="flex items-center justify-between p-4 rounded-2xl border border-red-900/30 active:scale-[0.98] transition-all"
                    style={{ background: "rgba(127,29,29,0.3)" }}>
                    <div>
                      <p className="font-bold text-white text-sm">{s.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-2xl text-red-400 tabular-nums">{s.number}</span>
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                        <Phone size={17} className="text-white" />
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
      <main className="flex-1 flex flex-col pb-28 max-w-lg mx-auto w-full">

        {/* ══ HERO ══ */}
        <section className="px-5 pt-8 pb-7 text-center relative z-10">
          {/* Badge pill */}
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(129,140,248,0.45)", color: "#C7D2FE" }}>
            🔒 Anonyme &amp; Gratuit · Zéro inscription
          </motion.div>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07, duration: 0.5 }}>
            <p className="text-slate-400 text-base font-medium mb-2 tracking-wide">{greeting}</p>
            <h1 className="font-black text-white leading-[1.05] tracking-tight mb-2"
              style={{ fontSize: "clamp(38px,10vw,52px)", textShadow: "0 0 60px rgba(99,102,241,0.3)" }}>
              Trouve de l&apos;aide
            </h1>
            <h1 className="font-black leading-[1.05] tracking-tight mb-5"
              style={{
                fontSize: "clamp(38px,10vw,52px)",
                background: "linear-gradient(130deg, #6366F1 0%, #A78BFA 40%, #E879F9 80%, #C4B5FD 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              en 2 clics.
            </h1>
            <p className="text-sm leading-relaxed max-w-[280px] mx-auto"
              style={{ color: "#64748B" }}>
              {totalStructures > 0
                ? `${totalStructures} structures trouvées près de vous · résultats en temps réel`
                : "Le guide social qui vous oriente immédiatement vers les bonnes structures."}
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-7 flex flex-col items-center gap-3">
            <Link href="/assistant"
              className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg,#4338CA,#7C3AED)",
                boxShadow: "0 0 40px rgba(99,102,241,0.45), 0 8px 32px rgba(0,0,0,0.4)",
                width: "100%", maxWidth: "340px",
              }}
              onClick={() => track({ action: "hero-cta-assistant" })}>
              <MessageCircle size={19} />
              Parler à l&apos;assistant OriZen
            </Link>
            <button
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.97]"
              style={{ color: "#64748B", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
              onClick={() => {
                if (navigator.share) navigator.share({ title: "OriZen", text: "Trouve de l'aide en 2 clics", url: window.location.href });
              }}>
              <Share2 size={14} />
              Partager cette aide à un proche
            </button>
          </motion.div>
        </section>

        {/* ══ SITUATION ══ */}
        <section className="px-4 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase shrink-0" style={{ color: "#475569" }}>Quelle est ta situation ?</p>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div className="flex flex-col gap-2 mb-5">
            {SCENARIO_LIST.map((scenario, i) => {
              const LucideIcon = "lucideIcon" in scenario ? scenario.lucideIcon : null;
              const isUrgence = scenario.id === "urgence";
              return (
                <motion.button key={scenario.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.035, duration: 0.35 }}
                  whileTap={{ scale: 0.982 }}
                  onClick={scenario.onClick}
                  className="w-full flex items-center justify-between text-left transition-all"
                  style={{
                    padding: "14px 16px",
                    borderRadius: "16px",
                    background: isUrgence
                      ? "linear-gradient(135deg, rgba(127,29,29,0.55) 0%, rgba(30,10,10,0.85) 100%)"
                      : `linear-gradient(135deg, ${scenario.color}18 0%, rgba(8,12,30,0.92) 55%)`,
                    border: `1px solid ${isUrgence ? "rgba(239,68,68,0.4)" : scenario.color + "28"}`,
                    borderLeft: `3px solid ${scenario.color}`,
                    boxShadow: isUrgence
                      ? `0 4px 20px rgba(239,68,68,0.18), inset 0 1px 0 rgba(255,255,255,0.05)`
                      : `0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: scenario.color + "18",
                        boxShadow: `0 0 16px ${scenario.color}25`,
                      }}>
                      {scenario.icon
                        ? <span className="text-lg">{scenario.icon}</span>
                        : LucideIcon && <LucideIcon size={18} style={{ color: scenario.color }} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[14px] leading-tight"
                        style={{ color: isUrgence ? "#FCA5A5" : "#F1F5F9" }}>
                        {scenario.label}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#475569" }}>{scenario.sublabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {scenario.count != null && scenario.count > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                        style={{ background: scenario.color + "20", color: scenario.color }}>
                        {scenario.count}
                      </span>
                    )}
                    {"urgence" in scenario && scenario.urgence && (
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-lg tabular-nums"
                        style={{ background: "rgba(255,255,255,0.07)", color: "#94A3B8" }}>
                        {scenario.urgence}
                      </span>
                    )}
                    <ChevronRight size={14} style={{ color: isUrgence ? "#F87171" : "#334155" }} />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ══ STRUCTURES PROCHES ══ */}
          {coords && nearbyStructures.length === 0 && !contextLoaded && <StructureSkeleton />}

          <AnimatePresence>
            {sortedStructures.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold tracking-[0.14em] uppercase" style={{ color: "#475569" }}>{t.nearby}</p>
                  <Link href="/carte" className="text-xs font-semibold" style={{ color: "#818CF8" }}>{t.seeMap}</Link>
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
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.44 + i * 0.06 }}
                        className="flex items-center gap-3"
                        style={{ padding: "12px 14px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(8px)" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: color + "20", boxShadow: `0 0 12px ${color}20` }}>
                          <Navigation size={15} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F1F5F9" }}>{s.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {dist && <span className="text-[11px]" style={{ color: "#475569" }}>{dist}</span>}
                            {oh.isOpen !== null && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                style={{ background: oh.color + "18", color: oh.color }}>
                                {oh.isOpen ? "OUVERT" : "FERMÉ"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Link href={`/carte?besoin=${s.type}`}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold"
                            style={{ background: color + "18", color, boxShadow: `0 0 10px ${color}15` }}>
                            <MapPin size={11} /> Y aller
                          </Link>
                          {s.phone && (
                            <a href={`tel:${s.phone}`}
                              className="flex items-center px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                              style={{ background: "rgba(255,255,255,0.06)", color: "#94A3B8" }}>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mb-5">
                <p className="text-[11px] font-bold text-slate-500 tracking-[0.12em] uppercase mb-2">Guichets officiels</p>
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
                className="mb-5 flex items-center gap-3 p-3.5 rounded-2xl border"
                style={{ background: "rgba(8,51,68,0.4)", borderColor: "rgba(22,163,204,0.25)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-cyan-400">{ccas.ccasName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Aide sociale locale · 48h</p>
                </div>
                {(ccas.ccasPhone ?? ccas.mairiePhone) && (
                  <a href={`tel:${(ccas.ccasPhone ?? ccas.mairiePhone)?.replace(/\s/g, "")}`}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(22,163,204,0.15)", color: "#22D3EE" }}>
                    <Phone size={11} /> Appeler
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* ══ BOTTOM NAV — fixed premium ══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around px-2"
        style={{
          background: "rgba(3,7,18,0.88)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "8px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}>
        {([
          { href: "/", icon: Home, label: "Accueil" },
          { href: "/assistant", icon: MessageCircle, label: "Assistant" },
          { href: "/carte", icon: MapPin, label: "Carte" },
          { href: "/vault", icon: Wallet, label: "Coffre" },
          { href: "/droits", icon: FileText, label: "Droits" },
        ] as const).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all"
              style={{
                color: isActive ? "#818CF8" : "#334155",
                background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
              }}>
              <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-semibold mt-0.5" style={{ color: isActive ? "#818CF8" : "#475569" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
