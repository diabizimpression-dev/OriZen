"use client";

import { Lock, ArrowLeft, ShieldCheck, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function VaultPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <button onClick={() => window.location.href='/'} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-heading font-bold">Coffre-fort Numérique</h1>
            <p className="text-slate-400">Vos documents sensibles, stockés en toute sécurité localement.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="c21-card flex flex-col items-center justify-center py-12 text-center border-dashed">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Espace Chiffré</h2>
            <p className="text-sm text-slate-400 px-8">Accédez à vos documents via votre code secret unique.</p>
            <button className="mt-6 px-6 py-2 bg-primary rounded-full font-medium hover:bg-primary/90 transition-colors">
              Déverrouiller
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="c21-card flex items-center gap-4 py-4">
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold">Zéro-Cloud</p>
                <p className="text-xs text-slate-400">Rien ne quitte votre appareil.</p>
              </div>
            </div>
            <div className="c21-card flex items-center gap-4 py-4">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500">
                <EyeOff className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-bold">Invisible</p>
                <p className="text-xs text-slate-400">Mode discret activable à tout moment.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center p-8 bg-slate-900/40 rounded-3xl border border-slate-800">
          <p className="text-slate-400 italic text-sm">
            "Ce coffre-fort utilise un chiffrement AES-256 local. Vos données sont inaccessibles sans votre clé de déchiffrement."
          </p>
        </div>
      </div>
    </div>
  );
}
