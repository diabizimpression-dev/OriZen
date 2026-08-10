import { NextResponse } from "next/server";
import { getPisteToken } from "@/lib/piste";

// =====================================================
// LÉGIFRANCE API — Textes de loi officiels par scénario
// Source : DILA / api.piste.gouv.fr (gratuit, officiel)
// Doc : https://www.legifrance.gouv.fr/contenu/pied-de-page/open-data-et-api
// =====================================================

// Requêtes adaptées à chaque scénario OriZen
const SCENARIO_QUERIES: Record<string, { query: string; fond: string }> = {
  logement: {
    query: "hébergement urgence inconditionnel",
    fond: "CODE_DATE",
  },
  alimentation: {
    query: "aide alimentaire épicerie sociale banque",
    fond: "CODE_DATE",
  },
  sante: {
    query: "aide médicale état permanence accès soins",
    fond: "CODE_DATE",
  },
  urgence: {
    query: "protection victime danger ordonnance",
    fond: "CODE_DATE",
  },
  "sans-papiers": {
    query: "demande asile droit séjour étranger",
    fond: "CODE_DATE",
  },
  "mineur-isole": {
    query: "mineur non accompagné aide sociale enfance",
    fond: "CODE_DATE",
  },
  "violence-familiale": {
    query: "ordonnance protection violence conjugale victime",
    fond: "CODE_DATE",
  },
  "aide-financiere": {
    query: "revenu solidarité active RSA allocation",
    fond: "CODE_DATE",
  },
};

interface LegifranceResult {
  id: string;
  title: string;
  articleNum: string;
  text: string;
  nature: string;
  dateTexte: string | null;
  url: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = searchParams.get("scenario") ?? "logement";
  const { query, fond } = SCENARIO_QUERIES[scenario] ?? SCENARIO_QUERIES.logement;

  const token = await getPisteToken();

  // Si pas de token PISTE : retourne vide (pas d'erreur visible côté UI)
  if (!token) {
    return NextResponse.json({
      ok: false,
      configured: false,
      results: [] as LegifranceResult[],
    });
  }

  try {
    const res = await fetch(
      "https://api.piste.gouv.fr/dila/legifrance/lf-engine-app/search",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          recherche: {
            champs: [
              {
                typeChamp: "ALL",
                criteres: [
                  { typeRecherche: "EXACTE", valeur: query },
                ],
                operateur: "ET",
              },
            ],
            filtres: [],
            fromAdvancedRecherche: false,
            operateur: "ET",
            pageNumber: 1,
            pageSize: 4,
            sort: "PERTINENCE",
            typePagination: "ARTICLE",
          },
          fond,
        }),
        next: { revalidate: 3600 }, // Cache 1h
      }
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `HTTP ${res.status}`, results: [] });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: LegifranceResult[] = (data.results ?? []).slice(0, 4).map((r: any) => {
      const id = r.id ?? r.cid ?? "";
      const texte = r.texte ?? r.content ?? "";
      return {
        id,
        title: r.title ?? r.titre ?? r.num ?? "Article",
        articleNum: r.num ? `Art. ${r.num}` : "",
        text: texte.length > 220 ? texte.slice(0, 220) + "…" : texte,
        nature: r.nature ?? "Code",
        dateTexte: r.dateTexte ?? null,
        url: id
          ? `https://www.legifrance.gouv.fr/codes/article_lc/${id}`
          : `https://www.legifrance.gouv.fr/search/code?tab_selection=code&query=${encodeURIComponent(query)}`,
      };
    });

    return NextResponse.json({ ok: true, scenario, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), results: [] });
  }
}
