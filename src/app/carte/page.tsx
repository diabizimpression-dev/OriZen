"use client";

import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

const Map = dynamic(() => import("../../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-background animate-pulse flex flex-col items-center justify-center text-slate-500 gap-4">
      <div className="w-12 h-12 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin" />
      <span className="font-heading font-bold tracking-widest uppercase text-xs">Initialisation des systèmes de géo-repérage...</span>
    </div>
  ),
});

function CarteContent() {
  const params = useSearchParams();
  const besoin = params.get("besoin") ?? "tous";
  
  return (
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col relative">
      
      {/* UI OVERLAY: TOP BAR */}
      <header className="absolute top-0 left-0 right-0 z-[2000] p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-3 pointer-events-auto"
          >
            <Link 
              href="/" 
              className="p-3 bg-background/80 backdrop-blur-xl border border-surface-border rounded-2xl hover:border-cyber-blue transition-all group"
            >
              <ArrowLeft size={20} className="text-white group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="glass-morph px-5 py-3 rounded-2xl border-l-4 border-l-cyber-blue">
              <h1 className="font-heading font-black text-xs uppercase tracking-[0.2em] text-cyber-blue mb-0.5">Exploration</h1>
              <p className="font-heading font-bold text-white text-sm uppercase">Carte Interactive</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col gap-2 pointer-events-auto items-end"
          >
            <button className="glass-morph p-3 rounded-2xl border border-surface-border hover:border-cyber-pink transition-all">
              <Search size={20} className="text-white" />
            </button>
            <button className="glass-morph p-3 rounded-2xl border border-surface-border hover:border-cyber-green transition-all">
              <Filter size={20} className="text-white" />
            </button>
          </motion.div>
        </div>
      </header>

      {/* THE MAP (FULLSCREEN) */}
      <main className="flex-1 w-full h-full grayscale-[0.2] contrast-[1.1]">
        <Map besoin={besoin} />
      </main>

      {/* UI OVERLAY: BOTTOM NAV / FILTERS (Dynamic based on SCENARIOS) */}
      <nav className="absolute bottom-6 left-0 right-0 z-[2000] px-4 pointer-events-none">
         {/* We'll implement one-click filters inside the Map component or here */}
      </nav>

    </div>
  );
}

export default function CartePage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyber-pink border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CarteContent />
    </Suspense>
  );
}
