// ─── Calcul Aide Juridictionnelle ────────────────────────────────────────────
// Barème officiel 2024 : décret n°2020-1717 du 28 décembre 2020 mis à jour
// Source officielle : service-public.fr/particuliers/vosdroits/F18074
//
// L'aide juridictionnelle (AJ) permet de faire prendre en charge tout ou partie
// des frais d'avocat et de procédure par l'État.
//
// POST /api/aide-juridictionnelle
// Body: { revenu_mensuel: number, nb_personnes: number, situation?: string }

import { NextRequest, NextResponse } from "next/server";

// ─── Barème 2024 (mis à jour chaque année par décret) ───────────────────────
// Plafonds mensuels de ressources (nets avant impôt, hors prestations sociales)
// Source : aide-juridictionnelle.justice.fr (dernière mise à jour jan 2024)

const AJ_TOTALE_BASE = 1112;    // Revenu mensuel max pour AJ totale (1 pers.)
const AJ_PARTIELLE_BASE = 1667; // Revenu mensuel max pour AJ partielle (1 pers.)

// Majoration par personne supplémentaire à charge (conjoint, enfant, etc.)
const MAJORATION_PAR_PERSONNE = 134; // €/mois

// Taux de prise en charge selon le niveau d'aide
type AJLevel = "totale" | "partielle_55" | "partielle_25" | "refus";

interface AJResult {
  eligible: boolean;
  level: AJLevel;
  label: string;
  taux_prise_en_charge: number; // 0, 25, 55, ou 100
  plafond_applicable: number;
  revenu_retenu: number;
  description: string;
  droits: string[];
  demarche: string;
  documents_requis: string[];
  contacts: Array<{ nom: string; url: string; tel?: string }>;
}

function calculerAJ(revenu: number, nbPersonnes: number): AJResult {
  // Majoration selon les personnes à charge (au-delà de la personne principale)
  const nbCharge = Math.max(0, nbPersonnes - 1);
  const majorationTotale = MAJORATION_PAR_PERSONNE * nbCharge;

  const plafondTotal = AJ_TOTALE_BASE + majorationTotale;
  const plafondPartiel = AJ_PARTIELLE_BASE + majorationTotale;

  let level: AJLevel;
  let taux: number;
  let label: string;
  let description: string;

  if (revenu <= plafondTotal) {
    level = "totale";
    taux = 100;
    label = "Aide Juridictionnelle TOTALE";
    description = `Vos ressources (${revenu}€/mois) sont inférieures au plafond de ${plafondTotal}€. L'État prend en charge 100% des frais d'avocat et de procédure.`;
  } else if (revenu <= plafondTotal * 1.25) {
    level = "partielle_55";
    taux = 55;
    label = "Aide Juridictionnelle partielle (55%)";
    description = `Vos ressources (${revenu}€/mois) permettent une aide partielle. L'État prend en charge 55% des frais, vous payez le reste.`;
  } else if (revenu <= plafondPartiel) {
    level = "partielle_25";
    taux = 25;
    label = "Aide Juridictionnelle partielle (25%)";
    description = `Vos ressources (${revenu}€/mois) permettent une aide réduite. L'État prend en charge 25% des frais.`;
  } else {
    level = "refus";
    taux = 0;
    label = "Hors plafond — AJ non accordée";
    description = `Vos ressources (${revenu}€/mois) dépassent le plafond de ${plafondPartiel}€ pour ${nbPersonnes} personne(s). Mais d'autres aides existent.`;
  }

  const droits = level !== "refus" ? [
    "Avocat désigné par le Barreau — frais pris en charge",
    "Frais d'huissier, d'expertise, de traduction couverts",
    "Applicable pour : divorce, garde d'enfants, loyers impayés, droits sociaux, procédure pénale",
    "Valable pour les étrangers en situation irrégulière pour certaines procédures",
    ...(level === "totale" ? ["Consultation juridique gratuite préalable possible"] : []),
  ] : [
    "Consultation juridique gratuite dans les Maisons de Justice et du Droit (MJD)",
    "Consultation au Barreau local (permanence gratuite 1h)",
    "Protection juridique via l'assurance habitation ou automobile",
    "Aide de la CAF pour certains litiges familiaux",
  ];

  const documentsRequis = [
    "Formulaire Cerfa n°15626 (téléchargeable sur service-public.fr)",
    "Pièce d'identité ou titre de séjour",
    "Avis d'imposition ou de non-imposition (N-1)",
    "Justificatifs de revenus des 3 derniers mois",
    "Justificatifs de charges (loyer, pension alimentaire…)",
    ...(nbPersonnes > 1 ? ["Justificatifs des personnes à charge (livret de famille, etc.)"] : []),
    "Convocation ou acte de procédure si disponible",
  ];

  return {
    eligible: level !== "refus",
    level,
    label,
    taux_prise_en_charge: taux,
    plafond_applicable: level === "totale" ? plafondTotal : plafondPartiel,
    revenu_retenu: revenu,
    description,
    droits,
    demarche: level !== "refus"
      ? "1. Remplir le formulaire Cerfa n°15626 sur aide-juridictionnelle.justice.fr · 2. Déposer au greffe du Tribunal Judiciaire · 3. Délai de réponse : 1 à 2 mois · 4. Un avocat vous sera désigné si besoin"
      : "Rendez-vous dans une Maison de Justice et du Droit (MJD) ou au Point d'Accès au Droit (PAD) le plus proche pour une consultation gratuite.",
    documents_requis: documentsRequis,
    contacts: [
      {
        nom: "Demande en ligne — aide-juridictionnelle.justice.fr",
        url: "https://www.aide-juridictionnelle.justice.fr/",
      },
      {
        nom: "Infos officielles — service-public.fr",
        url: "https://www.service-public.fr/particuliers/vosdroits/F18074",
      },
      {
        nom: "Annuaire des Maisons de Justice (MJD)",
        url: "https://www.justice.fr/recherche-professionnels",
      },
      {
        nom: "Barreau local — consultation gratuite",
        url: "https://www.cnb.avocat.fr/fr/trouver-un-barreau",
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const revenu = parseFloat(body.revenu_mensuel ?? 0);
    const nbPersonnes = parseInt(body.nb_personnes ?? 1);

    if (isNaN(revenu) || revenu < 0) {
      return NextResponse.json({ error: "revenu_mensuel invalide" }, { status: 400 });
    }
    if (isNaN(nbPersonnes) || nbPersonnes < 1 || nbPersonnes > 10) {
      return NextResponse.json({ error: "nb_personnes invalide (1-10)" }, { status: 400 });
    }

    const result = calculerAJ(revenu, nbPersonnes);

    return NextResponse.json({
      ok: true,
      ...result,
      bareme: "2024",
      source: "service-public.fr/particuliers/vosdroits/F18074",
    });
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  // Mode rapide via GET params pour les tests
  const revenu = parseFloat(req.nextUrl.searchParams.get("revenu") ?? "0");
  const nbPersonnes = parseInt(req.nextUrl.searchParams.get("nb_personnes") ?? "1");

  const result = calculerAJ(revenu || 0, nbPersonnes || 1);
  return NextResponse.json({ ok: true, ...result, bareme: "2024" });
}
