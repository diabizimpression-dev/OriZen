import { NextResponse } from "next/server";

// =====================================================
// GUICHETS OFFICIELS — CAF, CPAM, OFPRA, Préfecture
// Sources :
//   · Overpass OSM pour les agences locales
//   · geo.api.gouv.fr pour département + préfecture
//   · Données statiques officielles OFPRA
//
// Tous gratuits, sans clé API
// =====================================================

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLon = toR(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Préfectures compétentes pour l'asile par département → ville siège
// Source : OFPRA (données statiques officielles)
const PREFECTURE_ASYLUM: Record<string, { city: string; address: string; phone: string }> = {
  "75": { city: "Paris",      address: "7-9 boulevard Diderot, 75012 Paris",         phone: "01 53 71 51 68" },
  "13": { city: "Marseille",  address: "2 rue Henri Barbusse, 13001 Marseille",       phone: "04 84 35 40 00" },
  "69": { city: "Lyon",       address: "106 rue Pierre Corneille, 69003 Lyon",        phone: "04 72 61 60 60" },
  "31": { city: "Toulouse",   address: "1 pl Saint-Étienne, 31038 Toulouse",         phone: "05 34 45 34 45" },
  "06": { city: "Nice",       address: "147 route de Grenoble, 06200 Nice",           phone: "04 93 72 20 00" },
  "33": { city: "Bordeaux",   address: "2 espl. Charles de Gaulle, 33077 Bordeaux",  phone: "05 56 90 60 00" },
  "67": { city: "Strasbourg", address: "14 rue de la Nuée-Bleue, 67000 Strasbourg",  phone: "03 88 21 67 68" },
  "44": { city: "Nantes",     address: "6 quai Ceineray, 44000 Nantes",              phone: "02 40 41 20 20" },
  "59": { city: "Lille",      address: "12 rue Jean Roisin, 59000 Lille",             phone: "03 20 30 59 59" },
  "34": { city: "Montpellier",address: "Pl. Paul Bec, 34062 Montpellier",            phone: "04 67 61 61 61" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "48.8566");
  const lng = parseFloat(searchParams.get("lng") ?? "2.3522");
  const type = searchParams.get("type") ?? "tous"; // caf | cpam | prefecture | ofpra | tous

  // 1. Obtenir le département via geo.api.gouv.fr
  const [geoRes] = await Promise.allSettled([
    fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=nom,codeDepartement,departement&format=json&limit=1`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } }
    ).then((r) => r.json()),
  ]);

  const commune = geoRes.status === "fulfilled" ? geoRes.value?.[0] : null;
  const codeDept: string = commune?.codeDepartement ?? "";
  const communeName: string = commune?.nom ?? "";
  const deptName: string = commune?.departement?.nom ?? "";

  // 2. Chercher agences CAF, CPAM, préfecture via Overpass
  const overpassTags = [
    '"office"="government" ["name"~"CAF|Caf|caisse allocations|caisse d\'allocations",i]',
    '"office"="government" ["name"~"CPAM|caisse primaire|assurance maladie",i]',
    '"amenity"="social_facility" ["name"~"CAF|CPAM",i]',
    '"office"="government" ["government"="social_insurance"]',
    '"amenity"="townhall"',
    '"office"="government" ["government"="prefecture"]',
  ];

  const overpassQuery = `
    [out:json][timeout:12];
    (
      ${overpassTags.map((t) => `node[${t}](around:8000,${lat},${lng});`).join("\n      ")}
      ${overpassTags.map((t) => `way[${t}](around:8000,${lat},${lng});`).join("\n      ")}
    );
    out center 15;
  `;

  const osmRes = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(overpassQuery)}`,
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 3600 },
  }).then((r) => r.json()).catch(() => ({ elements: [] }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elements: any[] = osmRes.elements ?? [];

  type GuichetType = "caf" | "cpam" | "prefecture" | "ofpra" | "mairie";

  interface Guichet {
    id: string;
    name: string;
    type: GuichetType;
    typeLabel: string;
    address: string;
    phone: string | null;
    hours: string | null;
    lat: number | null;
    lng: number | null;
    distance_m: number | null;
    website: string | null;
    color: string;
    note: string;
  }

  const COLOR: Record<GuichetType, string> = {
    caf:        "#6366F1",
    cpam:       "#10B981",
    prefecture: "#F59E0B",
    ofpra:      "#8B5CF6",
    mairie:     "#06B6D4",
  };

  const guichets: Guichet[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const el of elements) {
    const name: string = el.tags?.name ?? "";
    const eLat = el.lat ?? el.center?.lat;
    const eLng = el.lon ?? el.center?.lon;
    if (!eLat || !eLng) continue;

    const nameLower = name.toLowerCase();
    let guichetType: GuichetType | null = null;

    if (nameLower.includes("caf") || nameLower.includes("allocations familiales")) guichetType = "caf";
    else if (nameLower.includes("cpam") || nameLower.includes("assurance maladie")) guichetType = "cpam";
    else if (el.tags?.government === "prefecture" || nameLower.includes("préfecture")) guichetType = "prefecture";
    else if (el.tags?.amenity === "townhall") guichetType = "mairie";

    if (!guichetType) continue;
    if (type !== "tous" && guichetType !== type) continue;

    const distance_m = Math.round(haversine(lat, lng, eLat, eLng));

    const addrParts = [
      el.tags?.["addr:housenumber"],
      el.tags?.["addr:street"],
      el.tags?.["addr:postcode"],
      el.tags?.["addr:city"],
    ].filter(Boolean);

    const TYPE_LABELS: Record<GuichetType, string> = {
      caf: "CAF",
      cpam: "CPAM",
      prefecture: "Préfecture",
      ofpra: "OFPRA",
      mairie: "Mairie",
    };

    const NOTES: Record<GuichetType, string> = {
      caf: "RSA, APL, aides familiales · Prenez RDV en ligne sur caf.fr",
      cpam: "Carte vitale, AME, PUMA · ameli.fr",
      prefecture: "Titres de séjour, asile · Rendez-vous obligatoire",
      ofpra: "Demande de protection internationale",
      mairie: "CCAS, état civil, aide urgence locale",
    };

    guichets.push({
      id: `osm_${el.id}`,
      name,
      type: guichetType,
      typeLabel: TYPE_LABELS[guichetType],
      address: addrParts.join(", ") || "",
      phone: el.tags?.phone ?? el.tags?.["contact:phone"] ?? null,
      hours: el.tags?.opening_hours ?? null,
      lat: eLat,
      lng: eLng,
      distance_m,
      website: el.tags?.website ?? el.tags?.["contact:website"] ?? null,
      color: COLOR[guichetType],
      note: NOTES[guichetType],
    });
  }

  // 3. Ajouter la préfecture OFPRA statique si disponible et demandée
  const prefInfo = PREFECTURE_ASYLUM[codeDept];
  if (
    prefInfo &&
    (type === "tous" || type === "prefecture" || type === "ofpra") &&
    !guichets.find((g) => g.type === "prefecture")
  ) {
    guichets.push({
      id: `static_pref_${codeDept}`,
      name: `Préfecture de ${deptName || communeName}`,
      type: "prefecture",
      typeLabel: "Préfecture",
      address: prefInfo.address,
      phone: prefInfo.phone,
      hours: "Lun-Ven 9h-12h · Sur RDV recommandé",
      lat: null,
      lng: null,
      distance_m: null,
      website: `https://www.prefectures-regions.gouv.fr`,
      color: COLOR.prefecture,
      note: "Titres de séjour, asile, CESEDA · Rendez-vous via Administration+",
    });
  }

  guichets.sort((a, b) => (a.distance_m ?? 9999999) - (b.distance_m ?? 9999999));

  return NextResponse.json({
    ok: true,
    commune: communeName,
    departement: deptName,
    codeDepartement: codeDept,
    guichets: guichets.slice(0, 10),
    count: guichets.length,
  });
}
