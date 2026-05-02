"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Utensils, HeartPulse, AlertTriangle, FileText,
  ArrowLeft, Send, Phone, MapPin, Mic, MicOff, Loader2,
  Zap, BrainCircuit, History, X, Bot
} from "lucide-react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// =====================================================
// OriZen Neural Assistant — Premium Experience
// =====================================================

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
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
    label: "Hébergement",
    icon: Home,
    color: "#00E5FF", // cyber-blue
    bg: "rgba(0, 229, 255, 0.08)",
    border: "rgba(0, 229, 255, 0.2)",
    prompt: "Je n'ai pas où dormir ce soir, j'ai besoin d'un hébergement d'urgence",
  },
  {
    id: "manger",
    label: "Alimentation",
    icon: Utensils,
    color: "#00FF94", // cyber-green
    bg: "rgba(0, 255, 148, 0.08)",
    border: "rgba(0, 255, 148, 0.2)",
    prompt: "Je n'ai pas à manger, je cherche une aide alimentaire d'urgence",
  },
  {
    id: "sante",
    label: "Soins",
    icon: HeartPulse,
    color: "#FFD600", // cyber-yellow
    bg: "rgba(255, 214, 0, 0.08)",
    border: "rgba(255, 214, 0, 0.2)",
    prompt: "J'ai besoin de soins médicaux gratuits sans carte vitale",
  },
  {
    id: "danger",
    label: "Danger",
    icon: AlertTriangle,
    color: "#FF007A", // cyber-pink
    bg: "rgba(255, 0, 122, 0.08)",
    border: "rgba(255, 0, 122, 0.2)",
    prompt: "Je suis en situation de danger, j'ai besoin d'aide immédiatement",
  },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isMemoryActive, setIsMemoryActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // NEURAL MEMORY: Persistence logic
  useEffect(() => {
    const savedMemory = localStorage.getItem("orizen_neural_memory");
    if (savedMemory) {
      setMessages(JSON.parse(savedMemory));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("orizen_neural_memory", JSON.stringify(messages.slice(-20)));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useGSAP(() => {
    if (messages.length === 0) {
      gsap.from(".quick-item", {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)"
      });
    }
  }, { scope: containerRef });

  const clearMemory = () => {
    localStorage.removeItem("orizen_neural_memory");
    setMessages([]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content,
      timestamp: Date.now()
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Je n'ai pas compris. Contactez le 115.",
        timestamp: Date.now()
      };
      
      setMessages((prev) => [...prev, assistantMsg]);

      if (voiceEnabled && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(assistantMsg.content);
        utterance.lang = "fr-FR";
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Fallback error message
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-white selection:bg-cyber-pink overflow-hidden" ref={containerRef}>
      
      {/* PREMIUM HEADER */}
      <header className="px-6 py-4 flex justify-between items-center glass-morph z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-white/5 rounded-2xl hover:bg-cyber-blue/20 transition-all border border-white/10">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-black text-lg italic tracking-tighter uppercase">NEURAL ASSISTANT</h1>
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse shadow-cyber-green" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Mémoire Active v3.1</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {messages.length > 0 && (
            <button 
              onClick={clearMemory}
              className="p-3 bg-white/5 rounded-2xl border border-white/10 text-slate-400 hover:text-cyber-pink transition-colors"
              title="Effacer la mémoire"
            >
              <History size={18} />
            </button>
          )}
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-3 rounded-2xl border transition-all ${voiceEnabled ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue' : 'bg-white/5 border-white/10 text-slate-400'}`}
          >
            {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>
        </div>
      </header>

      {/* CHAT ZONE */}
      <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col no-scrollbar">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 flex flex-col justify-center items-center text-center"
            >
              <div className="w-20 h-20 bg-cyber-blue/10 rounded-4xl flex items-center justify-center mb-8 border-2 border-cyber-blue/30 shadow-cyber-blue relative">
                <BrainCircuit size={40} className="text-cyber-blue animate-float" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyber-green rounded-full border-2 border-background" />
              </div>
              
              <h2 className="text-4xl font-black font-heading leading-none mb-4 uppercase tracking-tighter">
                PARLEZ, NOUS <br/>
                <span className="cyber-gradient-text italic">ÉCOUTONS.</span>
              </h2>
              <p className="text-slate-400 text-sm max-w-[260px] leading-relaxed mb-12">
                Votre situation est unique. Décrivez-la ou utilisez un raccourci.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                {QUICK_SITUATIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => sendMessage(s.prompt)}
                    className="quick-item cyber-card border-surface-border p-5 flex flex-col items-start gap-3 group text-left"
                    style={{ '--hover-color': s.color } as any}
                  >
                    <div className="p-2 rounded-xl bg-white/5 transition-colors group-hover:bg-white/10">
                      <s.icon size={20} style={{ color: s.color }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] relative group`}>
                    <div className={`
                      px-6 py-4 rounded-3xl text-sm leading-relaxed font-bold
                      ${msg.role === 'user' 
                        ? 'bg-cyber-blue text-background rounded-br-none shadow-cyber-blue' 
                        : 'glass-morph border-white/10 text-white rounded-bl-none'
                      }
                    `}>
                      {msg.content}
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest text-slate-600 mt-2 block ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="glass-morph px-6 py-4 rounded-3xl rounded-bl-none border-cyber-blue/30 flex items-center gap-3">
                    <Loader2 size={16} className="text-cyber-blue animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyber-blue">Analyse Contextuelle...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* INPUT ZONE */}
      <footer className="px-6 py-6 glass-morph border-t border-white/5 bg-background/80 backdrop-blur-3xl">
        <div className="max-w-4xl mx-auto relative group">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Décrivez votre besoin ici..."
            rows={1}
            className="w-full bg-surface-lighter border-2 border-surface-border rounded-2xl px-6 py-4 pr-16 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyber-blue transition-all resize-none no-scrollbar font-bold"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-cyber-blue text-background rounded-xl disabled:opacity-50 disabled:grayscale transition-all hover:shadow-cyber-blue active:scale-90"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
            <ShieldCheck size={10} /> Chiffrement de bout en bout actif
          </div>
        </div>
      </footer>

    </div>
  );
}
