import { NextResponse } from "next/server";

// =====================================================
// MÉTÉO-FRANCE VIGILANCE — Alertes officielles par département
// Source 1 (payant) : portail-api.meteofrance.fr (METEOFRANCE_API_KEY)
// Source 2 (gratuit) : flux RSS XML Météo-France (public, non officiel)
// Source 3 (fallback) : calcul Open-Meteo déjà intégré dans /api/context
//
// Niveaux : 1=vert · 2=jaune · 3=orange · 4=rouge
// Phénomènes : vent, pluie, orages, neige, inondation, canicule, grand froid, avalanche
// =====================================================

interface VigilanceAlert {
  phenomenon: string;
  level: 1 | 2 | 3 | 4;
  levelLabel: "vert" | "jaune" | "orange" | "rouge";
  description: string;
  department: string;
}

function levelLabel(level: number): "vert" | "jaune" | "orange" | "rouge" {
  if (level >= 4) return "rouge";
  if (level >= 3) return "orange";
  if (level >= 2) return "jaune";
  return "vert";
}

function phenomenonLabel(code: string | number): string {
  const map: Record<string, string> = {
    "1": "Vent violent",
    "2": "Pluie-inondation",
    "3": "Orages",
    "4": "Inondation",
    "5": "Neige-verglas",
    "6": "Canicule",
    "7": "Grand froid",
    "8": "Avalanches",
    "9": "Vagues-submersion",
    vent: "Vent violent",
    pluie: "Pluie-inondation",
    orages: "Orages",
    inondation: "Inondation",
    neige: "Neige-verglas",
    canicule: "Canicule",
    grand_froid: "Grand froid",
    avalanche: "Avalanches",
  };
  return map[String(code)] ?? String(code);
}

// Essaie l'API officielle Météo-France Portail
async function fetchOfficialAPI(
  lat: number,
  lng: number
): Promise<VigilanceAlert[] | null> {
  const apiKey = process.env.METEOFRANCE_API_KEY;
  if (!apiKey) return null;

  try {
    // Endpoint vigilance département (nécessite le code département)
    // On utilise geo.api.gouv.fr pour obtenir le département
    const geoRes = await fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=codeDepartement&format=json&limit=1`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    const deptCode: string = geoData[0]?.codeDepartement;
    if (!deptCode) return null;

    const res = await fetch(
      `https://public-api.meteofrance.fr/public/DPVigilance/v1/vigilance-bulletins-nationaux/last`,
      {
        headers: {
          apikey: apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(6000),
        next: { revalidate: 1800 },
      }
    );

    if (!res.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json();
    const alerts: VigilanceAlert[] = [];

    // Parcourir les périodes de vigilance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periods = data?.product?.periods ?? data?.periods ?? [];
    for (const period of periods) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timelaps = period?.timelaps ?? [];
      for (const tl of timelaps) {
        const deptAlerts = (tl.domain_ids ?? []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (d: any) => String(d.id ?? d) === deptCode
        );
        if (deptAlerts.length === 0) continue;

        const level = tl.max_color_id ?? tl.echeance?.max_color_id ?? 1;
        if (level < 2) continue; // On ne montre que jaune et au-dessus

        alerts.push({
          phenomenon: phenomenonLabel(tl.phenomenon_id ?? tl.phenomenon ?? ""),
          level: level as 1 | 2 | 3 | 4,
          levelLabel: levelLabel(level),
          description: tl.phenomenon_max_color_id_comment ?? "",
          department: deptCode,
        });
      }
    }

    return alerts;
  } catch {
    return null;
  }
}

// Fallback : flux RSS Météo-France (format texte brut, public)
async function fetchRSSFallback(lat: number, lng: number): Promise<VigilanceAlert[] | null> {
  try {
    // Obtenir le code département via geo.api.gouv.fr
    const geoRes = await fetch(
      `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=codeDepartement,nom&format=json&limit=1`,
      { signal: AbortSignal.timeout(3000), next: { revalidate: 3600 } }
    );
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    const deptCode: string = geoData[0]?.codeDepartement;
    if (!deptCode) return null;

    // Flux XML de vigilance (utilisé par le site Météo-France)
    const xmlRes = await fetch(
      `https://vigilance.meteofrance.fr/data/departements_${deptCode}.xml`,
      {
        headers: { "User-Agent": "OriZen/1.0 (aide sociale France)" },
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 1800 },
      }
    );

    if (!xmlRes.ok) return null;

    const xml = await xmlRes.text();
    const alerts: VigilanceAlert[] = [];

    // Parsing XML minimal avec regex (évite import xml2js)
    const colorMatch = xml.match(/couleur="(\d+)"/);
    const maxLevel = colorMatch ? parseInt(colorMatch[1]) : 1;

    if (maxLevel >= 2) {
      // Extraire les phénomènes
      const phenRegex = /phenomene_id="(\d+)"[^/]*couleur="(\d+)"/g;
      let match;
      while ((match = phenRegex.exec(xml)) !== null) {
        const phenId = match[1];
        const level = parseInt(match[2]);
        if (level >= 2) {
          alerts.push({
            phenomenon: phenomenonLabel(phenId),
            level: level as 1 | 2 | 3 | 4,
            levelLabel: levelLabel(level),
            description: "",
            department: deptCode,
          });
        }
      }
    }

    return alerts.length > 0 ? alerts : [];
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "48.8566");
  const lng = parseFloat(searchParams.get("lng") ?? "2.3522");

  // Essai en cascade : API officielle → RSS → null
  const [official, rss] = await Promise.allSettled([
    fetchOfficialAPI(lat, lng),
    fetchRSSFallback(lat, lng),
  ]);

  const officialAlerts = official.status === "fulfilled" ? official.value : null;
  const rssAlerts = rss.status === "fulfilled" ? rss.value : null;

  const alerts = officialAlerts ?? rssAlerts ?? [];
  const source = officialAlerts ? "meteofrance-api" : rssAlerts ? "meteofrance-rss" : "none";

  // Niveau max global
  const maxLevel = alerts.reduce((max, a) => Math.max(max, a.level), 1);

  return NextResponse.json({
    ok: true,
    source,
    maxLevel,
    maxLevelLabel: levelLabel(maxLevel),
    alerts,
    configured: !!process.env.METEOFRANCE_API_KEY,
  });
}
