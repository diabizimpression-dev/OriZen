import { NextResponse } from "next/server";

// =====================================================
// FINESS API — Fichier National des Établissements Sanitaires et Sociaux
// Source : Ministère de la Santé (data.finess.sante.gouv.fr)
// Gratuit, sans clé API — ~320 000 établissements en France
// Doc : https://data.finess.sante.gouv.fr/api/explore/v2.1/
//
// Catégories ciblées pour OriZen :
//   - PASS : Permanence d'Accès aux Soins de Santé (soins gratuits sans papiers)
//   - CHRS : Centre d'Hébergement et de Réinsertion Sociale
//   - CADA : Centre d'Accueil pour Demandeurs d'Asile
//   - CSAPA : Centre de Soins en Addictologie
//   - CMP : Centre Médico-Psychologique
//   - CPAM : Caisse Primaire d'Assurance Maladie
// =====================================================

const BASE_URL =
  "https://data.finess.sante.gouv.fr/api/explore/v2.1/catalog/datasets/fiches-finess-etablissements/records";

// Mapping type OriZen → filtres FINESS
const TYPE_FILTERS: Record<string, { categories: string[]; nameContains?: string[] }> = {
  sante: {
    categories: [
      "Etablissement de soins de courte durée",
      "Etablissement de soins de longue durée",
      "Centre de Santé",
      "Cabinet de soins",
      "Dispensaire ou centre de soins, centre de planification ou d'éducation familiale",
    ],
    nameContains: ["PASS", "permanence accès", "CPAM", "centre de santé"],
  },
  logement: {
    categories: [
      "Centre d'hébergement et de réinsertion sociale (CHRS)",
      "Résidence hôtelière à vocation sociale",
      "Centre d'accueil et d'accompagnement à la réduction des risques pour usagers de drogues",
    ],
    nameContains: ["CHRS", "hébergement", "foyer"],
  },
  "sans-papiers": {
    categories: [
      "Centre d'accueil pour demandeurs d'asile (CADA)",
      "Structure d'accueil pour demandeurs d'asile",
    ],
    nameContains: ["CADA", "asile", "réfugié"],
  },
  "mineur-isole": {
    categories: [
      "Maison d'enfants à caractère social (MECS)",
      "Foyer de l'enfance",
    ],
    nameContains: ["MNA", "mineur", "enfance", "jeunes"],
  },
  sante_mentale: {
    categories: [
      "Centre médico-psychologique (CMP)",
      "Centre de soins, d'accompagnement et de prévention en addictologie (CSAPA)",
    ],
    nameContains: ["CMP", "CSAPA", "psychiatrie", "addictologie"],
  },
};

interface FinessRecord {
  nofinesset?: string;
  rs?: string;
  rslongue?: string;
  libcategorieagr?: string;
  libcomplcateg?: string;
  numvoie?: string;
  typvoie?: string;
  voie?: string;
  ligneacheminement?: string;
  telephone?: string;
  telephone2?: string;
  coordonnees_finessgeographiques?: { lon: number; lat: number };
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat    = parseFloat(searchParams.get("lat")    ?? "48.8566");
  const lng    = parseFloat(searchParams.get("lng")    ?? "2.3522");
  const type   = searchParams.get("type") ?? "sante";
  const radius = parseInt(searchParams.get("radius")  ?? "5000");

  // Construire la requête géo FINESS (format OGC WKT)
  const geoFilter = `within_distance(coordonnees_finessgeographiques, geom'POINT(${lng} ${lat})', ${radius}m)`;

  const filter = TYPE_FILTERS[type] ?? TYPE_FILTERS.sante;

  // Filtre catégorie FINESS
  const categoryFilter = filter.categories
    .map((c) => `libcategorieagr='${c}'`)
    .join(" OR ");

  const whereClause = categoryFilter
    ? `(${categoryFilter}) AND ${geoFilter}`
    : geoFilter;

  const url = new URL(BASE_URL);
  url.searchParams.set("where", whereClause);
  url.searchParams.set(
    "select",
    "nofinesset,rs,rslongue,libcategorieagr,libcomplcateg,numvoie,typvoie,voie,ligneacheminement,telephone,telephone2,coordonnees_finessgeographiques"
  );
  url.searchParams.set("limit", "20");
  url.searchParams.set("order_by", "dist(coordonnees_finessgeographiques, geom'POINT(" + lng + " " + lat + ")')");

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `FINESS HTTP ${res.status}`, structures: [] });
    }

    const data = await res.json();
    const records: FinessRecord[] = data.results ?? [];

    const structures = records
      .filter((r) => r.coordonnees_finessgeographiques?.lat && r.coordonnees_finessgeographiques?.lon)
      .map((r) => {
        const sLat = r.coordonnees_finessgeographiques!.lat;
        const sLng = r.coordonnees_finessgeographiques!.lon;
        const distance_m = Math.round(haversineDistance(lat, lng, sLat, sLng));

        const addrParts = [r.numvoie, r.typvoie, r.voie].filter(Boolean).join(" ");
        const addr = [addrParts, r.ligneacheminement].filter(Boolean).join(", ");

        return {
          id: `finess_${r.nofinesset ?? Math.random()}`,
          name: r.rs ?? r.rslongue ?? "Établissement FINESS",
          lat: sLat,
          lng: sLng,
          type,
          addr: addr || "",
          phone: r.telephone ?? r.telephone2 ?? "",
          open: "",
          category: r.libcategorieagr ?? "",
          subCategory: r.libcomplcateg ?? "",
          distance_m,
          reliability_score: 90, // Source officielle = très fiable
          source: "finess" as const,
          verified_at: "2024-01-01",
        };
      })
      .sort((a, b) => a.distance_m - b.distance_m)
      .slice(0, 15);

    return NextResponse.json({
      ok: true,
      source: "finess",
      count: structures.length,
      structures,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), structures: [] });
  }
}
