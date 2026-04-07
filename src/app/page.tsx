"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Home,
  Utensils,
  HeartPulse,
  MessageCircle,
  ArrowUpRight,
  Clock,
  Phone,
  X,
  Zap,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────────────────────── */

const ACTIONS = [
  {
    id: "logement",
    label: "Dormir",
    sublabel: "Hébergement d'urgence",
    tag: "Disponible 24h/24",
    icon: Home,
    color: "#6366F1",
    colorRgb: "99,102,241",
    href: "/carte?besoin=logement",
    number: "115",
  },
  {
    id: "manger",
    label: "Manger",
    sublabel: "Distribution alimentaire",
    tag: "Gratuit & sans conditions",
    icon: Utensils,
    color: "#10B981",
    colorRgb: "16,185,129",
    href: "/carte?besoin=alimentation",
    number: "115",
  },
  {
    id: "soin",
    label: "Se soigner",
    sublabel: "Soins gratuits (PASS)",
    tag: "Accès sans papiers",
    icon: HeartPulse,
    color: "#F59E0B",
    colorRgb: "245,158,11",
    href: "/carte?besoin=sante",
    number: "15",
  },
  {
    id: "parler",
    label: "Parler",
    sublabel: "Aide & conseils",
    tag: "IA + annuaire",
    icon: MessageCircle,
    color: "#8B5CF6",
    colorRgb: "139,92,246",
    href: "/assistant",
    number: null,
  },
] as const;

const SOS_NUMBERS = [
  { label: "SAMU Social", number: "115", desc: "Hébergement d'urgence", color: "#EF4444" },
  { label: "Police", number: "17", desc: "Danger, agression", color: "#F97316" },
  { label: "Violences", number: "3919", desc: "Violences conjugales", color: "#EC4899" },
  { label: "SAMU", number: "15", desc: "Urgence médicale", color: "#EF4444" },
];

/* ─────────────────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
  },
};

const heroVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1] },
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   TILT CARD COMPONENT
───────────────────────────────────────────────────────────────────────── */

function TiltCard({
  children,
  className,
  style,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-4, 4]);
  const springX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800, ...style }}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   AMBIENT BACKGROUND — subtle gradient orbs
───────────────────────────────────────────────────────────────────────── */

function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Top-left indigo orb */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.22, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Bottom-right violet orb */}
      <motion.div
        className="absolute -bottom-40 -right-20 w-[30rem] h-[30rem] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.45) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      {/* Center green hint */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.6) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [sosOpen, setSosOpen] = useState(false);

  useEffect(() => {
    setLastVisit(localStorage.getItem("orizen_last_action"));
  }, []);

  const handleAction = (actionId: string, href: string) => {
    setActiveAction(actionId);
    localStorage.setItem("orizen_last_action", actionId);
    setTimeout(() => {
      window.location.href = href;
    }, 180);
  };

  const lastAction = ACTIONS.find((a) => a.id === lastVisit);

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-x-hidden">
      <AmbientBackground />

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-20 flex items-center justify-between px-5 pt-6 pb-2 max-w-lg mx-auto w-full"
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <span className="text-xs font-black text-white">OZ</span>
          </div>
          <span className="font-bold text-white tracking-tight">OriZen</span>
        </div>

        {/* SOS pill */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.04 }}
          onClick={() => setSosOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-900/50 text-white font-bold text-sm"
        >
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white"
          />
          SOS
        </motion.button>
      </motion.header>

      {/* ── SOS MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {sosOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end"
            onClick={() => setSosOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg mx-auto bg-slate-950 border-t border-slate-800 rounded-t-3xl px-5 pt-5 pb-10"
            >
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-white text-lg">Numéros d'urgence</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Gratuits · 24h/24 · 7j/7</p>
                </div>
                <button
                  onClick={() => setSosOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X size={15} className="text-slate-400" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {SOS_NUMBERS.map((s, i) => (
                  <motion.a
                    key={s.number}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    href={`tel:${s.number}`}
                    className="group flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98]"
                    style={{
                      background: `${s.color}10`,
                      borderColor: `${s.color}30`,
                    }}
                  >
                    <div>
                      <p className="font-bold text-white text-sm">{s.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                    <div
                      className="flex items-center gap-2 font-black text-xl"
                      style={{ color: s.color }}
                    >
                      <Phone size={15} />
                      {s.number}
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN ───────────────────────────────────────────────────── */}
      <main className="relative z-10 px-4 pb-10 max-w-lg mx-auto w-full">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="visible"
          className="mt-8 mb-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-4"
          >
            <Zap size={11} />
            Aide immédiate · anonyme · gratuite
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.08]">
            <span className="text-white">De quoi</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 40%, #818cf8 80%)",
              }}
            >
              avez-vous besoin
            </span>
            <br />
            <span className="text-slate-400 text-3xl sm:text-4xl font-bold">maintenant&nbsp;?</span>
          </h1>

          <p className="text-slate-500 text-sm mt-3 leading-relaxed max-w-xs">
            Sélectionnez une catégorie pour trouver les structures les plus proches de vous.
          </p>
        </motion.div>

        {/* ── BENTO 2×2 ────────────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 mb-5"
        >
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            const isActive = activeAction === action.id;

            return (
              <motion.div key={action.id} variants={itemVariants}>
                <TiltCard
                  className="relative cursor-pointer select-none h-[168px] rounded-2xl overflow-hidden group"
                  style={{
                    background: `rgba(${action.colorRgb},0.07)`,
                    border: `1px solid rgba(${action.colorRgb},${isActive ? "0.6" : "0.2"})`,
                    boxShadow: isActive
                      ? `0 0 28px rgba(${action.colorRgb},0.3), inset 0 1px 0 rgba(255,255,255,0.08)`
                      : `inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                  onClick={() => handleAction(action.id, action.href)}
                >
                  {/* Glow orb */}
                  <div
                    className="absolute -top-6 -right-6 w-28 h-28 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:opacity-80"
                    style={{
                      background: `radial-gradient(circle, rgba(${action.colorRgb},0.25) 0%, transparent 70%)`,
                      opacity: 0.5,
                    }}
                  />

                  {/* Shine line at top */}
                  <div
                    className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(${action.colorRgb},0.6), transparent)`,
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full p-4">
                    {/* Icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-auto shadow-lg transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `rgba(${action.colorRgb},0.15)`,
                        boxShadow: `0 4px 16px rgba(${action.colorRgb},0.2)`,
                      }}
                    >
                      <Icon size={20} style={{ color: action.color }} strokeWidth={1.8} />
                    </div>

                    <div className="mt-auto">
                      {/* Tag */}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1.5 inline-block"
                        style={{
                          color: action.color,
                          background: `rgba(${action.colorRgb},0.12)`,
                        }}
                      >
                        {action.tag}
                      </span>

                      {/* Label */}
                      <p
                        className="font-black text-xl leading-tight"
                        style={{ color: action.color }}
                      >
                        {action.label}
                      </p>

                      {/* Sublabel */}
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                        {action.sublabel}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowUpRight
                      size={14}
                      className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      style={{ color: action.color }}
                    />
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── LAST VISIT ───────────────────────────────────────────── */}
        <AnimatePresence>
          {lastAction && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-3 p-3.5 rounded-xl mb-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `rgba(${lastAction.colorRgb},0.12)` }}
              >
                <Clock size={14} style={{ color: lastAction.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-600 font-medium">Dernière aide consultée</p>
                <p className="text-sm font-bold text-slate-300">{lastAction.label}</p>
              </div>
              <button
                onClick={() => handleAction(lastAction.id, lastAction.href)}
                className="text-xs font-bold transition-colors px-2.5 py-1 rounded-lg"
                style={{
                  color: lastAction.color,
                  background: `rgba(${lastAction.colorRgb},0.1)`,
                }}
              >
                Reprendre →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FOOTER LINKS ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-center gap-4"
        >
          <Link
            href="/droits"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2"
          >
            Vos droits
          </Link>
          <span className="text-slate-800">·</span>
          <Link
            href="/assistant"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2"
          >
            Assistant IA
          </Link>
          <span className="text-slate-800">·</span>
          <Link
            href="/carte"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2"
          >
            Carte
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
