"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronDown, Phone, Home, Utensils,
  HeartPulse, AlertTriangle, FileText, Baby, ShieldAlert,
  Wallet, BookOpen, Scale, ExternalLink, Loader2, Send,
  Sparkles, Users, Mail, Globe,
} from "lucide-react";
import { SCENARIO_LIST } from "@/lib/scenarios";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LegifranceResult {
  id: string;
  title: string;
  articleNum: string;
  text: string;
  nature: string;
  dateTexte: string | null;
  url: string;
}

interface Decision {
  id: string;
  number: string;
  chamber: string;
  date: string;
  solution: string;
  summary: string;
  url: string;
}

interface LegalData {
  legifrance: LegifranceResult[];
  jurisprudence: Decision[];
  loading: boolean;
  loaded: boolean;
  configured: boolean;
}

interface GenialAnswer {
  answer: string;
  source: "genial" | "groq" | "none";
  loading: boolean;
}

interface AssocData {
  associations: Array<{
    id: string; name: string; objet: string; address: string;
    phone: string | null; email: string | null; website: string | null;
    distance_m: number | null;
  }>;
  loading: boolean;
  loaded: boolean;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

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

// ─── Composant principal ─────────────────────────────────────────────────────

export default function DroitsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [legalData, setLegalData] = useState<Record<string, LegalData>>({});
  const [genialAnswers, setGenialAnswers] = useState<Record<string, GenialAnswer>>({});
  const [genialQuestions, setGenialQuestions] = useState<Record<string, string>>({});
  const [assocData, setAssocData] = useState<Record<string, AssocData>>({});
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Géolocalisation silencieuse pour les associations
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setUserCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  const fetchLegalData = useCallback(async (scenarioId: string) => {
    // Déjà chargé ou en cours
    if (legalData[scenarioId]?.loaded || legalData[scenarioId]?.loading) return;

    setLegalData((prev) => ({
      ...prev,
      [scenarioId]: {
        legifrance: [],
        jurisprudence: [],
        loading: true,
        loaded: false,
        configured: true,
      },
    }));

    try {
      const [lgRes, juriRes] = await Promise.allSettled([
        fetch(`/api/legifrance?scenario=${scenarioId}`).then((r) => r.json()),
        fetch(`/api/jurisprudence?scenario=${scenarioId}`).then((r) => r.json()),
      ]);

      const lg = lgRes.status === "fulfilled" ? lgRes.value : { results: [], configured: false };
      const juri = juriRes.status === "fulfilled" ? juriRes.value : { decisions: [], configured: false };

      setLegalData((prev) => ({
        ...prev,
        [scenarioId]: {
          legifrance: lg.results ?? [],
          jurisprudence: juri.decisions ?? [],
          loading: false,
          loaded: true,
          configured: lg.configured !== false || juri.configured !== false,
        },
      }));
    } catch {
      setLegalData((prev) => ({
        ...prev,
        [scenarioId]: {
          legifrance: [],
          jurisprudence: [],
          loading: false,
          loaded: true,
          configured: false,
        },
      }));
    }
  }, [legalData]);

  const fetchAssocData = useCallback(async (scenarioId: string) => {
    if (assocData[scenarioId]?.loaded || assocData[scenarioId]?.loading) return;
    const coords = userCoords;
    if (!coords) return;

    setAssocData((prev) => ({
      ...prev,
      [scenarioId]: { associations: [], loading: true, loaded: false },
    }));

    try {
      const res = await fetch(
        `/api/associations?lat=${coords.lat}&lng=${coords.lng}&scenario=${scenarioId}&radius=5000`
      );
      const data = await res.json();
      setAssocData((prev) => ({
        ...prev,
        [scenarioId]: { associations: data.associations ?? [], loading: false, loaded: true },
      }));
    } catch {
      setAssocData((prev) => ({
        ...prev,
        [scenarioId]: { associations: [], loading: false, loaded: true },
      }));
    }
  }, [assocData, userCoords]);

  const toggle = (id: string) => {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
      fetchLegalData(id);
      fetchAssocData(id);
    }
  };

  const askGenial = useCallback(async (scenarioId: string) => {
    const question = genialQuestions[scenarioId]?.trim();
    if (!question) return;

    setGenialAnswers((prev) => ({
      ...prev,
      [scenarioId]: { answer: "", source: "groq", loading: true },
    }));

    try {
      const res = await fetch("/api/genial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, scenario: scenarioId }),
      });
      const data = await res.json();
      setGenialAnswers((prev) => ({
        ...prev,
        [scenarioId]: {
          answer: data.answer ?? "",
          source: data.source ?? "groq",
          loading: false,
        },
      }));
    } catch {
      setGenialAnswers((prev) => ({
        ...prev,
        [scenarioId]: { answer: "Erreur de connexion.", source: "none", loading: false },
      }));
    }
  }, [genialQuestions]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#020617]/95 backdrop-blur border-b border-slate-800/70 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div>
          <h1 className="font-bold text-white text-base">Vos droits</h1>
          <p className="text-xs text-slate-500">
            Légifrance · Judilibre · France
          </p>
        </div>
        {/* Badges sources officielles */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-400 font-medium">
            Légifrance
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 font-medium">
            Judilibre
          </span>
        </div>
      </header>

      {/* Notice */}
      <div className="px-4 pt-4 pb-2">
        <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-xs text-slate-400 leading-relaxed">
          Textes de loi issus de{" "}
          <a
            href="https://www.legifrance.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline underline-offset-2"
          >
            Légifrance
          </a>{" "}
          et jurisprudence de la{" "}
          <a
            href="https://www.courdecassation.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline underline-offset-2"
          >
            Cour de Cassation
          </a>
          . Sources officielles, données temps réel.
        </div>
      </div>

      {/* Accordéon */}
      <div className="px-4 py-3 flex flex-col gap-3 max-w-lg mx-auto pb-8">
        {SCENARIO_LIST.map((scenario) => {
          const Icon = ICONS[scenario.id] ?? FileText;
          const isOpen = openId === scenario.id;
          const legal = legalData[scenario.id];

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

              {/* Contenu */}
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

                      {/* Droits statiques (scenarios.ts) */}
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

                      {/* ── LÉGIFRANCE — Textes officiels ── */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={13} className="text-blue-400" />
                          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                            Textes de loi officiels
                          </h3>
                          <span className="ml-auto text-xs text-slate-600">legifrance.gouv.fr</span>
                        </div>

                        {legal?.loading ? (
                          <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <Loader2 size={14} className="text-slate-500 animate-spin" />
                            <span className="text-xs text-slate-500">Chargement Légifrance…</span>
                          </div>
                        ) : legal?.loaded && legal.legifrance.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {legal.legifrance.map((result) => (
                              <a
                                key={result.id}
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 rounded-xl bg-blue-950/30 border border-blue-800/30 hover:bg-blue-950/50 transition-colors group"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    {result.articleNum && (
                                      <span className="text-xs font-bold text-blue-400 mr-1.5">
                                        {result.articleNum}
                                      </span>
                                    )}
                                    <span className="text-xs font-semibold text-slate-200 break-words">
                                      {result.title}
                                    </span>
                                    {result.nature && (
                                      <span className="ml-1.5 text-xs text-slate-500">
                                        · {result.nature}
                                      </span>
                                    )}
                                  </div>
                                  <ExternalLink
                                    size={11}
                                    className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-0.5"
                                  />
                                </div>
                                {result.text && (
                                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                    {result.text}
                                  </p>
                                )}
                              </a>
                            ))}
                            <a
                              href={`https://www.legifrance.gouv.fr/search/code?tab_selection=code&query=${encodeURIComponent(scenario.label)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors pl-1"
                            >
                              Voir tous les textes sur Légifrance →
                            </a>
                          </div>
                        ) : legal?.loaded && !legal.configured ? (
                          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
                            Configurez{" "}
                            <code className="text-slate-400">PISTE_CLIENT_ID</code> +{" "}
                            <code className="text-slate-400">PISTE_CLIENT_SECRET</code> pour activer.{" "}
                            <a
                              href="https://piste.gouv.fr/registration"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 underline underline-offset-2"
                            >
                              Inscription gratuite →
                            </a>
                          </div>
                        ) : legal?.loaded ? (
                          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
                            Aucun résultat trouvé pour ce scénario.
                          </div>
                        ) : null}
                      </div>

                      {/* ── JUDILIBRE — Jurisprudence ── */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Scale size={13} className="text-indigo-400" />
                          <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                            Jurisprudence
                          </h3>
                          <span className="ml-auto text-xs text-slate-600">Cour de Cassation</span>
                        </div>

                        {legal?.loading ? (
                          <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <Loader2 size={14} className="text-slate-500 animate-spin" />
                            <span className="text-xs text-slate-500">Chargement Judilibre…</span>
                          </div>
                        ) : legal?.loaded && legal.jurisprudence.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {legal.jurisprudence.map((dec) => (
                              <a
                                key={dec.id}
                                href={dec.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/30 hover:bg-indigo-950/50 transition-colors group"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-indigo-400">
                                      Cass. {dec.chamber}
                                    </span>
                                    {dec.date && (
                                      <span className="text-xs text-slate-500 ml-1.5">
                                        {new Date(dec.date).toLocaleDateString("fr-FR", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                    )}
                                    {dec.number && (
                                      <span className="text-xs text-slate-600 ml-1.5">
                                        n° {dec.number}
                                      </span>
                                    )}
                                  </div>
                                  <ExternalLink
                                    size={11}
                                    className="text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0 mt-0.5"
                                  />
                                </div>
                                {dec.solution && (
                                  <span className="inline-block mt-1 text-xs px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300 font-medium">
                                    {dec.solution}
                                  </span>
                                )}
                                {dec.summary && (
                                  <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-3">
                                    {dec.summary}
                                  </p>
                                )}
                              </a>
                            ))}
                            <a
                              href={`https://www.legifrance.gouv.fr/juri/search?tab_selection=juri&query=${encodeURIComponent(scenario.label)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors pl-1"
                            >
                              Voir toute la jurisprudence →
                            </a>
                          </div>
                        ) : legal?.loaded && !legal.configured ? null : (
                          legal?.loaded ? (
                            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
                              Aucune décision trouvée.
                            </div>
                          ) : null
                        )}
                      </div>

                      {/* ── GENIAL — Assistant juridique IA ── */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={13} className="text-violet-400" />
                          <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                            Question juridique IA
                          </h3>
                          <span className="ml-auto text-xs text-slate-600">
                            {genialAnswers[scenario.id]?.source === "genial"
                              ? "GenIA-L · Lefebvre"
                              : "OriZen IA"}
                          </span>
                        </div>

                        {/* Input question */}
                        <div className="flex gap-2 mb-2">
                          <input
                            ref={(el) => { inputRefs.current[scenario.id] = el; }}
                            type="text"
                            value={genialQuestions[scenario.id] ?? ""}
                            onChange={(e) =>
                              setGenialQuestions((prev) => ({
                                ...prev,
                                [scenario.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") askGenial(scenario.id);
                            }}
                            placeholder="Posez votre question juridique…"
                            className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:border-violet-600 transition-colors"
                          />
                          <button
                            onClick={() => askGenial(scenario.id)}
                            disabled={
                              !genialQuestions[scenario.id]?.trim() ||
                              genialAnswers[scenario.id]?.loading
                            }
                            className="p-2 rounded-xl bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {genialAnswers[scenario.id]?.loading ? (
                              <Loader2 size={14} className="text-white animate-spin" />
                            ) : (
                              <Send size={14} className="text-white" />
                            )}
                          </button>
                        </div>

                        {/* Réponse IA */}
                        <AnimatePresence>
                          {genialAnswers[scenario.id]?.answer && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/40"
                            >
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles size={10} className="text-violet-400" />
                                <span className="text-xs font-semibold text-violet-400">
                                  {genialAnswers[scenario.id]?.source === "genial"
                                    ? "GenIA-L (Lefebvre Dalloz)"
                                    : "OriZen IA (Groq)"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {genialAnswers[scenario.id].answer}
                              </p>
                              <p className="text-xs text-slate-600 mt-2">
                                Vérifiez toujours sur legifrance.gouv.fr · Consultez un juriste pour des cas complexes
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* ── RNA — Associations locales ── */}
                      {userCoords && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Users size={13} className="text-emerald-400" />
                            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                              Associations locales
                            </h3>
                            <span className="ml-auto text-xs text-slate-600">RNA · data.gouv.fr</span>
                          </div>

                          {assocData[scenario.id]?.loading ? (
                            <div className="flex items-center gap-2 py-3 px-3 rounded-xl bg-slate-900/60 border border-slate-800">
                              <Loader2 size={14} className="text-slate-500 animate-spin" />
                              <span className="text-xs text-slate-500">Recherche associations…</span>
                            </div>
                          ) : assocData[scenario.id]?.loaded && assocData[scenario.id].associations.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {assocData[scenario.id].associations.slice(0, 4).map((a) => (
                                <div key={a.id} className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/30">
                                  <p className="text-xs font-semibold text-slate-200 leading-tight">{a.name}</p>
                                  {a.objet && (
                                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{a.objet}</p>
                                  )}
                                  {a.address && (
                                    <p className="text-xs text-slate-600 mt-1">{a.address}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    {a.distance_m != null && (
                                      <span className="text-xs text-emerald-500">
                                        {a.distance_m < 1000 ? `${a.distance_m} m` : `${(a.distance_m / 1000).toFixed(1)} km`}
                                      </span>
                                    )}
                                    {a.phone && (
                                      <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                                        <Phone size={9} /> {a.phone}
                                      </a>
                                    )}
                                    {a.email && (
                                      <a href={`mailto:${a.email}`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                                        <Mail size={9} /> Email
                                      </a>
                                    )}
                                    {a.website && (
                                      <a href={a.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                                        <Globe size={9} /> Site
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : assocData[scenario.id]?.loaded ? (
                            <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
                              Aucune association trouvée dans ce rayon.
                            </div>
                          ) : null}
                        </div>
                      )}

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
                        style={{
                          background: scenario.color + "10",
                          borderColor: scenario.color + "30",
                        }}
                      >
                        <p className="text-xs font-semibold mb-1" style={{ color: scenario.color }}>
                          Que dire à l&apos;arrivée
                        </p>
                        <p className="text-xs text-slate-300 italic">
                          &ldquo;{scenario.action_script}&rdquo;
                        </p>
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
                              className="flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
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
