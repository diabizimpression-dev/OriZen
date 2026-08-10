"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Loader2, ExternalLink, MapPin, Calendar, Users, ChevronDown, ChevronUp, Info } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  organization: string;
  city: string;
  department: string;
  domain: string;
  duration: string;
  startDate: string;
  places: number;
  description: string;
  url: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  "ALL": "Tous les domaines",
  "solidarite-insertion": "Solidarité",
  "sante": "Santé",
  "education": "Éducation",
  "environnement": "Environnement",
  "culture-loisirs": "Culture",
  "sport": "Sport",
  "humanitaire": "Humanitaire",
};

const DOMAIN_COLORS: Record<string, string> = {
  "solidarite-insertion": "#EF4444",
  "sante": "#F59E0B",
  "education": "#6366F1",
  "environnement": "#10B981",
  "culture-loisirs": "#8B5CF6",
  "sport": "#06B6D4",
  "humanitaire": "#EC4899",
};

export default function ServiceCiviquePage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [source, setSource] = useState<string>("fallback");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 48.8566, lng: 2.3522 })
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    const params = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      domain,
      limit: "8",
    });
    fetch(`/api/service-civique?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setMissions(data.missions ?? []);
          setSource(data.source ?? "fallback");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [coords, domain]);

  return (
    <div className="min-h-screen bg-[#020617] text-white pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#020617]/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-rose-400" />
              <h1 className="font-bold text-white text-sm">Service Civique</h1>
            </div>
            <p className="text-xs text-slate-500">Missions rémunérées · 16–25 ans · ~580€/mois</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-lg mx-auto">
        {/* Info banner */}
        <div className="mb-5 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 flex gap-3">
          <Info size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-rose-300 mb-1">Qu&apos;est-ce que le Service Civique ?</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Engagement volontaire de 6 à 12 mois pour les 16–25 ans (30 ans si handicap).
              Indemnisation ~580€/mois nette, prise en charge de la protection sociale.
              Aucun diplôme requis.
            </p>
          </div>
        </div>

        {/* Filtre domaine */}
        <div className="mb-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Domaine</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setDomain(key)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                style={{
                  background: domain === key ? (DOMAIN_COLORS[key] ?? "#6366F1") + "25" : "transparent",
                  borderColor: domain === key ? (DOMAIN_COLORS[key] ?? "#6366F1") + "60" : "#334155",
                  color: domain === key ? (DOMAIN_COLORS[key] ?? "#818cf8") : "#64748b",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Missions */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Recherche de missions...</span>
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-14 text-slate-600">
            <Heart size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune mission trouvée</p>
            <a
              href="https://www.service-civique.gouv.fr/missions/chercher-une-mission"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300"
            >
              <ExternalLink size={12} />
              Chercher sur service-civique.gouv.fr
            </a>
          </div>
        ) : (
          <AnimatePresence>
            <div className="flex flex-col gap-3">
              {missions.map((m, i) => {
                const color = DOMAIN_COLORS[m.domain] ?? "#6366F1";
                const isExpanded = expandedId === m.id;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: color + "30", background: color + "08" }}
                  >
                    <button
                      className="w-full text-left p-4"
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: color + "20", color }}
                            >
                              {DOMAIN_LABELS[m.domain] ?? m.domain}
                            </span>
                            {m.places > 1 && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Users size={10} />{m.places} places
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-white leading-snug mb-1">{m.title}</h3>
                          <p className="text-xs text-slate-400">{m.organization}</p>
                        </div>
                        {isExpanded ? <ChevronUp size={16} className="text-slate-500 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-slate-500 shrink-0 mt-1" />}
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin size={10} />{m.city}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar size={10} />{m.startDate}
                        </span>
                        <span className="text-xs font-medium" style={{ color }}>
                          {m.duration}
                        </span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-slate-800/60 pt-3">
                            {m.description && (
                              <p className="text-xs text-slate-400 leading-relaxed mb-3">{m.description}</p>
                            )}
                            <a
                              href={m.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                              style={{ background: color + "20", color, border: `1px solid ${color}40` }}
                            >
                              <ExternalLink size={12} />
                              Candidater sur service-civique.gouv.fr
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}

        {/* Source indicator */}
        {!loading && (
          <p className="mt-4 text-center text-xs text-slate-600">
            {source === "api" ? "Missions en temps réel · service-civique.gouv.fr" : "Exemples de missions · voir service-civique.gouv.fr pour toutes les offres"}
          </p>
        )}

        {/* CTA officiel */}
        <a
          href="https://www.service-civique.gouv.fr/missions/chercher-une-mission"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 py-3 rounded-2xl w-full text-sm font-semibold transition-colors"
          style={{ background: "#EF44441a", color: "#f87171", border: "1px solid #EF444430" }}
        >
          <ExternalLink size={14} />
          Toutes les missions — service-civique.gouv.fr
        </a>
      </div>
    </div>
  );
}
