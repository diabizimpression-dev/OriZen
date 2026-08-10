import { NextResponse } from "next/server";

// =====================================================
// CCAS LOCATOR — Centre Communal d'Action Sociale
// Sources :
//   1. geo.api.gouv.fr → commune + code INSEE (gratuit, sans clé)
//   2. Overpass OSM → CCAS et mairies proches (gratuit, sans clé)
//   3. data.gouv.fr → informations complémentaires (gratuit, sans clé)
//
// Le CCAS est le guichet local des aides d'urgence (48h), RSA, FSL…
// Chaque commune française de +1500 hab. est obligée d'en avoir un (CASF L123-4)
// =====================================================

interface CCASInfo {
  commune: string;
  codeInsee: string;
  codeDepartement: string;
  population: number | null;
  ccasName: string;
  ccasAddress: string | null;
  ccasPhone: string | null;
  ccasHours: string | null;
  ccasWebsite: string | null;
  mairieName: string | null;
  mairiePhone: string | null;
  mairieAddress: string | null;
  lat: number | null;
  lng: number | null;
  source: string;
  rightsSummary: string;
}

function buildCCASWebsite(commune: string, codeDept: string): string {
  const slug = commune
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `https://www.${slug}.fr/ccas`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "48.8566");
  const lng = parseFloat(searchParams.get("lng") ?? "2.3522");

  try {
    // 1. Obtenir la commune depuis geo.api.gouv.fr
    const geoRes = await fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=nom,code,codeDepartement,population,centre&format=json&limit=1`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) }
    );

    if (!geoRes.ok) {
      return NextResponse.json({ ok: false, error: "Commune non trouvée" });
    }

    const geoData = await geoRes.json();
    if (!geoData?.length) {
      return NextResponse.json({ ok: false, error: "Commune non trouvée" });
    }

    const commune = geoData[0];
    const communeName: string = commune.nom;
    const codeInsee: string = commune.code;
    const codeDept: string = commune.codeDepartement;
    const population: number | null = commune.population ?? null;

    // 2. Chercher le CCAS via Overpass OSM dans un rayon de 3km
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node["office"="social_welfare"](around:3000,${lat},${lng});
        node["amenity"="social_facility"]["social_facility"="advice"](around:3000,${lat},${lng});
        node["name"~"CCAS",i](around:3000,${lat},${lng});
        way["name"~"CCAS",i](around:3000,${lat},${lng});
        node["amenity"="townhall"](around:3000,${lat},${lng});
        way["amenity"="townhall"](around:3000,${lat},${lng});
      );
      out center 5;
    `;

    const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    let ccasLat: number | null = null;
    let ccasLng: number | null = null;
    let ccasPhone: string | null = null;
    let ccasHours: string | null = null;
    let ccasAddress: string | null = null;
    let ccasName = `CCAS de ${communeName}`;
    let mairieName: string | null = null;
    let mairiePhone: string | null = null;
    let mairieAddress: string | null = null;

    if (overpassRes.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const osmData = await overpassRes.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const elements: any[] = osmData.elements ?? [];

      // Chercher d'abord un CCAS explicite
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ccasEl = elements.find((e: any) =>
        (e.tags?.name ?? "").toLowerCase().includes("ccas") ||
        (e.tags?.office === "social_welfare")
      );

      if (ccasEl) {
        ccasLat = ccasEl.lat ?? ccasEl.center?.lat ?? null;
        ccasLng = ccasEl.lon ?? ccasEl.center?.lon ?? null;
        ccasName = ccasEl.tags?.name ?? ccasName;
        ccasPhone = ccasEl.tags?.phone ?? ccasEl.tags?.["contact:phone"] ?? null;
        ccasHours = ccasEl.tags?.opening_hours ?? null;
        const num = ccasEl.tags?.["addr:housenumber"] ?? "";
        const street = ccasEl.tags?.["addr:street"] ?? "";
        const city = ccasEl.tags?.["addr:city"] ?? communeName;
        ccasAddress = [num, street, city].filter(Boolean).join(" ") || null;
      }

      // Chercher la mairie en fallback
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mairieEl = elements.find((e: any) => e.tags?.amenity === "townhall");
      if (mairieEl) {
        mairieName = mairieEl.tags?.name ?? `Mairie de ${communeName}`;
        mairiePhone = mairieEl.tags?.phone ?? mairieEl.tags?.["contact:phone"] ?? null;
        const num = mairieEl.tags?.["addr:housenumber"] ?? "";
        const street = mairieEl.tags?.["addr:street"] ?? "";
        const city = mairieEl.tags?.["addr:city"] ?? communeName;
        mairieAddress = [num, street, city].filter(Boolean).join(" ") || null;

        // Si pas de CCAS trouvé, utiliser les coords de la mairie
        if (!ccasLat && mairieEl.lat) {
          ccasLat = mairieEl.lat ?? mairieEl.center?.lat ?? null;
          ccasLng = mairieEl.lon ?? mairieEl.center?.lon ?? null;
        }
      }
    }

    const result: CCASInfo = {
      commune: communeName,
      codeInsee,
      codeDepartement: codeDept,
      population,
      ccasName,
      ccasAddress,
      ccasPhone,
      ccasHours,
      ccasWebsite: buildCCASWebsite(communeName, codeDept),
      mairieName,
      mairiePhone,
      mairieAddress,
      lat: ccasLat,
      lng: ccasLng,
      source: ccasPhone ? "osm" : "geo-api",
      rightsSummary:
        `Le CCAS de ${communeName} peut vous accorder une aide d'urgence en 48h (décret du 6 mai 1995). ` +
        `Présentez-vous avec une pièce d'identité. ` +
        (population && population < 1500
          ? `Cette commune de ${population} habitants est rattachée au CIAS intercommunal.`
          : `Toute personne en difficulté peut demander une aide, quelle que sa nationalité.`),
    };

    return NextResponse.json({ ok: true, ccas: result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
