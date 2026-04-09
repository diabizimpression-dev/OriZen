"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Utensils, HeartPulse, AlertTriangle, FileText,
  ArrowLeft, Send, Phone, MapPin, Mic, MicOff, Loader2, Share2, CheckCircle2
} from "lucide-react";
import { Analytics } from "@/components/Analytics";

// =====================================================
// OriZen Assistant — Interface boutons → chat conditionnel
// Flux : 5 boutons → envoi auto → réponse courte + action
// =====================================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface QuickSituation {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  prompt: string;
}

const QUICK_SITUATIONS: QuickSituation[] = [
  {
    id: "logement",
    label: "Je n'ai pas où dormir",
    icon: Home,
    color: "#6366F1",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.35)",
    prompt: "Je n'ai pas où dormir ce soir, j'ai besoin d'un hébergement d'urgence",
  },
  {
    id: "manger",
    label: "Je n'ai pas à manger",
    icon: Utensils,
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.35)",
    prompt: "Je n'ai pas à manger, je cherche une aide alimentaire d'urgence",
  },
  {
    id: "sante",
    label: "J'ai besoin de soins",
    icon: HeartPulse,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
    prompt: "J'ai besoin de soins médicaux gratuits sans carte vitale",
  },
  {
    id: "admin",
    label: "Problème administratif",
    icon: FileText,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.12)",
    border: "rgba(139,92,246,0.35)",
    prompt: "J'ai un problème administratif urgent, je ne sais pas quoi faire",
  },
  {
    id: "danger",
    label: "Je suis en danger",
    icon: AlertTriangle,
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.35)",
    prompt: "Je suis en situation de danger, j'ai besoin d'aide immédiatement",
  },
];

// Extrait les numéros de téléphone et les met en lien cliquable
function formatMessageContent(content: string) {
  const phoneRegex = /\b(0[0-9]{9}|[0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}|115|119|3919|3114|3230|17|15|18|112|114)\b/g;
  const parts = content.split(phoneRegex);
  return parts.map((part, i) => {
    if (phoneRegex.test(part) || /^(115|119|3919|17|15|18|112|114|3114|3230)$/.test(part)) {
      return (
        <a
          key={i}
          href={`tel:${part.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-1 text-green-400 font-bold underline underline-offset-2 hover:text-green-300"
        >
          <Phone size={12} />
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [activeSituation, setActiveSituation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Géolocalisation silencieuse au chargement
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // Silencieux si refus
      );
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setChatOpen(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: updatedMessages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          location,
        }),
      });
      const data = await res.json();
      const reply = data.reply || "Je n'ai pas compris. Appelez le 115 pour une aide immédiate.";

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Vocal si activé
      if (voiceEnabled && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.lang = "fr-FR";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Erreur de connexion. En cas d'urgence, appelez le **15** (SAMU) ou le **115** (SAMU Social).",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSituationClick = (situation: QuickSituation) => {
    setActiveSituation(situation.id);
    sendMessage(situation.prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const [planShared, setPlanShared] = useState(false);
  const [planUrl, setPlanUrl] = useState<string | null>(null);

  const sharePlan = async () => {
    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    if (assistantMsgs.length === 0) return;
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: activeSituation ?? "urgence",
          title: messages.find((m) => m.role === "user")?.content.slice(0, 80) ?? "Mon plan OriZen",
          steps: assistantMsgs.map((m) => m.content).slice(0, 5),
          contacts: [],
        }),
      });
      const data = await res.json();
      if (data.url) {
        setPlanUrl(data.url);
        setPlanShared(true);
        if (navigator.share) navigator.share({ title: "Mon plan OriZen", url: data.url });
        else await navigator.clipboard.writeText(data.url);
        setTimeout(() => setPlanShared(false), 3000);
      }
    } catch { /* silencieux */ }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-white">
      <Analytics page="/assistant" action={activeSituation ? "situation-selected" : undefined} scenario={activeSituation ?? undefined} />
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-800/70 backdrop-blur-sm bg-[#020617]/90 z-10">
        <button
          onClick={() => window.location.href = "/"}
          className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div className="text-center">
          <h1 className="font-bold text-white text-sm">Assistant OriZen</h1>
          {location && (
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <MapPin size={10} /> Localisé
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setVoiceEnabled(!voiceEnabled);
            if (voiceEnabled) window.speechSynthesis?.cancel();
          }}
          className={`p-2 rounded-xl transition-colors ${voiceEnabled ? "bg-indigo-600/30 text-indigo-400" : "hover:bg-slate-800 text-slate-500"}`}
          title={voiceEnabled ? "Désactiver le vocal" : "Activer le vocal"}
        >
          {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>
      </header>

      {/* Zone principale */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col">
        <AnimatePresence mode="wait">
          {/* ÉTAT INITIAL : boutons de situation */}
          {!chatOpen && messages.length === 0 && (
            <motion.div
              key="situations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col justify-center"
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Quelle est ta situation ?</h2>
                <p className="text-slate-500 text-sm">Tap pour obtenir une aide immédiate</p>
              </div>

              <div className="flex flex-col gap-3">
                {QUICK_SITUATIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSituationClick(s)}
                      className="flex items-center gap-4 p-4 rounded-2xl border text-left transition-all active:scale-95"
                      style={{ background: s.bg, borderColor: s.border }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: s.color + "25" }}
                      >
                        <Icon size={20} style={{ color: s.color }} />
                      </div>
                      <span className="font-semibold text-white text-sm">{s.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => { setChatOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                  className="text-xs text-slate-500 hover:text-slate-400 underline underline-offset-2 transition"
                >
                  Autre situation — écrire librement
                </button>
              </div>
            </motion.div>
          )}

          {/* ÉTAT CHAT : messages + input */}
          {(chatOpen || messages.length > 0) && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col"
            >
              {/* Messages */}
              <div className="flex-1 flex flex-col gap-3 pb-2">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-slate-800/80 text-slate-100 rounded-bl-md border border-slate-700/50"
                      }`}
                    >
                      {msg.role === "assistant"
                        ? formatMessageContent(msg.content)
                        : msg.content}
                    </div>
                  </motion.div>
                ))}

                {/* Indicateur de chargement */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                      <Loader2 size={14} className="text-indigo-400 animate-spin" />
                      <span className="text-xs text-slate-400">Recherche en cours...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Boutons d'action rapide après réponse */}
              <AnimatePresence>
                {lastAssistantMsg && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2 mb-3 overflow-x-auto pb-1"
                  >
                    <a
                      href="/carte"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium whitespace-nowrap hover:bg-indigo-600/30 transition-colors shrink-0"
                    >
                      <MapPin size={12} />
                      Voir sur la carte
                    </a>
                    <a
                      href="tel:115"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium whitespace-nowrap hover:bg-slate-700 transition-colors shrink-0"
                    >
                      <Phone size={12} />
                      Appeler le 115
                    </a>
                    <button
                      onClick={sharePlan}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-medium whitespace-nowrap hover:bg-violet-600/30 transition-colors shrink-0"
                    >
                      {planShared ? <CheckCircle2 size={12} /> : <Share2 size={12} />}
                      {planShared ? (planUrl ? "Lien copié !" : "Partagé !") : "Partager ce plan"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Input bas de page — visible en mode chat ou si on clique "autre situation" */}
      <AnimatePresence>
        {(chatOpen || messages.length > 0) && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="px-4 pb-4 pt-2 border-t border-slate-800/70 bg-[#020617]/95 backdrop-blur-sm"
          >
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Préciser votre situation..."
                rows={1}
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
