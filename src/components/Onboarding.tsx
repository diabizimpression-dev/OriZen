"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Zap, Scale, ArrowRight, EyeOff } from "lucide-react";
import gsap from "gsap";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("orizen_onboarding_seen");
    if (!hasSeenOnboarding) {
      setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      title: "VOTRE SÉCURITÉ D'ABORD",
      desc: "OriZen est conçu pour être invisible. Vos données sont chiffrées localement et ne quittent jamais votre appareil.",
      icon: EyeOff,
      color: "text-cyber-pink",
      bg: "bg-cyber-pink/10",
    },
    {
      title: "ARSENAL JURIDIQUE",
      desc: "Accédez instantanément à vos droits et aux articles de loi pour vous défendre face aux institutions.",
      icon: Scale,
      color: "text-cyber-blue",
      bg: "bg-cyber-blue/10",
    },
    {
      title: "MODE PANIQUE",
      desc: "En cas de danger, tapotez 3 fois l'écran pour masquer l'application derrière un site météo anodin.",
      icon: Zap,
      color: "text-cyber-green",
      bg: "bg-cyber-green/10",
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-8"
        >
          <motion.div 
            key={step}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.1, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 20 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className={`w-24 h-24 ${steps[step].bg} rounded-4xl flex items-center justify-center mb-10 border-2 border-white/5`}>
              <steps[step].icon size={48} className={steps[step].color} />
            </div>
            
            <h2 className="text-4xl font-black font-heading leading-tight mb-4 italic tracking-tighter uppercase">
              {steps[step].title}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed mb-12">
              {steps[step].desc}
            </p>

            <button 
              onClick={handleNext}
              className="neon-button w-full flex items-center justify-center gap-3 py-5"
            >
              {step === steps.length - 1 ? "DÉMARRER ORIZEN" : "CONTINUER"}
              <ArrowRight size={20} />
            </button>

            <div className="flex gap-2 mt-10">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-cyber-blue' : 'w-2 bg-white/10'}`} 
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
