"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  ArrowLeft, Navigation, Phone, MapPin, 
  FileText, AlertCircle, CheckCircle, Zap,
  Compass, Info, MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SCENARIOS } from "../lib/scenarios";

// Custom Neon Marker Creator
const createNeonIcon = (color: string) => {
  return L.divIcon({
    className: "custom-neon-marker",
    html: `
      <div style="
        width: 14px; 
        height: 14px; 
        background-color: ${color}; 
        border: 2px solid white; 
        border-radius: 50%; 
        box-shadow: 0 0 15px ${color}, 0 0 5px white;
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

interface Structure {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  addr: string;
  phone: string;
  open: string;
  verified_at?: string;
  reliability_score?: number;
  distance_m?: number;
  action_script?: string;
  documents?: string[];
  source?: "osm" | "fallback";
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.5 });
  }, [center, map]);
  return null;
}

interface MapProps {
  besoin?: string;
}

export default function Map({ besoin: initialBesoin = "tous" }: MapProps) {
  const [currentBesoin, setCurrentBesoin] = useState(initialBesoin);
  const [center, setCenter] = useState<[number, number]>([48.8566, 2.3522]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);

  // One-click filters list from SCENARIOS
  const filters = useMemo(() => {
    return [
      { id: "tous", label: "Tous", color: "#F8FAFC", icon: Compass },
      ...Object.values(SCENARIOS).map(s => ({
        id: s.id,
        label: s.label,
        color: s.color,
        icon: s.id === "logement" ? Home : s.id === "alimentation" ? Utensils : Zap
      }))
    ];
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCenter(coords);
          fetchStructures(coords[0], coords[1], currentBesoin);
        },
        () => fetchStructures(48.8566, 2.3522, currentBesoin),
        { timeout: 5000 }
      );
    } else {
      fetchStructures(48.8566, 2.3522, currentBesoin);
    }
  }, [currentBesoin]);

  const fetchStructures = (lat: number, lng: number, type: string) => {
    setLoading(true);
    fetch(`/api/structures?lat=${lat}&lng=${lng}&type=${type}&radius=5000`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStructures(data.structures);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const activeMeta = SCENARIOS[currentBesoin] || { color: "#BC00FF", label: "Découverte" };

  return (
    <div className="h-full w-full relative group/map">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />
        <MapUpdater center={center} />

        {structures.map((s) => (
          <Marker 
            key={s.id} 
            position={[s.lat, s.lng]} 
            icon={createNeonIcon(SCENARIOS[s.type]?.color || "#BC00FF")}
            eventHandlers={{
              click: () => setSelectedStructure(s)
            }}
          />
        ))}
      </MapContainer>

      {/* ONE-CLICK FILTERS (BOTTOM BAR) */}
      <div className="absolute bottom-10 left-0 right-0 z-[1000] px-6 pointer-events-none">
        <div className="max-w-4xl mx-auto overflow-x-auto no-scrollbar pointer-events-auto">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex gap-3 pb-2"
          >
            {filters.slice(0, 6).map((f) => (
              <button
                key={f.id}
                onClick={() => setCurrentBesoin(f.id)}
                className={`
                  whitespace-nowrap px-6 py-3 rounded-2xl font-heading font-bold text-xs uppercase tracking-widest
                  transition-all duration-300 border-2
                  ${currentBesoin === f.id 
                    ? "bg-white text-background border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" 
                    : "glass-morph text-white border-white/10 hover:border-white/30"
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* STRUCTURE PANEL (REPLACING POPUP FOR PREMIUM FEEL) */}
      <AnimatePresence>
        {selectedStructure && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[400px] z-[2001] bg-surface/95 backdrop-blur-2xl border-l border-surface-border p-8 flex flex-col shadow-2xl"
          >
            <button 
              onClick={() => setSelectedStructure(null)}
              className="absolute top-6 left-6 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>

            <div className="mt-12 flex-1 overflow-y-auto no-scrollbar">
              <div 
                className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${SCENARIOS[selectedStructure.type]?.color || "#BC00FF"}20`, border: `2px solid ${SCENARIOS[selectedStructure.type]?.color || "#BC00FF"}` }}
              >
                <Zap size={32} style={{ color: SCENARIOS[selectedStructure.type]?.color || "#BC00FF" }} />
              </div>

              <h2 className="text-3xl font-black font-heading text-white leading-tight mb-2">
                {selectedStructure.name}
              </h2>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: SCENARIOS[selectedStructure.type]?.color || "#BC00FF" }}>
                  {selectedStructure.type}
                </span>
                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {selectedStructure.distance_m ? `${(selectedStructure.distance_m / 1000).toFixed(1)} KM` : "Proche"}
                </span>
              </div>

              <div className="grid gap-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                  <MapPin size={20} className="text-cyber-blue mt-1 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-500 uppercase mb-1">Localisation</p>
                    <p className="text-sm font-bold text-white leading-relaxed">{selectedStructure.addr || "Adresse non spécifiée"}</p>
                  </div>
                </div>

                {selectedStructure.open && (
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-cyber-green/10 border border-cyber-green/20">
                    <Clock size={20} className="text-cyber-green mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-cyber-green uppercase mb-1">Horaires</p>
                      <p className="text-sm font-bold text-white">{selectedStructure.open}</p>
                    </div>
                  </div>
                )}

                {selectedStructure.action_script && (
                  <div className="p-6 rounded-3xl bg-cyber-purple/10 border border-cyber-purple/20 relative overflow-hidden group">
                    <p className="text-xs font-black text-cyber-purple uppercase mb-3 flex items-center gap-2">
                      <MessageCircle size={14} /> Script d'action
                    </p>
                    <p className="text-lg font-bold text-white italic leading-relaxed relative z-10">
                      "{selectedStructure.action_script}"
                    </p>
                    <Zap size={80} className="absolute -bottom-4 -right-4 text-cyber-purple/5 group-hover:scale-110 transition-transform" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {selectedStructure.phone && (
                <a 
                  href={`tel:${selectedStructure.phone}`}
                  className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-cyber-blue text-background font-black uppercase text-xs tracking-widest hover:shadow-cyber-blue transition-all active:scale-95"
                >
                  <Phone size={18} /> Appeler
                </a>
              )}
              <a 
                href={`https://maps.google.com/?daddr=${selectedStructure.lat},${selectedStructure.lng}`}
                target="_blank"
                className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-white text-background font-black uppercase text-xs tracking-widest hover:shadow-white transition-all active:scale-95"
              >
                <Navigation size={18} /> Aller
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOADING OVERLAY */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1999] bg-background/40 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Scanner en cours...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
