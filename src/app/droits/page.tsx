"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronDown, Phone, Home, Utensils,
  HeartPulse, AlertTriangle, FileText, Baby, ShieldAlert, Wallet,
  Gavel, Scale, ShieldCheck, Zap, Info
} from "lucide-react";
import { SCENARIOS } from "@/lib/scenarios";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const ICONS: Record<string, React.ElementType> = {
  logement: Home,
  alimentation: Utensils,
  sante: HeartPulse,
  urgence: AlertTriangle,
  "sans-papiers": FileText,
  "mineur-isole": Baby,
  "violence-familiale": ShieldAlert,
  "aide-financiere": Wallet,
};

export default function DroitsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".rights-card", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power3.out"
    });
  }, { scope: containerRef });

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-cyber-pink overflow-x-hidden" ref={containerRef}>
      
      {/* CYBER HEADER */}
      <header className="px-6 py-6 flex justify-between items-center glass-morph sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-white/5 rounded-2xl hover:bg-cyber-blue/20 transition-all border border-white/10 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="font-heading font-black text-xl tracking-tighter italic uppercase">Arsenal Juridique</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyber-blue">Vos Droits, Vos Armes</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-cyber-blue/20 border border-cyber-blue/40 flex items-center justify-center">
          <Scale size={20} className="text-cyber-blue" />
        </div>
      </header>

      <main className="px-6 py-8 max-w-2xl mx-auto">
        
        {/* WARNING / TRUST SIGNAL */}
        <section className="mb-8">
          <div className="p-5 rounded-3xl bg-surface border border-surface-border flex items-start gap-4 relative overflow-hidden group">
            <div className="p-3 rounded-2xl bg-cyber-yellow/10 text-cyber-yellow">
              <ShieldCheck size={24} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-widest text-cyber-yellow mb-1">Avertissement Légal</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Ces informations sont basées sur le **Code de l'Action Sociale et des Familles (CASF)**. En cas de refus illégal d'une structure, citez les articles mentionnés ci-dessous.
              </p>
            </div>
            <Zap size={60} className="absolute -bottom-4 -right-4 text-white/5 group-hover:scale-110 transition-transform" />
          </div>
        </section>

        {/* RIGHTS ACCORDION (POWER CARDS) */}
        <div className="flex flex-col gap-4">
          {Object.values(SCENARIOS).map((scenario) => {
            const Icon = ICONS[scenario.id] ?? FileText;
            const isOpen = openId === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`rights-card rounded-3xl border-2 transition-all duration-500 overflow-hidden ${
                  isOpen ? 'border-cyber-blue bg-surface-lighter shadow-cyber-blue' : 'border-surface-border bg-surface'
                }`}
              >
                <button
                  onClick={() => toggle(scenario.id)}
                  className="w-full flex items-center gap-5 px-6 py-6 text-left group"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${scenario.color}20`, border: `1px solid ${scenario.color}40` }}
                  >
                    <Icon size={24} style={{ color: scenario.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-black text-lg uppercase leading-none mb-1">{scenario.label}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{scenario.sublabel}</p>
                  </div>
                  <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }} 
                    className={`p-2 rounded-full ${isOpen ? 'bg-cyber-blue text-background' : 'bg-white/5 text-slate-500'}`}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-8"
                    >
                      <div className="h-px bg-white/5 w-full mb-8" />

                      {/* RIGHTS LIST */}
                      <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                          <Gavel size={16} className="text-cyber-blue" />
                          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyber-blue">Base Juridique</h4>
                        </div>
                        <ul className="grid gap-3">
                          {scenario.droits.map((droit, i) => (
                            <motion.li 
                              key={i}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-slate-200 leading-relaxed hover:border-cyber-blue/30 transition-colors"
                            >
                              {droit}
                            </motion.li>
                          ))}
                        </ul>
                      </div>

                      {/* ACTION SCRIPT (DYNAMIC REBUILD) */}
                      <div className="mb-8 p-6 rounded-3xl bg-cyber-pink/10 border border-cyber-pink/20 relative overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-widest text-cyber-pink mb-3">Protocole d'Entrée</p>
                        <p className="text-xl font-heading font-bold text-white italic leading-tight">
                          "{scenario.action_script}"
                        </p>
                        <Zap size={60} className="absolute -bottom-4 -right-4 text-cyber-pink/5" />
                      </div>

                      {/* CTA SECTION */}
                      <div className="grid grid-cols-2 gap-4">
                        <Link
                          href={`/carte?besoin=${scenario.id}`}
                          className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-background font-black uppercase text-[10px] tracking-widest hover:shadow-white transition-all active:scale-95"
                        >
                          Scanner la Carte
                        </Link>
                        <a
                          href={`tel:${scenario.urgence_number}`}
                          className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-red-500 text-red-500 font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
                        >
                          <Phone size={14} /> {scenario.urgence_label}
                        </a>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER DISCRET */}
      <footer className="px-6 py-10 text-center">
        <p className="text-[10px] text-slate-700 font-black uppercase tracking-[0.4em]">
          Dernière Mise à jour Juridique : Mai 2026
        </p>
      </footer>
    </div>
  );
}
