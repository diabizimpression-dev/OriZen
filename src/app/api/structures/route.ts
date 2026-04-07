import { NextResponse } from "next/server";

// =====================================================
// OVERPASS API — Structures sociales réelles (OSM)
// =====================================================

interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
}

interface Structure {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  addr: string;
  phone: string;
  open: string;
  verified_at: string;
  reliability_score: number;
  distance_m: number;
  action_script: string;
  documents: string[];
  source: "osm" | "fallback";
}

// Tags Overpass par type de besoin
const TYPE_TAGS: Record<string, string[]> = {
  logement: [
    'node["social_facility"="shelter"]',
    'node["amenity"="shelter"]',
    'way["social_facility"="shelter"]',
  ],
  alimentation: [
    'node["social_facility"="food_bank"]',
    'node["amenity"="food_bank"]',
    'node["social_facility"="soup_kitchen"]',
    'way["social_facility"="food_bank"]',
  ],
  sante: [
    'node["amenity"="hospital"]',
    'node["amenity"="clinic"]',
    'node["healthcare"="clinic"]',
    'way["amenity"="hospital"]',
  ],
  urgence: [
    'node["amenity"="hospital"]',
    'node["amenity"="police"]',
    'way["amenity"="hospital"]',
  ],
  tous: [
    'node["social_facility"]',
    'node["amenity"="hospital"]',
    'node["amenity"="shelter"]',
    'way["social_facility"]',
  ],
};

// Scripts d'action et documents par type
const TYPE_SCRIPTS: Record<string, { script: string; documents: string[] }> = {
  logement: {
    script: "Dites : « J'ai besoin d'un hébergement d'urgence pour ce soir »",
    documents: ["Pièce d'identité si disponible (pas obligatoire)"],
  },
  alimentation: {
    script: "Dites : « Je cherche une aide alimentaire d'urgence »",
    documents: ["Justificatif de domicile (optionnel)", "QF CAF si disponible"],
  },
  sante: {
    script: "Dites : « Je cherche la PASS (Permanence d'Accès aux Soins) »",
    documents: ["Pas de carte vitale obligatoire à la PASS"],
  },
  urgence: {
    script: "Appelez le 17 (police) ou 15 (SAMU) si danger immédiat",
    documents: [],
  },
  tous: {
    script: "Expliquez votre situation à l'accueil",
    documents: ["Pièce d'identité si disponible"],
  },
};

// Données de fallback (curatées, Paris + grandes villes)
const FALLBACK_STRUCTURES: Omit<Structure, "distance_m">[] = [
  {
    id: "fallback_1",
    name: "SAMU Social de Paris",
    lat: 48.8566,
    lng: 2.3522,
    type: "logement",
    addr: "Appelez le 115 — orientation vers structure proche",
    phone: "115",
    open: "24h/24 · Gratuit",
    verified_at: "2025-01-01",
    reliability_score: 99,
    action_script: "Appelez le 115 — ils vous trouvent une place ce soir",
    documents: ["Aucun document requis en urgence"],
    source: "fallback",
  },
  {
    id: "fallback_2",
    name: "Restos du Cœur — Siège national",
    lat: 48.8738,
    lng: 2.2965,
    type: "alimentation",
    addr: "Paris — Cherchez votre antenne locale sur restosducoeur.org",
    phone: "0800 130 000",
    open: "Lun.–Ven. 9h–18h · Gratuit",
    verified_at: "2025-01-01",
    reliability_score: 95,
    action_script: "Dites que vous avez besoin d'aide alimentaire d'urgence",
    documents: ["Quotient familial CAF si disponible"],
    source: "fallback",
  },
  {
    id: "fallback_3",
    name: "Croix-Rouge Française",
    lat: 48.8647,
    lng: 2.3006,
    type: "tous",
    addr: "98 rue Didot, 75014 Paris",
    phone: "0800 858 858",
    open: "Lun.–Ven. 9h–18h · Gratuit",
    verified_at: "2025-01-01",
    reliability_score: 95,
    action_script: "Expliquez votre situation, ils vous orientent vers la bonne aide",
    documents: ["Pièce d'identité si disponible"],
    source: "fallback",
  },
  {
    id: "fallback_4",
    name: "Urgences — SAMU",
    lat: 48.8566,
    lng: 2.3522,
    type: "urgence",
    addr: "Composez le 15 (SAMU) ou 17 (Police) ou 18 (Pompiers)",
    phone: "15",
    open: "24h/24 · Gratuit",
    verified_at: "2025-01-01",
    reliability_score: 100,
    action_script: "Appelez le 15 pour urgence médicale, 17 pour sécurité",
    documents: [],
    source: "fallback",
  },
];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function reliabilityScore(tags: Record<string, string>): number {
  let score = 50;
  if (tags.name) score += 15;
  if (tags.phone || tags["contact:phone"]) score += 15;
  if (tags.opening_hours) score += 10;
  if (tags["addr:street"] || tags["addr:full"]) score += 10;
  return Math.min(score, 95); // OSM max 95, fallback peut avoir 99+
}

function mapOsmType(tags: Record<string, string>): string {
  const sf = tags.social_facility || "";
  const amenity = tags.amenity || "";
  if (sf === "shelter" || amenity === "shelter") return "logement";
  if (sf === "food_bank" || sf === "soup_kitchen" || amenity === "food_bank") return "alimentation";
  if (amenity === "hospital" || amenity === "clinic" || tags.healthcare) return "sante";
  if (amenity === "police") return "urgence";
  return "tous";
}

async function fetchOverpass(lat: number, lng: number, radius: number, type: string): Promise<Structure[]> {
  const tags = TYPE_TAGS[type] ?? TYPE_TAGS["tous"];
  const tagLines = tags.join(";\n  ");

  const query = `[out:json][timeout:10];
(
  ${tagLines};
);
out body;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);

  const data = await res.json();
  const elements: OverpassElement[] = data.elements ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const scriptInfo = TYPE_SCRIPTS[type] ?? TYPE_SCRIPTS["tous"];

  return elements
    .filter((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return false;
      const dist = haversineDistance(lat, lng, elLat, elLng);
      return dist <= radius;
    })
    .map((el) => {
      const elLat = (el.lat ?? el.center?.lat)!;
      const elLng = (el.lon ?? el.center?.lon)!;
      const phone =
        el.tags.phone ||
        el.tags["contact:phone"] ||
        el.tags["phone:fr"] ||
        (mapOsmType(el.tags) === "urgence" ? "17" : "115");
      const addr =
        el.tags["addr:full"] ||
        [el.tags["addr:housenumber"], el.tags["addr:street"], el.tags["addr:city"]]
          .filter(Boolean)
          .join(" ") ||
        "Adresse non renseignée";

      return {
        id: `osm_${el.id}`,
        name: el.tags.name || "Structure d'aide",
        lat: elLat,
        lng: elLng,
        type: mapOsmType(el.tags),
        addr,
        phone,
        open: el.tags.opening_hours || "Horaires non renseignés — appelez avant",
        verified_at: today,
        reliability_score: reliabilityScore(el.tags),
        distance_m: Math.round(haversineDistance(lat, lng, elLat, elLng)),
        action_script: scriptInfo.script,
        documents: scriptInfo.documents,
        source: "osm" as const,
      };
    })
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, 20);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "48.8566");
  const lng = parseFloat(searchParams.get("lng") ?? "2.3522");
  const type = searchParams.get("type") ?? "tous";
  const radius = parseInt(searchParams.get("radius") ?? "5000");

  // Validation basique
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ ok: false, error: "Coordonnées invalides" }, { status: 400 });
  }

  try {
    const structures = await fetchOverpass(lat, lng, radius, type);

    if (structures.length > 0) {
      return NextResponse.json({ ok: true, source: "osm", count: structures.length, structures });
    }

    // Fallback si Overpass renvoie 0 résultats
    const fallback = FALLBACK_STRUCTURES.filter(
      (s) => type === "tous" || s.type === type || s.type === "tous"
    ).map((s) => ({
      ...s,
      distance_m: Math.round(haversineDistance(lat, lng, s.lat, s.lng)),
    }));

    return NextResponse.json({ ok: true, source: "fallback", count: fallback.length, structures: fallback });
  } catch (err) {
    console.error("[/api/structures] Overpass error:", err);

    // Fallback en cas d'erreur réseau
    const fallback = FALLBACK_STRUCTURES.filter(
      (s) => type === "tous" || s.type === type || s.type === "tous"
    ).map((s) => ({
      ...s,
      distance_m: Math.round(haversineDistance(lat, lng, s.lat, s.lng)),
    }));

    return NextResponse.json({ ok: true, source: "fallback", count: fallback.length, structures: fallback });
  }
}
