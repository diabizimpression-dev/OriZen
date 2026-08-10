"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Phone, MapPin, CheckCircle2, Loader2, AlertCircle, Copy } from "lucide-react";

interface PlanData {
  scenario: string;
  title: string;
  steps: string[];
  contacts: string[];
  structures?: Array<{ name: string; addr: string; phone?: string; lat?: number; lng?: number }>;
  createdAt: number;
}

const SCENARIO_COLOR: Record<string, string> = {
  logement: "#6366F1", alimentation: "#10B981", sante: "#F59E0B",
  urgence: "#EF4444", "sans-papiers": "#8B5CF6", "mineur-isole": "#06B6D4",
  "violence-familiale": "#EC4899", "aide-financiere": "#F97316",
};

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/plan?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setPlan(data.plan);
        else setError(data.error ?? "Plan introuvable");
      })
      .catch(() => setError("Erreur réseau"))
      .finally(() => setLoading(false));
  }, [id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: plan?.title ?? "Mon plan OriZen", url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const color = plan ? (SCENARIO_COLOR[plan.scenario] ?? "#8B5CF6") : "#8B5CF6";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertCircle size={48} className="text-red-400" />
        <h1 className="text-white text-xl font-bold">Plan introuvable</h1>
        <p className="text-slate-400 text-sm">{error ?? "Ce plan a peut-être expiré (24h)."}</p>
        <Link href="/" className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700">
          Créer un nouveau plan
        </Link>
      </div>
    );
  }

  const age = Math.round((Date.now() - plan.createdAt) / 60000);
  const ageLabel = age < 60 ? `Il y a ${age} min` : age < 1440 ? `Il y a ${Math.round(age / 60)}h` : "Il y a plus d'un jour";

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#020617]/95 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-bold truncate" style={{ color }}>Plan d'action</h1>
          <p className="text-xs text-slate-500">{ageLabel}</p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
          style={{ background: color + "20", color, border: `1px solid ${color}40` }}
        >
          {copied ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
          {copied ? "Copié !" : "Partager"}
        </button>
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        {/* Titre */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 capitalize"
            style={{ background: color + "20", color, border: `1px solid ${color}30` }}>
            {plan.scenario.replace("-", " ")}
          </div>
          <h2 className="text-xl font-bold text-white leading-snug">{plan.title}</h2>
        </motion.div>

        {/* Étapes */}
        {plan.steps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Étapes</h3>
            <div className="flex flex-col gap-2">
              {plan.steps.map((step, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: color + "25", color }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contacts */}
        {plan.contacts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contacts</h3>
            <div className="flex flex-col gap-2">
              {plan.contacts.map((contact, i) => {
                const phoneMatch = contact.match(/(\d[\d\s]{7,})/);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <Phone size={14} style={{ color }} className="shrink-0" />
                    <p className="text-sm text-slate-200 flex-1">{contact}</p>
                    {phoneMatch && (
                      <a href={`tel:${phoneMatch[1].replace(/\s/g, "")}`}
                        className="text-xs font-semibold px-2 py-1 rounded-lg"
                        style={{ background: color + "20", color }}>
                        Appeler
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Structures */}
        {plan.structures && plan.structures.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Structures recommandées</h3>
            <div className="flex flex-col gap-2">
              {plan.structures.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-sm font-semibold text-white mb-1">{s.name}</p>
                  {s.addr && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                      <MapPin size={10} />{s.addr}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {s.phone && (
                      <a href={`tel:${s.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: color + "20", color }}>
                        <Phone size={10} /> Appeler
                      </a>
                    )}
                    {s.lat && s.lng && (
                      <a href={`https://maps.google.com/?daddr=${s.lat},${s.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
                        <MapPin size={10} /> Itinéraire
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Copy link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <p className="text-xs text-slate-500 mb-2">Lien de partage (valide 24h)</p>
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
            <p className="text-xs text-slate-400 flex-1 truncate">{shareUrl}</p>
            <button onClick={handleShare} className="shrink-0">
              <Copy size={14} className="text-slate-400 hover:text-white transition-colors" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
