"use client";

import { Lock, ArrowLeft, ShieldCheck, EyeOff, Key, Zap, ShieldAlert, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function VaultPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".vault-card", {
      scale: 0.9,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "elastic.out(1, 0.75)"
    });
  }, { scope: containerRef });

  return (
    <div className="min-h-screen bg-background text-white selection:bg-cyber-pink overflow-x-hidden" ref={containerRef}>
      
      {/* CYBER HEADER */}
      <header className="px-6 py-6 flex justify-between items-center glass-morph sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-3 bg-white/5 rounded-2xl hover:bg-cyber-pink/20 transition-all border border-white/10 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="font-heading font-black text-xl tracking-tighter italic">CYBER-VAULT</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyber-pink">Sécurité Grade Militaire</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-cyber-pink/20 border border-cyber-pink/40 flex items-center justify-center animate-pulse">
          <ShieldAlert size={20} className="text-cyber-pink" />
        </div>
      </header>

      <main className="px-6 py-10 max-w-4xl mx-auto">
        
        {/* HERO STATUS */}
        <section className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-green/10 border border-cyber-green/30 text-cyber-green text-[10px] font-black uppercase tracking-widest mb-6">
            <Cpu size={12} className="animate-spin-slow" /> Système de Chiffrement Actif
          </div>
          <h2 className="text-5xl font-black font-heading leading-none mb-4">
            VOS DROITS SONT <br/>
            <span className="cyber-gradient-text italic text-6xl">INVIOLABLES.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
            Stockez vos pièces d'identité et documents administratifs sans laisser de trace sur le cloud.
          </p>
        </section>

        {/* MAIN ACCESS CARD */}
        <div className="vault-card cyber-card bg-gradient-to-br from-surface to-background border-2 border-surface-border p-10 mb-10 relative group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
            <Lock size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-cyber-blue/10 rounded-3xl flex items-center justify-center mb-8 border-2 border-cyber-blue shadow-cyber-blue">
              <Key size={40} className="text-cyber-blue animate-bounce" />
            </div>
            <h3 className="text-2xl font-black font-heading mb-3">ACCÈS AU COFFRE</h3>
            <p className="text-slate-400 text-sm mb-8 max-w-xs">
              Entrez votre clé de déchiffrement unique pour visualiser vos fichiers.
            </p>
            
            <div className="w-full max-w-sm flex flex-col gap-4">
              <button className="neon-button w-full py-5 text-lg flex items-center justify-center gap-3">
                <ShieldCheck /> DÉVERROUILLER LE VAULT
              </button>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic">
                * Clé perdue = Accès impossible. Nous ne stockons rien.
              </p>
            </div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="vault-card cyber-card border-cyber-green/30 group hover:border-cyber-green">
            <ShieldCheck className="text-cyber-green mb-4 group-hover:scale-110 transition-transform" size={32} />
            <h4 className="font-heading font-black text-lg mb-2">ZÉRO-CLOUD</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Vos documents sont chiffrés en **AES-256** et stockés uniquement dans la mémoire sécurisée de votre navigateur. Rien ne quitte votre appareil.
            </p>
          </div>
          <div className="vault-card cyber-card border-cyber-pink/30 group hover:border-cyber-pink">
            <EyeOff className="text-cyber-pink mb-4 group-hover:scale-110 transition-transform" size={32} />
            <h4 className="font-heading font-black text-lg mb-2">MODE INVISIBLE</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              En un clic, transformez l'interface en un site météo ou d'actualités banal pour protéger votre vie privée en public.
            </p>
          </div>
        </div>

        {/* SECURITY PROMISE */}
        <div className="vault-card p-8 bg-surface-lighter rounded-4xl border border-white/5 relative overflow-hidden">
          <Zap size={60} className="absolute -bottom-4 -right-4 text-white/5" />
          <p className="text-sm font-bold text-slate-300 italic leading-loose text-center">
            "OriZen a été conçu pour les situations de crise. Notre coffre-fort garantit que même en cas de perte de téléphone physique, vos droits restent accessibles via votre clé de secours mémorisée."
          </p>
        </div>

      </main>

      {/* STYLES ADDITIONNELS POUR L'ANIMATION */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
