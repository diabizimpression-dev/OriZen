"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Briefcase, MapPin, Clock, Euro,
  ExternalLink, Loader2, RefreshCw, ChevronDown,
} from "lucide-react";

interface Offre {
  id: string;
  titre: string;
  entreprise: string;
  lieu: string;
  contrat: string;
  duree: string;
  salaire: string | null;
  debutant: boolean;
  dateCreation: string;
  url: string;
  competences: string[];
  description: string;
}

const PROFILS = [
  { id: "insertion", label: "Insertion", sublabel: "Sans qualification · CUI · Missions", color: "#10B981" },
  { id: "saisonnier", label: "Saisonnier", sublabel: "Récolte · Hôtellerie · Tourisme", color: "#F59E0B" },
  { id: "qualifie", label: "Qualifié", sublabel: "CDI · CDD · Tous secteurs", color: "#6366F1" },
] as const;
type ProfilId = typeof PROFILS[number]["id"];

export default function EmploiPage() {
  const [profil, setProfil] = useState<ProfilId>("insertion");
  const [offres, setOffres] = useState<Offre[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords({ lat: 48.8566, lng: 2.3522 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords({ lat: 48.8566, lng: 2.3522 }),
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    fetchOffres(coords.lat, coords.lng, profil);
  }, [coords, profil]);

  const fetchOffres = async (lat: number, lng: number, p: ProfilId) => {
    setLoading(true);
    setOffres([]);
    try {
      const res = await fetch(`/api/emploi?lat=${lat}&lng=${lng}&profil=${p}&radius=20`);
      const data = await res.json();
      if (data.configured === false) {
        setConfigured(false);
      } else {
        setConfigured(true);
        setOffres(data.offres ?? []);
      }
    } catch {
      setConfigured(true);
    } finally {
      setLoading(false);
    }
  };

  const profilData = PROFILS.find((p) => p.id === profil)!;

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#020617]/95 backdrop-blur border-b border-slate-800/70 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => (window.location.href = "/")}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div>
          <h1 className="font-bold text-white text-base">Offres d&apos;emploi</h1>
          <p className="text-xs text-slate-500">France Travail · 20 km autour de vous</p>
        </div>
        {coords && (
          <button
            onClick={() => fetchOffres(coords.lat, coords.lng, profil)}
            className="ml-auto p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={16} className={`text-slate-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto">
        {/* Sélecteur profil */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {PROFILS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfil(p.id)}
              className="flex flex-col items-center py-2.5 px-2 rounded-xl border transition-all text-center"
              style={{
                background: profil === p.id ? p.color + "18" : "rgba(15,23,42,0.6)",
                borderColor: profil === p.id ? p.color + "60" : "rgba(51,65,85,0.5)",
              }}
            >
              <span className="text-xs font-bold" style={{ color: profil === p.id ? p.color : "#94a3b8" }}>
                {p.label}
              </span>
              <span className="text-xs text-slate-600 mt-0.5 leading-tight">{p.sublabel}</span>
            </button>
          ))}
        </div>

        {/* Notice */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 mb-4">
          Offres France Travail · Débutants acceptés prioritaires · Contrats d&apos;insertion disponibles ·
          <a
            href="https://candidat.francetravail.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline underline-offset-2 ml-1"
          >
            francetravail.fr
          </a>
        </div>

        {!configured && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 mb-4">
            <p className="font-semibold text-amber-400 mb-1">API France Travail non configurée</p>
            <p>Ajoutez <code className="text-amber-300">FRANCE_TRAVAIL_CLIENT_ID</code> et{" "}
              <code className="text-amber-300">FRANCE_TRAVAIL_CLIENT_SECRET</code> dans vos variables d&apos;environnement.</p>
            <a
              href="https://francetravail.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline underline-offset-2 mt-1 inline-block"
            >
              Inscription gratuite →
            </a>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Recherche des offres proches…</span>
          </div>
        )}

        {/* Offres */}
        <AnimatePresence>
          {!loading && offres.length > 0 && (
            <div className="flex flex-col gap-3 pb-8">
              {offres.map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"
                >
                  {/* En-tête offre */}
                  <button
                    onClick={() => setOpenId(openId === o.id ? null : o.id)}
                    className="w-full flex items-start gap-3 p-4 text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: profilData.color + "22" }}
                    >
                      <Briefcase size={16} style={{ color: profilData.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white leading-tight">{o.titre}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{o.entreprise}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {o.lieu && (
                          <span className="flex items-center gap-0.5 text-xs text-slate-500">
                            <MapPin size={9} />
                            {o.lieu}
                          </span>
                        )}
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{ background: profilData.color + "22", color: profilData.color }}
                        >
                          {o.contrat}
                        </span>
                        {o.debutant && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-950/60 text-green-400 font-medium">
                            Débutant ✓
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.div animate={{ rotate: openId === o.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={14} className="text-slate-500 shrink-0 mt-1" />
                    </motion.div>
                  </button>

                  {/* Détail */}
                  <AnimatePresence initial={false}>
                    {openId === o.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 flex flex-col gap-3">
                          {o.description && (
                            <p className="text-xs text-slate-400 leading-relaxed">{o.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {o.duree && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={10} /> {o.duree}
                              </span>
                            )}
                            {o.salaire && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Euro size={10} /> {o.salaire}
                              </span>
                            )}
                          </div>
                          {o.competences.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {o.competences.map((c) => (
                                <span
                                  key={c}
                                  className="text-xs px-2 py-0.5 rounded-full border border-slate-700 text-slate-400"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          )}
                          <a
                            href={o.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                            style={{ background: profilData.color + "20", color: profilData.color, border: `1px solid ${profilData.color}40` }}
                          >
                            <ExternalLink size={13} />
                            Voir l&apos;offre sur France Travail
                          </a>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {!loading && configured && offres.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            Aucune offre trouvée dans ce rayon.
          </div>
        )}
      </div>
    </div>
  );
}
