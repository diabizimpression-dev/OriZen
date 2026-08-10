"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Scale, ChevronRight, CheckCircle2, XCircle, Loader2, ExternalLink, FileText, Phone } from "lucide-react";

interface AJResult {
  eligible: boolean;
  level: string;
  label: string;
  taux_prise_en_charge: number;
  plafond_applicable: number;
  revenu_retenu: number;
  description: string;
  droits: string[];
  demarche: string;
  documents_requis: string[];
  contacts: Array<{ nom: string; url: string; tel?: string }>;
}

const TAUX_COLORS: Record<number, string> = {
  100: "#10B981",
  55: "#6366F1",
  25: "#F59E0B",
  0: "#EF4444",
};

export default function AideJuridictionnellePage() {
  const [revenu, setRevenu] = useState("");
  const [nbPersonnes, setNbPersonnes] = useState(1);
  const [result, setResult] = useState<AJResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculated, setCalculated] = useState(false);

  const calculate = async () => {
    const rev = parseFloat(revenu.replace(",", "."));
    if (isNaN(rev)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/aide-juridictionnelle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revenu_mensuel: rev, nb_personnes: nbPersonnes }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data);
        setCalculated(true);
      }
    } catch { /* silencieux */ }
    finally { setLoading(false); }
  };

  const color = result ? (TAUX_COLORS[result.taux_prise_en_charge] ?? "#8B5CF6") : "#8B5CF6";

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#020617]/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/droits")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-violet-400" />
              <h1 className="font-bold text-white text-sm">Aide Juridictionnelle</h1>
            </div>
            <p className="text-xs text-slate-500">Calculer mon éligibilité · Barème 2024</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-2xl bg-slate-900 border border-slate-800"
        >
          <h2 className="text-sm font-semibold text-white mb-4">Calculer votre éligibilité</h2>

          {/* Revenu mensuel */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Revenus mensuels nets (€/mois)
            </label>
            <div className="relative">
              <input
                type="number"
                value={revenu}
                onChange={(e) => setRevenu(e.target.value)}
                placeholder="ex : 900"
                min="0"
                max="9999"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm pr-12 focus:outline-none focus:border-violet-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">€</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Salaires, pensions, allocations (hors RSA/AAH). En cas de doute, indiquez 0.
            </p>
          </div>

          {/* Nombre de personnes */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Personnes à charge (vous inclus)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNbPersonnes(n)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border"
                  style={{
                    background: nbPersonnes === n ? "#8B5CF620" : "transparent",
                    borderColor: nbPersonnes === n ? "#8B5CF660" : "#334155",
                    color: nbPersonnes === n ? "#a78bfa" : "#64748b",
                  }}
                >
                  {n}{n === 5 ? "+" : ""}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={calculate}
            disabled={!revenu || loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#8B5CF6", color: "white" }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
            {loading ? "Calcul en cours…" : "Calculer mon éligibilité"}
          </button>
        </motion.div>

        {/* Résultat */}
        <AnimatePresence>
          {calculated && result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Verdict */}
              <div
                className="p-5 rounded-2xl border"
                style={{ background: color + "12", borderColor: color + "40" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  {result.eligible
                    ? <CheckCircle2 size={24} style={{ color }} />
                    : <XCircle size={24} style={{ color }} />
                  }
                  <div>
                    <p className="font-bold text-white text-base">{result.label}</p>
                    <p className="text-xs" style={{ color }}>
                      {result.taux_prise_en_charge > 0
                        ? `${result.taux_prise_en_charge}% pris en charge par l'État`
                        : "Hors barème"}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{result.description}</p>
              </div>

              {/* Droits / Alternatives */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  {result.eligible ? "Ce que couvre l'AJ" : "Alternatives disponibles"}
                </h3>
                <div className="flex flex-col gap-2">
                  {result.droits.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <span style={{ color }} className="shrink-0 text-sm">·</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{d}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Démarche */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Comment faire ?</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{result.demarche}</p>
              </div>

              {/* Documents */}
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText size={12} />
                  Documents à rassembler
                </h3>
                <div className="flex flex-col gap-1.5">
                  {result.documents_requis.map((doc, i) => (
                    <p key={i} className="text-xs text-slate-300 flex gap-2">
                      <span className="text-amber-500 shrink-0">·</span>
                      {doc}
                    </p>
                  ))}
                </div>
              </div>

              {/* Contacts */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Liens utiles</h3>
                <div className="flex flex-col gap-2">
                  {result.contacts.map((c, i) => (
                    <a
                      key={i}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors"
                    >
                      {c.tel ? <Phone size={14} className="text-violet-400 shrink-0" /> : <ExternalLink size={14} className="text-violet-400 shrink-0" />}
                      <span className="text-xs text-slate-300 flex-1">{c.nom}</span>
                      <ChevronRight size={12} className="text-slate-600" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-slate-600 text-center leading-relaxed">
                Calcul indicatif basé sur le barème 2024. La décision finale appartient au bureau de l&apos;aide juridictionnelle du Tribunal Judiciaire.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
