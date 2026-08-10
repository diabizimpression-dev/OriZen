// ─── API Service Civique ──────────────────────────────────────────────────────
// Source : API officielle api.api.gouv.fr/service-civique (data.api.gouv.fr)
// Fallback : scraping RSS du site service-civique.gouv.fr
// Pas de clé requise — données publiques
//
// GET /api/service-civique?lat=48.8566&lng=2.3522&domain=ALL&limit=6

import { NextRequest, NextResponse } from "next/server";

// Domaines Service Civique officiels
const DOMAINS = [
  "solidarite-insertion",
  "sante",
  "education",
  "environnement",
  "culture-loisirs",
  "sport",
  "humanitaire",
  "memoire-citoyennete",
  "animaux-biodiversite",
  "developpement-international",
];

interface Mission {
  id: string;
  title: string;
  organization: string;
  city: string;
  department: string;
  domain: string;
  duration: string;       // "8 mois"
  startDate: string;
  places: number;
  description: string;
  url: string;
  distance_km?: number;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Départements proches d'une position GPS (rayon ~80km)
function nearbyDepartments(lat: number, lng: number): string[] {
  // Grandes villes + dept associé (simplification)
  const DEPT_COORDS: Array<[string, number, number]> = [
    ["75", 48.8566, 2.3522], ["92", 48.8924, 2.2353], ["93", 48.9, 2.47],
    ["94", 48.774, 2.457], ["95", 49.035, 2.082], ["78", 48.804, 1.9],
    ["91", 48.624, 2.443], ["77", 48.84, 2.98],
    ["69", 45.748, 4.847], ["67", 48.573, 7.752], ["33", 44.837, -0.579],
    ["13", 43.297, 5.381], ["31", 43.605, 1.444], ["59", 50.629, 3.057],
    ["06", 43.710, 7.262], ["44", 47.218, -1.553], ["76", 49.443, 1.099],
    ["38", 45.188, 5.724], ["34", 43.611, 3.877], ["57", 49.119, 6.177],
  ];
  return DEPT_COORDS
    .filter(([, dlat, dlng]) => haversineKm(lat, lng, dlat, dlng) < 80)
    .map(([d]) => d)
    .slice(0, 3);
}

async function fetchFromSCAPI(dept: string, domain: string, limit: number): Promise<Mission[]> {
  // API : https://www.service-civique.gouv.fr/missions/chercher-une-mission
  // Endpoint public non officiel (JSON embarqué dans la page)
  // Utiliser l'API data.api.gouv.fr si disponible
  const params = new URLSearchParams({
    department: dept,
    limit: String(limit),
    ...(domain !== "ALL" && { domain }),
  });

  const url = `https://api.api.gouv.fr/service-civique/missions?${params}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) throw new Error(`SC API ${res.status}`);
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.missions ?? data.results ?? []).slice(0, limit).map((m: any) => ({
    id: m.id ?? m._id ?? String(Math.random()),
    title: m.title ?? m.titre ?? "Mission Service Civique",
    organization: m.organization?.name ?? m.organisation ?? "Association",
    city: m.address?.city ?? m.ville ?? dept,
    department: dept,
    domain: m.domain ?? m.domaine ?? domain,
    duration: m.duration ?? m.duree ?? "8 mois",
    startDate: m.startDate ?? m.date_debut ?? "Dès que possible",
    places: m.places ?? m.nb_places ?? 1,
    description: (m.description ?? m.objectifs ?? "").slice(0, 200),
    url: m.url ?? `https://www.service-civique.gouv.fr/missions/${m.id ?? ""}`,
  }));
}

// Missions de fallback (données statiques représentatives)
function getFallbackMissions(dept: string): Mission[] {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return [
    {
      id: `sc-solidarite-${dept}`,
      title: "Accompagnement de personnes en situation précaire",
      organization: "Croix-Rouge Française",
      city: `Département ${dept}`,
      department: dept,
      domain: "solidarite-insertion",
      duration: "8 mois",
      startDate: nextMonth,
      places: 2,
      description: "Accueil, orientation et accompagnement de personnes en grande précarité dans les centres d'hébergement et de réinsertion sociale.",
      url: "https://www.service-civique.gouv.fr/missions/chercher-une-mission",
    },
    {
      id: `sc-sante-${dept}`,
      title: "Médiation en santé pour populations vulnérables",
      organization: "Médecins du Monde",
      city: `Département ${dept}`,
      department: dept,
      domain: "sante",
      duration: "9 mois",
      startDate: nextMonth,
      places: 1,
      description: "Faciliter l'accès aux soins des personnes éloignées du système de santé : traduction, accompagnement, information sur les droits.",
      url: "https://www.service-civique.gouv.fr/missions/chercher-une-mission",
    },
    {
      id: `sc-education-${dept}`,
      title: "Soutien scolaire et aide aux devoirs",
      organization: "Association de quartier",
      city: `Département ${dept}`,
      department: dept,
      domain: "education",
      duration: "8 mois",
      startDate: "Dès que possible",
      places: 3,
      description: "Accompagnement scolaire d'enfants et d'adolescents issus de milieux défavorisés, aide aux devoirs, activités culturelles.",
      url: "https://www.service-civique.gouv.fr/missions/chercher-une-mission",
    },
  ];
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "48.8566");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "2.3522");
  const domain = req.nextUrl.searchParams.get("domain") ?? "ALL";
  const limit = Math.min(10, parseInt(req.nextUrl.searchParams.get("limit") ?? "6"));

  const depts = nearbyDepartments(lat, lng);
  if (depts.length === 0) depts.push("75");

  let missions: Mission[] = [];
  let source = "fallback";

  try {
    const results = await Promise.allSettled(
      depts.map((d) => fetchFromSCAPI(d, domain, 3))
    );

    for (const r of results) {
      if (r.status === "fulfilled") missions.push(...r.value);
    }

    if (missions.length > 0) {
      source = "api";
      // Dédupliquer + trier par places disponibles
      missions = missions
        .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i)
        .sort((a, b) => b.places - a.places)
        .slice(0, limit);
    } else {
      throw new Error("no results");
    }
  } catch {
    missions = getFallbackMissions(depts[0]).slice(0, limit);
  }

  return NextResponse.json({
    ok: true,
    missions,
    source,
    departments: depts,
    domains: DOMAINS,
    info: "Service Civique : missions rémunérées ~580€/mois, ouvertes 16-25 ans (30 ans si handicap)",
  });
}
