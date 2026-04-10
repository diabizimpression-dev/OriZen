"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Utensils, HeartPulse, AlertTriangle, FileText,
  ArrowLeft, Send, Phone, MapPin, Mic, MicOff, Loader2, Share2, CheckCircle2
} from "lucide-react";
import { Analytics } from "@/components/Analytics";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface QuickSituation {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  prompt: string;
}

const QUICK_SITUATIONS: QuickSituation[] = [
  {
    id: "logement",
    label: "Je n'ai pas où dormir",
    sublabel: "Hébergement d'urgence",
    icon: Home,
    color: "#6366F1",
    prompt: "Je n'ai pas où dormir ce soir, j'ai besoin d'un hébergement d'urgence",
  },
  {
    id: "manger",
    label: "Je n'ai pas à manger",
    sublabel: "Aide alimentaire",
    icon: Utensils,
    color: "#10B981",
    prompt: "Je n'ai pas à manger, je cherche une aide alimentaire d'urgence",
  },
  {
    id: "sante",
    label: "J'ai besoin de soins",
    sublabel: "Accès aux soins gratuits",
    icon: HeartPulse,
    color: "#F59E0B",
    prompt: "J'ai besoin de soins médicaux gratuits sans carte vitale",
  },
  {
    id: "admin",
    label: "Problème administratif",
    sublabel: "Documents, droits, démarches",
    icon: FileText,
    color: "#8B5CF6",
    prompt: "J'ai un problème administratif urgent, je ne sais pas quoi faire",
  },
  {
    id: "danger",
    label: "Je suis en danger",
    sublabel: "Aide immédiate",
    icon: AlertTriangle,
    color: "#EF4444",
    prompt: "Je suis en situation de danger, j'ai besoin d'aide immédiatement",
  },
];

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

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
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
    <div className="flex flex-col h-screen bg-[#030712] text-white overflow-hidden">
      <Analytics page="/assistant" action={activeSituation ? "situation-selected" : undefined} scenario={activeSituation ?? undefined} />

      {/* Radial gradient glow — fixed background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 60%)",
        }}
      />

      {/* Header sticky */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-white/[0.06]"
        style={{ background: "rgba(3,7,18,0.95)", backdropFilter: "blur(16px)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs leading-none">O</span>
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">OriZen</span>
          {location && (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 ml-1">
              <MapPin size={9} /> Localisé
            </span>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) window.speechSynthesis?.cancel();
            }}
            className={`p-2 rounded-lg transition-colors text-xs ${voiceEnabled ? "bg-indigo-600/25 text-indigo-400" : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]"}`}
            title={voiceEnabled ? "Désactiver le vocal" : "Activer le vocal"}
          >
            {voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </header>

      {/* Zone principale */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-5 flex flex-col">
        <AnimatePresence mode="wait">
          {/* ÉTAT INITIAL : boutons de situation */}
          {!chatOpen && messages.length === 0 && (
            <motion.div
              key="situations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col justify-center"
            >
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-white mb-1.5">Décris ta situation</h2>
                <p className="text-slate-500 text-sm">Sélectionne ou écris librement pour obtenir une aide immédiate.</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {QUICK_SITUATIONS.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.22 }}
                      whileTap={{ scale: 0.975 }}
                      onClick={() => handleSituationClick(s)}
                      className="flex items-center gap-4 px-4 rounded-2xl text-left transition-all"
                      style={{
                        minHeight: "68px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderLeft: `3px solid ${s.color}`,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: s.color + "22" }}
                      >
                        <Icon size={18} style={{ color: s.color }} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-white text-sm leading-snug">{s.label}</span>
                        <span className="text-slate-500 text-xs mt-0.5">{s.sublabel}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-5 text-center">
                <button
                  onClick={() => { setChatOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
                  className="text-xs text-slate-600 hover:text-slate-400 underline underline-offset-2 transition"
                >
                  Autre situation — écrire librement
                </button>
              </div>
            </motion.div>
          )}

          {/* ÉTAT CHAT */}
          {(chatOpen || messages.length > 0) && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col gap-3 pb-2">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "text-white rounded-br-md"
                          : "text-slate-100 rounded-bl-md border border-white/[0.07]"
                      }`}
                      style={
                        msg.role === "user"
                          ? { background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }
                          : { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }
                      }
                    >
                      {msg.role === "assistant"
                        ? formatMessageContent(msg.content)
                        : msg.content}
                    </div>
                  </motion.div>
                ))}

                {/* Indicateur chargement */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 border border-white/[0.07]"
                      style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}
                    >
                      <Loader2 size={13} className="text-indigo-400 animate-spin" />
                      <span className="text-xs text-slate-400">Recherche en cours…</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Boutons d'action rapide */}
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
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap shrink-0 transition-colors hover:bg-indigo-600/25"
                      style={{
                        background: "rgba(99,102,241,0.12)",
                        borderColor: "rgba(99,102,241,0.25)",
                        color: "#a5b4fc",
                      }}
                    >
                      <MapPin size={12} />
                      Voir sur la carte
                    </a>
                    <a
                      href="tel:115"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(255,255,255,0.08)",
                        color: "#94a3b8",
                      }}
                    >
                      <Phone size={12} />
                      Appeler le 115
                    </a>
                    <button
                      onClick={sharePlan}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                      style={{
                        background: "rgba(139,92,246,0.12)",
                        borderColor: "rgba(139,92,246,0.25)",
                        color: "#c4b5fd",
                      }}
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

      {/* Input bar — fixed bottom */}
      <AnimatePresence>
        {(chatOpen || messages.length > 0) && (
          <motion.div
            initial={{ y: 64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 64, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="relative z-20 px-4 pb-5 pt-3 border-t border-white/[0.06]"
            style={{ background: "rgba(3,7,18,0.92)", backdropFilter: "blur(16px)" }}
          >
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Préciser votre situation…"
                rows={1}
                className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none transition-colors border"
                style={{
                  minHeight: "44px",
                  maxHeight: "120px",
                  background: "rgba(255,255,255,0.04)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="p-3 rounded-xl shrink-0 transition-all disabled:opacity-35 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  boxShadow: input.trim() && !loading ? "0 0 16px rgba(99,102,241,0.45)" : "none",
                }}
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
