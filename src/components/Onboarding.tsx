"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Zap, Scale, ArrowRight, EyeOff } from "lucide-react";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("orizen_onboarding_seen");
      if (!hasSeen) setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      title: "VOTRE SÉCURITÉ D'ABORD",
      desc: "OriZen est conçu pour être invisible. Vos données sont chiffrées localement.",
      icon: EyeOff,
      color: "text-[#FF007A]",
      bg: "bg-[#FF007A10]",
    },
    {
      title: "ARSENAL JURIDIQUE",
      desc: "Accédez instantanément à vos droits et aux articles de loi.",
      icon: Scale,
      color: "text-[#00E5FF]",
      bg: "bg-[#00E5FF10]",
    },
    {
      title: "MODE PANIQUE",
      desc: "Tapotez 3 fois l'écran pour masquer l'application.",
      icon: Zap,
      color: "text-[#00FF94]",
      bg: "bg-[#00FF9410]",
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem("orizen_onboarding_seen", "true");
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050B1F] flex flex-col items-center justify-center p-8">
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          className="flex flex-col items-center text-center max-w-sm"
        >
          <div className={`w-24 h-24 ${steps[step].bg} rounded-3xl flex items-center justify-center mb-10 border border-white/10`}>
            {step === 0 && <EyeOff size={48} className={steps[step].color} />}
            {step === 1 && <Scale size={48} className={steps[step].color} />}
            {step === 2 && <Zap size={48} className={steps[step].color} />}
          </div>
          
          <h2 className="text-4xl font-bold mb-4 uppercase text-white">
            {steps[step].title}
          </h2>
          <p className="text-slate-400 text-lg mb-12">
            {steps[step].desc}
          </p>

          <button 
            onClick={handleNext}
            className="w-full py-5 bg-[#FF007A] text-white font-bold rounded-2xl"
          >
            {step === 2 ? "DÉMARRER" : "CONTINUER"}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
