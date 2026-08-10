import { NextResponse } from "next/server";
import { getPisteToken } from "@/lib/piste";

// =====================================================
// JUDILIBRE API — Jurisprudence Cour de Cassation
// Source : Cour de Cassation / api.piste.gouv.fr (gratuit, officiel)
// ~480 000 décisions disponibles, open data
// Doc : https://www.data.gouv.fr/dataservices/api-judilibre
// =====================================================

const SCENARIO_QUERIES: Record<string, string> = {
  logement:          "hébergement urgence DALO droit opposable logement",
  alimentation:      "aide alimentaire RSA exclusion",
  sante:             "aide médicale état soins urgents AME",
  urgence:           "protection danger victime ordonnance",
  "sans-papiers":    "étranger expulsion asile protection subsidiaire",
  "mineur-isole":    "mineur non accompagné étranger protection ASE",
  "violence-familiale": "ordonnance protection violence conjugale",
  "aide-financiere": "RSA revenu solidarité allocation chômage",
};

// Chambres pertinentes pour chaque scénario
const SCENARIO_CHAMBER: Record<string, string | null> = {
  logement:          null,
  alimentation:      null,
  sante:             null,
  urgence:           "Cr", // Chambre criminelle
  "sans-papiers":    null,
  "mineur-isole":    null,
  "violence-familiale": "Cr",
  "aide-financiere": "So", // Chambre sociale
};

interface Decision {
  id: string;
  number: string;
  chamber: string;
  date: string;
  solution: string;
  summary: string;
  url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get("scenario") ?? "logement";
  const query = SCENARIO_QUERIES[scenario] ?? scenario;
  const chamber = SCENARIO_CHAMBER[scenario] ?? null;

  const token = await getPisteToken();

  if (!token) {
    return NextResponse.json({
      ok: false,
      configured: false,
      decisions: [] as Decision[],
    });
  }

  try {
    const url = new URL(
      "https://api.piste.gouv.fr/cassation/judilibre/v1.0/search"
    );
    url.searchParams.set("query", query);
    url.searchParams.set("page_size", "3");
    url.searchParams.set("resolve_references", "true");
    if (chamber) url.searchParams.set("chamber", chamber);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache 1h
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `HTTP ${res.status}`, decisions: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decisions: Decision[] = (data.results ?? []).slice(0, 3).map((d: any) => {
      const summary: string = d.summary ?? d.titlesAndSummaries?.[0]?.title ?? "";
      return {
        id: d.id ?? "",
        number: d.number ?? d.numberFull ?? "",
        chamber: d.chamber ?? d.chamberLabel ?? "",
        date: d.decision_date ?? d.decisionDate ?? "",
        solution: d.solution ?? "",
        summary: summary.length > 280 ? summary.slice(0, 280) + "…" : summary,
        url: d.id
          ? `https://www.courdecassation.fr/decision/${d.id}`
          : `https://www.legifrance.gouv.fr/juri/search?tab_selection=juri&query=${encodeURIComponent(query)}`,
      };
    });

    return NextResponse.json({ ok: true, scenario, query, decisions });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), decisions: [] });
  }
}
