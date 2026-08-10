import { NextResponse } from "next/server";

// =====================================================
// RNA — Répertoire National des Associations
// Source : entreprise.data.gouv.fr/api/rna (gratuit, sans clé)
// ~1,5 million d'associations en France
//
// Objets sociaux ciblés par scénario OriZen :
//   logement      → hébergement, insertion, SDF, sans-abri
//   alimentation  → alimentaire, épicerie, colis, repas
//   sante         → soin, santé, médical, infirmier
//   sans-papiers  → migrant, réfugié, étranger, asile, exil
//   mineur-isole  → enfance, mineur, jeune, MNA
//   violence      → violence, femme, victime, agression
//   aide-financiere → surendettement, budget, CAF, aide financière
// =====================================================

const SCENARIO_KEYWORDS: Record<string, string[]> = {
  logement:         ["hébergement", "sans-abri", "SDF", "insertion logement", "accueil"],
  alimentation:     ["alimentaire", "épicerie sociale", "colis alimentaire", "banque alimentaire", "repas"],
  sante:            ["santé", "médical", "soin", "infirmier", "médecin", "santé mentale"],
  "sans-papiers":   ["migrant", "réfugié", "étranger", "asile", "exil", "immigration"],
  "mineur-isole":   ["enfance", "mineur isolé", "MNA", "jeune", "enfant"],
  "violence-familiale": ["violence", "femme battue", "victime", "agression conjugale"],
  "aide-financiere":["surendettement", "aide financière", "budget", "endettement"],
  urgence:          ["urgence sociale", "crise", "détresse", "aide d'urgence"],
};

interface AssociationRecord {
  id?: string;
  siret?: string;
  titre?: string;
  objet?: string;
  adresse_siege?: {
    l1?: string; l2?: string; l3?: string;
    cp?: string; commune?: string;
    coordonnees?: { lat?: number; lon?: number };
  };
  date_creation?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat      = parseFloat(searchParams.get("lat")    ?? "48.8566");
  const lng      = parseFloat(searchParams.get("lng")    ?? "2.3522");
  const scenario = searchParams.get("scenario") ?? "logement";
  const radius   = parseInt(searchParams.get("radius")   ?? "5000");

  const keywords = SCENARIO_KEYWORDS[scenario] ?? SCENARIO_KEYWORDS.logement;
  // On essaie plusieurs mots-clés et on agrège
  const query = keywords[0]; // Premier mot-clé pour la requête principale

  try {
    // Chercher par objet social + commune approchée via geo.api.gouv.fr
    const geoRes = await fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=codesPostaux,nom&format=json&limit=3`,
      { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } }
    );

    const communes = geoRes.ok ? await geoRes.json() : [];
    const cps: string[] = communes.flatMap((c: { codesPostaux: string[] }) => c.codesPostaux ?? []).slice(0, 3);

    if (cps.length === 0) {
      return NextResponse.json({ ok: false, error: "Commune non trouvée", associations: [] });
    }

    // Cherche dans les 3 CP les plus proches, en parallèle
    const results = await Promise.allSettled(
      cps.map((cp) =>
        fetch(
          `https://entreprise.data.gouv.fr/api/rna/v1/full_text/${encodeURIComponent(query)}?page=1&per_page=10&cp=${cp}`,
          { signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } }
        ).then((r) => r.json())
      )
    );

    // Agréger + dédupliquer
    const seen = new Set<string>();
    const associations: Array<{
      id: string; name: string; objet: string; address: string;
      phone: string | null; email: string | null; website: string | null;
      lat: number | null; lng: number | null; distance_m: number | null;
      created: string | null;
    }> = [];

    for (const res of results) {
      if (res.status !== "fulfilled") continue;
      const items: AssociationRecord[] = res.value?.association ?? res.value?.associations ?? res.value?.data ?? [];
      for (const item of items) {
        const id = item.id ?? item.siret ?? "";
        if (seen.has(id)) continue;
        seen.add(id);

        const coords = item.adresse_siege?.coordonnees;
        const aLat = coords?.lat ?? null;
        const aLng = coords?.lon ?? null;

        // Filtrer par distance si on a des coords
        const distance_m = aLat && aLng
          ? Math.round(haversine(lat, lng, aLat, aLng))
          : null;
        if (distance_m != null && distance_m > radius) continue;

        const addrParts = [
          item.adresse_siege?.l1,
          item.adresse_siege?.l2,
          item.adresse_siege?.l3,
          `${item.adresse_siege?.cp ?? ""} ${item.adresse_siege?.commune ?? ""}`.trim(),
        ].filter(Boolean);

        associations.push({
          id,
          name: item.titre ?? "",
          objet: (item.objet ?? "").slice(0, 150),
          address: addrParts.join(", "),
          phone: item.telephone ?? null,
          email: item.email ?? null,
          website: item.site_web ?? null,
          lat: aLat,
          lng: aLng,
          distance_m,
          created: item.date_creation ?? null,
        });
      }
    }

    // Trier par distance
    associations.sort((a, b) => (a.distance_m ?? 9999999) - (b.distance_m ?? 9999999));

    return NextResponse.json({
      ok: true,
      source: "rna-data-gouv",
      scenario,
      query,
      count: associations.length,
      associations: associations.slice(0, 15),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), associations: [] });
  }
}
