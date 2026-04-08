import { NextResponse } from "next/server";

// =====================================================
// FRANCE TRAVAIL API — Offres d'emploi proches
// Source : francetravail.io (ex Pôle Emploi)
// Gratuit avec inscription : https://francetravail.io/
// OAuth2 client_credentials
// Env vars : FRANCE_TRAVAIL_CLIENT_ID + FRANCE_TRAVAIL_CLIENT_SECRET
//
// Ciblé sur les profils OriZen :
//   - Contrats d'insertion (CDD, interim, saisonnier)
//   - Sans qualification requise (debutant_accepte=true)
//   - Proches géographiquement (rayon 20km)
//   - Missions locales + IAE (Insertion par l'Activité Économique)
// =====================================================

interface FTToken {
  access_token: string;
  expires_at: number;
}

// Cache token module-level
let ftToken: FTToken | null = null;

async function getFTToken(): Promise<string | null> {
  const clientId     = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // Token encore valide
  if (ftToken && ftToken.expires_at > Date.now() + 30_000) {
    return ftToken.access_token;
  }

  try {
    const res = await fetch(
      "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type:    "client_credentials",
          client_id:     clientId,
          client_secret: clientSecret,
          scope:         "api_offresdemploiv2 o2dsoffre",
        }),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    ftToken = {
      access_token: data.access_token,
      expires_at:   Date.now() + (data.expires_in ?? 1499) * 1000,
    };
    return ftToken.access_token;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat    = parseFloat(searchParams.get("lat")    ?? "48.8566");
  const lng    = parseFloat(searchParams.get("lng")    ?? "2.3522");
  const radius = parseInt(searchParams.get("radius")   ?? "20");   // km
  const profil = searchParams.get("profil") ?? "insertion";       // insertion | qualifie | saisonnier

  const token = await getFTToken();
  if (!token) {
    return NextResponse.json({
      ok: false,
      configured: false,
      offres: [],
      message: "Configurez FRANCE_TRAVAIL_CLIENT_ID + FRANCE_TRAVAIL_CLIENT_SECRET",
    });
  }

  try {
    const url = new URL(
      "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search"
    );

    // Paramètres communs
    url.searchParams.set("distance",    String(radius));
    url.searchParams.set("sort",        "2"); // Tri par distance
    url.searchParams.set("range",       "0-9"); // 10 résultats
    url.searchParams.set("longitude",   String(lng));
    url.searchParams.set("latitude",    String(lat));

    // Filtres selon profil
    if (profil === "insertion") {
      url.searchParams.set("debutantAccepte", "true");
      url.searchParams.set("typeContrat",     "CDD,MIS,SAI,CUI"); // CUI = Contrat Unique d'Insertion
    } else if (profil === "saisonnier") {
      url.searchParams.set("typeContrat", "SAI");
    } else {
      url.searchParams.set("typeContrat", "CDI,CDD");
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:        "application/json",
      },
      next: { revalidate: 1800 }, // Cache 30min
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 204) {
      // Aucune offre trouvée
      return NextResponse.json({ ok: true, offres: [], count: 0, profil });
    }

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `FT HTTP ${res.status}`, offres: [] });
    }

    const data = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offres = (data.resultats ?? []).slice(0, 8).map((o: any) => ({
      id:           o.id,
      titre:        o.intitule,
      entreprise:   o.entreprise?.nom ?? "Entreprise",
      lieu:         o.lieuTravail?.libelle ?? "",
      contrat:      o.typeContratLibelle ?? o.typeContrat,
      duree:        o.dureeTravailLibelle ?? "",
      salaire:      o.salaire?.libelle ?? null,
      debutant:     o.debutantAccepte ?? false,
      dateCreation: o.dateCreation,
      url:          `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
      competences:  (o.competences ?? []).slice(0, 3).map((c: {libelle: string}) => c.libelle),
      description:  (o.description ?? "").slice(0, 200) + ((o.description?.length ?? 0) > 200 ? "…" : ""),
    }));

    return NextResponse.json({
      ok:     true,
      count:  data.filtresPossibles?.[0]?.valeursPossibles?.[0]?.nb ?? offres.length,
      offres,
      profil,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), offres: [] });
  }
}
