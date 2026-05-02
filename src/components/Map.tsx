"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ArrowLeft, Navigation, Phone, MapPin, FileText, AlertCircle, CheckCircle } from "lucide-react";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const BESOIN_META: Record<string, { label: string; color: string }> = {
  logement:     { label: "Hébergement d'urgence",    color: "#6366F1" },
  alimentation: { label: "Distribution alimentaire", color: "#10B981" },
  sante:        { label: "Santé & Soins gratuits",   color: "#F59E0B" },
  urgence:      { label: "Urgence",                  color: "#EF4444" },
  tous:         { label: "Toutes les structures",    color: "#8B5CF6" },
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
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

function ReliabilityBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";
  const label = score >= 80 ? "Fiable" : score >= 50 ? "À vérifier" : "Non vérifié";
  const Icon = score >= 80 ? CheckCircle : AlertCircle;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ color, background: color + "18", border: `1px solid ${color}40` }}
    >
      <Icon size={10} />
      {label} · {score}/100
    </span>
  );
}

interface MapProps {
  besoin?: string;
}

export default function Map({ besoin = "tous" }: MapProps) {
  const [center, setCenter] = useState<[number, number]>([48.8566, 2.3522]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"osm" | "fallback" | null>(null);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const meta = BESOIN_META[besoin] ?? BESOIN_META["tous"];

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setCenter(coords);
          fetchStructures(coords[0], coords[1]);
        },
        () => fetchStructures(48.8566, 2.3522),
        { timeout: 8000 }
      );
    } else {
      fetchStructures(48.8566, 2.3522);
    }
  }, [besoin]);

  const fetchStructures = (lat: number, lng: number) => {
    setLoading(true);
    fetch(`/api/structures?lat=${lat}&lng=${lng}&type=${besoin}&radius=5000`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStructures(data.structures);
          setDataSource(data.source);
        }
      })
      .catch((err) => console.error("Failed to fetch structures:", err))
      .finally(() => setLoading(false));
  };

  const handleReport = (id: string) => {
    setReportedIds((prev) => new Set(prev).add(id));
    // Futur : POST /api/structures/report avec l'id
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapUpdater center={center} />

        {structures.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]}>
            <Popup maxWidth={260} className="orizen-popup">
              <div className="text-slate-900 p-1" style={{ minWidth: "220px" }}>
                {/* Nom + type */}
                <h3 className="font-bold text-sm leading-tight mb-1">{s.name}</h3>
                <p className="text-xs text-slate-500 mb-2 capitalize">{s.type}</p>

                {/* Score fiabilité */}
                {s.reliability_score !== undefined && (
                  <div className="mb-2">
                    <ReliabilityBadge score={s.reliability_score} />
                    {s.verified_at && (
                      <span className="text-xs text-slate-400 ml-2">
                        Vérifié le {s.verified_at}
                      </span>
                    )}
                  </div>
                )}

                {/* Adresse */}
                {s.addr && (
                  <p className="text-xs text-slate-600 mb-1 flex items-start gap-1">
                    <MapPin size={10} className="shrink-0 mt-0.5 text-slate-400" />
                    {s.addr}
                    {s.distance_m !== undefined && (
                      <span className="text-slate-400 ml-1 font-medium">
                        · {s.distance_m < 1000
                          ? `${s.distance_m}m`
                          : `${(s.distance_m / 1000).toFixed(1)}km`}
                      </span>
                    )}
                  </p>
                )}

                {/* Horaires */}
                {s.open && (
                  <p className="text-xs text-green-700 font-medium mb-2">{s.open}</p>
                )}

                {/* Documents à apporter */}
                {s.documents && s.documents.length > 0 && (
                  <div className="mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1">
                      <FileText size={10} />
                      À apporter :
                    </p>
                    {s.documents.map((doc) => (
                      <p key={doc} className="text-xs text-amber-700">· {doc}</p>
                    ))}
                  </div>
                )}

                {/* Script d'action */}
                {s.action_script && (
                  <div className="mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-xs text-indigo-800 italic">"{s.action_script}"</p>
                  </div>
                )}

                {/* Boutons d'action */}
                <div className="flex flex-col gap-1.5">
                  {s.phone && (
                    <a
                      href={`tel:${s.phone.replace(/\s/g, "")}`}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      <Phone size={12} />
                      Appeler · {s.phone}
                    </a>
                  )}
                  <a
                    href={`https://maps.google.com/?daddr=${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    <Navigation size={12} />
                    Itinéraire
                  </a>
                  {!reportedIds.has(s.id) ? (
                    <button
                      onClick={() => handleReport(s.id)}
                      className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-slate-400 text-xs hover:text-slate-600 transition-colors"
                    >
                      <AlertCircle size={10} />
                      Signaler une erreur
                    </button>
                  ) : (
                    <p className="text-center text-xs text-green-600 py-1">Signalement reçu, merci</p>
                  )}
                </div>

                {/* Source indicator */}
                {s.source === "fallback" && (
                  <p className="text-xs text-slate-400 text-center mt-2">
                    Donnée de référence nationale
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Header overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-3">
        <button
          onClick={() => (window.location.href = "/")}
          className="p-2.5 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div
          className="flex-1 px-4 py-2.5 rounded-xl backdrop-blur border text-sm font-semibold"
          style={{
            background: "rgba(2,6,23,0.85)",
            borderColor: meta.color + "40",
            color: meta.color,
          }}
        >
          {meta.label}
          {dataSource === "osm" && (
            <span className="ml-2 text-xs opacity-60 font-normal">· OpenStreetMap</span>
          )}
        </div>
        {loading && (
          <div className="p-2.5 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Badge compteur */}
      {!loading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="px-4 py-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full text-sm text-slate-300 flex items-center gap-2">
            <Navigation size={14} className="text-indigo-400" />
            {structures.length} structure{structures.length > 1 ? "s" : ""} trouvée{structures.length > 1 ? "s" : ""}
            {dataSource === "fallback" && <span className="text-amber-400 text-xs">· réseau national</span>}
          </div>
        </div>
      )}
    </div>
  );
}
