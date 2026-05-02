"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Utensils, HeartPulse, MessageCircle,
  ArrowRight, Clock, Phone, X
} from "lucide-react";

const ACTIONS = [
  {
    id: "logement",
    label: "Dormir",
    sublabel: "Hébergement d'urgence",
    icon: Home,
    color: "#6366F1",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.3)",
    href: "/carte?besoin=logement",
  },
  {
    id: "manger",
    label: "Manger",
    sublabel: "Distribution alimentaire",
    icon: Utensils,
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.3)",
    href: "/carte?besoin=alimentation",
  },
  {
    id: "soin",
    label: "Se soigner",
    sublabel: "Soins gratuits (PASS)",
    icon: HeartPulse,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.3)",
    href: "/carte?besoin=sante",
  },
  {
    id: "parler",
    label: "Parler",
    sublabel: "Aide & conseils",
    icon: MessageCircle,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.3)",
    href: "/assistant",
  },
];

const SOS_NUMBERS = [
  { label: "SAMU Social", number: "115", desc: "Hébergement d'urgence" },
  { label: "Police", number: "17", desc: "Danger, agression" },
  { label: "Violences", number: "3919", desc: "Violences conjugales" },
  { label: "SAMU", number: "15", desc: "Urgence médicale" },
];

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
    }, 160);
  };

  const lastActionLabel = ACTIONS.find((a) => a.id === lastVisit)?.label;

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">
      {/* BOUTON URGENCE — EN PREMIER, pleine largeur, rouge plein */}
      <div className="w-full px-4 pt-5 pb-2">
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setSosOpen(true)}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-base transition-colors shadow-lg shadow-red-900/40"
        >
          <span className="text-xl">🚨</span>
          Urgence — Danger immédiat
        </motion.button>
      </div>

      {/* Modale SOS Numbers */}
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
              className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl px-5 pt-5 pb-8"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-white text-lg">Appel d'urgence</h2>
                <button
                  onClick={() => setSosOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {SOS_NUMBERS.map((s) => (
                  <a
                    key={s.number}
                    href={`tel:${s.number}`}
                    className="flex items-center justify-between p-4 rounded-2xl bg-red-950/60 border border-red-800/50 hover:bg-red-900/50 transition-colors active:scale-98"
                  >
                    <div>
                      <p className="font-bold text-white">{s.label}</p>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-red-400">
                      <Phone size={16} />
                      <span className="font-bold text-lg">{s.number}</span>
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-center text-xs text-slate-600 mt-5">
                Tous ces numéros sont gratuits · disponibles 24h/24
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col items-center px-4 py-4 max-w-lg mx-auto w-full">
        {/* Titre */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-1 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            De quoi avez-vous besoin ?
          </h1>
          <p className="text-slate-500 text-sm">Sélectionnez pour trouver une aide immédiate.</p>
        </motion.div>

        {/* Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3 w-full mb-5">
          {ACTIONS.map((action, i) => {
            const Icon = action.icon;
            const isActive = activeAction === action.id;
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
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110"
                  style={{ background: action.color + "25" }}
                >
                  <Icon size={20} style={{ color: action.color }} />
                </div>
                <p className="font-bold text-base leading-tight" style={{ color: action.color }}>
                  {action.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 leading-tight">{action.sublabel}</p>
                <ArrowRight
                  size={13}
                  className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: action.color }}
                />
              </motion.button>
            );
          })}
        </div>

        {/* Dernière visite */}
        <AnimatePresence>
          {lastActionLabel && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 mb-4"
            >
              <Clock size={15} className="text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">Dernière aide consultée</p>
                <p className="text-sm font-semibold text-slate-300">{lastActionLabel}</p>
              </div>
              <button
                onClick={() => {
                  const action = ACTIONS.find((a) => a.id === lastVisit);
                  if (action) handleAction(action.id, action.href);
                }}
                className="text-xs text-indigo-400 font-bold hover:text-indigo-300 transition whitespace-nowrap"
              >
                Continuer →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lien discret droits */}
        <p className="text-xs text-slate-600 text-center">
          Besoin d'informations ?{" "}
          <Link
            href="/droits"
            className="text-slate-400 hover:text-white underline underline-offset-2 transition"
          >
            Vos droits
          </Link>
          {" · "}
          <Link
            href="/assistant"
            className="text-slate-400 hover:text-white underline underline-offset-2 transition"
          >
            Assistant
          </Link>
        </p>
      </main>
    </div>
  );
}
