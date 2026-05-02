"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, Utensils, HeartPulse, MessageCircle, 
  ArrowRight, Clock, Phone, X, ShieldAlert,
  Search, Zap, MapPin, Info
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const ACTIONS = [
  {
    id: "logement",
    label: "Hébergement",
    desc: "Trouver un toit",
    icon: Home,
    color: "#00E5FF", // cyber-blue
    span: "col-span-2 sm:col-span-1",
    href: "/carte?besoin=logement",
  },
  {
    id: "manger",
    label: "Alimentation",
    desc: "Repas & colis",
    icon: Utensils,
    color: "#00FF94", // cyber-green
    span: "col-span-1",
    href: "/carte?besoin=alimentation",
  },
  {
    id: "soin",
    label: "Santé",
    desc: "Soins & PASS",
    icon: HeartPulse,
    color: "#FFD600", // cyber-yellow
    span: "col-span-1",
    href: "/carte?besoin=sante",
  },
  {
    id: "assistant",
    label: "Assistant IA",
    desc: "Conseils immédiats",
    icon: Zap,
    color: "#BC00FF", // cyber-purple
    span: "col-span-2",
    href: "/assistant",
  },
];

const SOS_NUMBERS = [
  { label: "SAMU Social", number: "115", desc: "Hébergement d'urgence" },
  { label: "Police Secours", number: "17", desc: "Danger ou agression" },
  { label: "Violences Femmes", number: "3919", desc: "Écoute & orientation" },
  { label: "SAMU Médical", number: "15", desc: "Urgence vitale" },
];

export default function HomePage() {
  const [sosOpen, setSosOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".bento-item", {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "expo.out",
    });
  }, { scope: containerRef });

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-cyber-pink overflow-x-hidden" ref={containerRef}>
      
      {/* HEADER DISCRET */}
      <header className="px-6 py-4 flex justify-between items-center glass-morph sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyber-pink rounded-lg flex items-center justify-center font-heading font-black text-xl italic shadow-cyber-pink">O</div>
          <span className="font-heading font-bold text-xl tracking-tighter">ORIZEN</span>
        </div>
        <div className="flex gap-4">
          <Link href="/carte" className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <MapPin size={20} className="text-cyber-blue" />
          </Link>
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <Search size={20} className="text-slate-400" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="px-6 pt-10 pb-6">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl font-black font-heading leading-none mb-4"
        >
          PRENEZ <br/>
          <span className="cyber-gradient-text">LE CONTRÔLE.</span>
        </motion.h1>
        <p className="text-slate-400 text-lg max-w-[280px] leading-snug">
          Solutions immédiates pour vos droits et votre sécurité.
        </p>
      </section>

      {/* EMERGENCY TRIGGER */}
      <div className="px-6 mb-8">
        <button 
          onClick={() => setSosOpen(true)}
          className="neon-button w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="animate-pulse" />
            <span className="uppercase tracking-widest text-sm font-black">Besoin d'aide urgente ?</span>
          </div>
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* BENTO GRID ACTIONS */}
      <section className="px-6 grid grid-cols-2 gap-4 mb-10 flex-1">
        {ACTIONS.map((action) => (
          <Link 
            key={action.id} 
            href={action.href}
            className={`bento-item cyber-card flex flex-col justify-between ${action.span} group`}
            style={{ '--hover-color': action.color } as any}
          >
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3"
              style={{ backgroundColor: `${action.color}20`, border: `1px solid ${action.color}40` }}
            >
              <action.icon size={24} style={{ color: action.color }} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1" style={{ color: action.color }}>{action.label}</h3>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{action.desc}</p>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <Zap size={16} style={{ color: action.color }} />
            </div>
          </Link>
        ))}
      </section>

      {/* FOOTER INFO */}
      <footer className="px-6 py-8 border-t border-surface-border bg-surface/50">
        <div className="flex justify-between items-center mb-6">
          <Link href="/droits" className="text-sm font-bold text-slate-400 hover:text-cyber-blue transition-colors flex items-center gap-2">
            <Info size={16} /> Vos Droits
          </Link>
          <Link href="/vault" className="text-sm font-bold text-slate-400 hover:text-cyber-pink transition-colors">
            Vault Sécurisé
          </Link>
        </div>
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em] text-center">
          OriZen © 2026 · Navigation Sécurisée & Anonyme
        </p>
      </footer>

      {/* SOS MODAL */}
      <AnimatePresence>
        {sosOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSosOpen(false)}
              className="fixed inset-0 bg-background/90 backdrop-blur-xl z-50 p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black font-heading text-cyber-pink italic">URGENCE SOS</h2>
                <button onClick={() => setSosOpen(false)} className="p-3 bg-white/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="grid gap-4">
                {SOS_NUMBERS.map((sos, i) => (
                  <motion.a
                    key={sos.number}
                    href={`tel:${sos.number}`}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between p-6 rounded-3xl bg-surface border border-red-500/30 hover:border-red-500 transition-all active:scale-95 group"
                  >
                    <div>
                      <p className="text-2xl font-black font-heading text-white group-hover:text-red-500 transition-colors">{sos.number}</p>
                      <p className="text-slate-400 text-sm font-bold uppercase">{sos.label}</p>
                    </div>
                    <Phone className="text-red-500 animate-bounce" size={28} />
                  </motion.a>
                ))}
              </div>

              <div className="mt-auto text-center p-6 bg-red-500/10 rounded-3xl border border-red-500/20">
                <p className="text-xs text-red-400 font-bold leading-relaxed">
                  SI VOUS ÊTES EN DANGER DE MORT IMMÉDIAT, APPELEZ LE 15 OU LE 17 SANS ATTENDRE.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
