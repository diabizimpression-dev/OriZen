"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronDown, Phone, Home, Utensils,
  HeartPulse, AlertTriangle, FileText, Baby, ShieldAlert, Wallet
} from "lucide-react";
import { SCENARIO_LIST } from "@/lib/scenarios";

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

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#020617]/95 backdrop-blur border-b border-slate-800/70 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => window.location.href = "/"}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div>
          <h1 className="font-bold text-white text-base">Vos droits</h1>
          <p className="text-xs text-slate-500">Guide par situation · France</p>
        </div>
      </header>

      {/* Notice */}
      <div className="px-4 pt-4 pb-2">
        <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-xs text-slate-400 leading-relaxed">
          Informations données à titre indicatif. Pour une aide personnalisée, utilisez{" "}
          <a href="/assistant" className="text-indigo-400 underline underline-offset-2">l'assistant</a>
          {" "}ou{" "}
          <a href="/carte" className="text-indigo-400 underline underline-offset-2">la carte</a>.
        </div>
      </div>

      {/* Accordéon par scénario */}
      <div className="px-4 py-3 flex flex-col gap-3 max-w-lg mx-auto pb-8">
        {SCENARIO_LIST.map((scenario) => {
          const Icon = ICONS[scenario.id] ?? FileText;
          const isOpen = openId === scenario.id;

          return (
            <div
              key={scenario.id}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{
                borderColor: isOpen ? scenario.color + "60" : "rgba(51,65,85,0.5)",
                background: isOpen ? scenario.color + "08" : "rgba(15,23,42,0.6)",
              }}
            >
              {/* Trigger */}
              <button
                onClick={() => toggle(scenario.id)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: scenario.color + "20" }}
                >
                  <Icon size={18} style={{ color: scenario.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{scenario.label}</p>
                  <p className="text-xs text-slate-500 truncate">{scenario.sublabel}</p>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-slate-500 shrink-0" />
                </motion.div>
              </button>

              {/* Contenu accordéon */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 flex flex-col gap-4">
                      {/* Droits */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Vos droits
                        </h3>
                        <ul className="flex flex-col gap-1.5">
                          {scenario.droits.map((droit) => (
                            <li key={droit} className="flex items-start gap-2 text-sm text-slate-300">
                              <span style={{ color: scenario.color }} className="shrink-0 mt-1 text-xs">●</span>
                              {droit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Documents */}
                      {scenario.documents.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/30">
                          <h3 className="text-xs font-semibold text-amber-400 mb-1.5">
                            Documents utiles
                          </h3>
                          {scenario.documents.map((doc) => (
                            <p key={doc} className="text-xs text-amber-200/80">· {doc}</p>
                          ))}
                        </div>
                      )}

                      {/* Script d'action */}
                      <div
                        className="p-3 rounded-xl border"
                        style={{ background: scenario.color + "10", borderColor: scenario.color + "30" }}
                      >
                        <p className="text-xs font-semibold mb-1" style={{ color: scenario.color }}>
                          Que dire à l'arrivée
                        </p>
                        <p className="text-xs text-slate-300 italic">"{scenario.action_script}"</p>
                      </div>

                      {/* Contacts nationaux */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Contacts
                        </h3>
                        <div className="flex flex-col gap-2">
                          {scenario.contacts_nationaux.map((c) => (
                            <a
                              key={c.number}
                              href={`tel:${c.number.replace(/\s/g, "")}`}
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 transition-colors active:scale-98"
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">{c.label}</p>
                                <p className="text-xs text-slate-400">{c.desc}</p>
                              </div>
                              <div className="flex items-center gap-1.5" style={{ color: scenario.color }}>
                                <Phone size={14} />
                                <span className="font-bold text-sm">{c.number}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* CTA carte */}
                      <a
                        href={`/carte?besoin=${scenario.id}`}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors"
                        style={{
                          background: scenario.color + "20",
                          color: scenario.color,
                          border: `1px solid ${scenario.color}40`,
                        }}
                      >
                        Voir les structures proches →
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
