"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Cloud, Wind, Sun } from "lucide-react";

const DiscreetContext = createContext({
  isDiscreet: false,
  toggleDiscreet: () => {},
});

export const useDiscreet = () => useContext(DiscreetContext);

export function DiscreetProvider({ children }: { children: React.ReactNode }) {
  const [isDiscreet, setIsDiscreet] = useState(false);

  // Toggle avec un geste "Panic" (Triple Tap n'importe où)
  useEffect(() => {
    let lastTap = 0;
    let tapCount = 0;

    const handleTap = () => {
      const now = Date.now();
      if (now - lastTap < 400) {
        tapCount++;
      } else {
        tapCount = 1;
      }
      lastTap = now;

      if (tapCount === 3) {
        setIsDiscreet(prev => !prev);
        tapCount = 0;
      }
    };

    window.addEventListener("touchstart", handleTap);
    return () => window.removeEventListener("touchstart", handleTap);
  }, []);

  const toggleDiscreet = () => setIsDiscreet(!isDiscreet);

  if (isDiscreet) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 p-8 font-sans animate-in fade-in duration-500">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <Cloud className="text-blue-500" />
            <span className="font-bold text-xl">Météo France</span>
          </div>
          <button onClick={toggleDiscreet} className="opacity-0 w-10 h-10">Exit</button>
        </header>
        
        <main className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-sm mb-6">
            <p className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-2">Aujourd'hui · Paris</p>
            <div className="flex items-center justify-between">
              <span className="text-6xl font-light">18°C</span>
              <Sun className="text-yellow-500 w-16 h-16" />
            </div>
            <p className="mt-4 text-slate-600">Ciel dégagé toute la journée. Vent faible de Nord-Est.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm">
                <p className="text-xs text-slate-400 mb-2">Lun {i+10}</p>
                <Cloud className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm">14°</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-6 border-t border-slate-200">
            <h4 className="font-bold text-sm mb-4">Actualités Locales</h4>
            <div className="space-y-4">
              <div className="h-4 bg-slate-200 rounded-full w-3/4" />
              <div className="h-4 bg-slate-200 rounded-full w-full" />
              <div className="h-4 bg-slate-200 rounded-full w-1/2" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <DiscreetContext.Provider value={{ isDiscreet, toggleDiscreet }}>
      {children}
    </DiscreetContext.Provider>
  );
}
