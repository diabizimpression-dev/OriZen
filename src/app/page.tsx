"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const ACTIONS = [
  { id: "logement", label: "Dormir", sub: "Hébergement d'urgence", tag: "24h/24", color: "#6366F1", rgb: "99,102,241", href: "/carte?besoin=logement", icon: "🏠" },
  { id: "manger",   label: "Manger", sub: "Distribution alimentaire", tag: "Gratuit", color: "#10B981", rgb: "16,185,129", href: "/carte?besoin=alimentation", icon: "🍽️" },
  { id: "soin",     label: "Se soigner", sub: "Soins gratuits PASS", tag: "Sans papiers", color: "#F59E0B", rgb: "245,158,11", href: "/carte?besoin=sante", icon: "💊" },
  { id: "parler",   label: "Parler", sub: "Aide & conseils", tag: "IA + annuaire", color: "#8B5CF6", rgb: "139,92,246", href: "/assistant", icon: "💬" },
] as const;

const SOS = [
  { label: "SAMU Social", n: "115", desc: "Hébergement urgent", c: "#EF4444" },
  { label: "Police", n: "17", desc: "Danger, agression", c: "#F97316" },
  { label: "Violences", n: "3919", desc: "Violences conjugales", c: "#EC4899" },
  { label: "SAMU", n: "15", desc: "Urgence médicale", c: "#EF4444" },
];

export default function Home() {
  const [sos, setSos] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => { setLast(localStorage.getItem("orizen_last")); }, []);

  const go = (id: string, href: string) => {
    setActive(id);
    localStorage.setItem("orizen_last", id);
    setTimeout(() => { window.location.href = href; }, 180);
  };

  const lastAction = ACTIONS.find(a => a.id === last);

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#fff", fontFamily: "system-ui, sans-serif", position: "relative", overflowX: "hidden" }}>

      {/* Orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -80, left: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 20px 8px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 12, background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>OZ</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>OriZen</span>
        </div>
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setSos(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, background: "#DC2626", border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 20px rgba(220,38,38,0.4)" }}>
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.3, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
          SOS
        </motion.button>
      </motion.div>

      {/* SOS Modal */}
      <AnimatePresence>
        {sos && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSos(false)}
            style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#0a0f1e", borderTop: "1px solid #1e293b", borderRadius: "24px 24px 0 0", padding: "20px 20px 40px" }}>
              <div style={{ width: 40, height: 4, background: "#334155", borderRadius: 4, margin: "0 auto 20px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>Numéros d&apos;urgence</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Gratuits · 24h/24 · 7j/7</div>
                </div>
                <button onClick={() => setSos(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: "#1e293b", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
              {SOS.map((s, i) => (
                <motion.a key={s.n} href={`tel:${s.n}`}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: 16, border: `1px solid ${s.c}30`, background: `${s.c}10`, marginBottom: 10, textDecoration: "none" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.desc}</div>
                  </div>
                  <div style={{ color: s.c, fontWeight: 900, fontSize: 20 }}>📞 {s.n}</div>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ position: "relative", zIndex: 10, maxWidth: 480, margin: "0 auto", padding: "28px 20px 24px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)", color: "#a5b4fc", fontSize: 11, fontWeight: 600, marginBottom: 16 }}>
          ⚡ Aide immédiate · anonyme · gratuite
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.08, margin: 0 }}>
          <span style={{ color: "#fff" }}>De quoi</span><br />
          <span style={{ background: "linear-gradient(135deg, #a5b4fc, #c4b5fd, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>avez-vous besoin</span><br />
          <span style={{ color: "#64748b", fontSize: 30, fontWeight: 700 }}>maintenant ?</span>
        </h1>
        <p style={{ color: "#475569", fontSize: 13, marginTop: 12, lineHeight: 1.6 }}>Sélectionnez une catégorie pour trouver les structures proches.</p>
      </motion.div>

      {/* Bento 2×2 */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 480, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {ACTIONS.map((a, i) => {
          const isActive = active === a.id;
          return (
            <motion.div key={a.id}
              initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => go(a.id, a.href)}
              style={{ position: "relative", height: 168, borderRadius: 20, overflow: "hidden", cursor: "pointer", border: `1px solid rgba(${a.rgb},${isActive ? 0.7 : 0.22})`, background: `rgba(${a.rgb},0.07)`, boxShadow: isActive ? `0 0 28px rgba(${a.rgb},0.35)` : "none" }}>
              {/* Glow orb */}
              <div style={{ position: "absolute", top: -24, right: -24, width: 112, height: 112, borderRadius: "50%", background: `radial-gradient(circle, rgba(${a.rgb},0.3) 0%, transparent 70%)` }} />
              {/* Top shine */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(${a.rgb},0.5), transparent)` }} />
              {/* Content */}
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%", padding: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `rgba(${a.rgb},0.15)`, boxShadow: `0 4px 16px rgba(${a.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {a.icon}
                </div>
                <div style={{ marginTop: "auto" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: a.color, background: `rgba(${a.rgb},0.12)`, padding: "2px 8px", borderRadius: 999, display: "inline-block", marginBottom: 6 }}>{a.tag}</span>
                  <div style={{ fontWeight: 900, fontSize: 20, color: a.color, lineHeight: 1.1 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{a.sub}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Last visit */}
      <AnimatePresence>
        {lastAction && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: "relative", zIndex: 10, maxWidth: 480, margin: "12px auto 0", padding: "0 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `rgba(${lastAction.rgb},0.12)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{lastAction.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 500 }}>Dernière aide consultée</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>{lastAction.label}</div>
              </div>
              <button onClick={() => go(lastAction.id, lastAction.href)}
                style={{ fontSize: 11, fontWeight: 700, color: lastAction.color, background: `rgba(${lastAction.rgb},0.1)`, border: "none", padding: "5px 10px", borderRadius: 8, cursor: "pointer" }}>
                Reprendre →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{ position: "relative", zIndex: 10, display: "flex", justifyContent: "center", gap: 16, padding: "24px 0", fontSize: 11 }}>
        <Link href="/droits" style={{ color: "#475569", textDecoration: "underline" }}>Vos droits</Link>
        <span style={{ color: "#1e293b" }}>·</span>
        <Link href="/assistant" style={{ color: "#475569", textDecoration: "underline" }}>Assistant IA</Link>
        <span style={{ color: "#1e293b" }}>·</span>
        <Link href="/carte" style={{ color: "#475569", textDecoration: "underline" }}>Carte</Link>
      </motion.div>

    </div>
  );
}
