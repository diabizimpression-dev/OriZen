// OriZen — Bibliothèque centralisée des 8 scénarios
// Chaque scénario définit : tags Overpass, script d'appel, documents, numéros urgence

export interface Scenario {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  urgence_number: string;
  urgence_label: string;
  tags_overpass: string[];        // Plusieurs tags pour maximiser les résultats
  action_script: string;          // Ce que l'utilisateur doit dire à l'arrivée
  documents: string[];            // Documents à apporter
  droits: string[];               // Droits légaux applicables
  contacts_nationaux: { label: string; number: string; desc: string }[];
}

export const SCENARIOS: Record<string, Scenario> = {
  logement: {
    id: "logement",
    label: "Dormir",
    sublabel: "Hébergement d'urgence",
    color: "#6366F1",
    urgence_number: "115",
    urgence_label: "SAMU Social",
    tags_overpass: [
      '"social_facility"="shelter"',
      '"social_facility"="housing"',
      '"amenity"="shelter"',
    ],
    action_script: "Dites : « J'ai besoin d'un hébergement d'urgence pour ce soir »",
    documents: [
      "Pièce d'identité si disponible (pas obligatoire pour le 115)",
      "Pas de documents requis en urgence",
    ],
    droits: [
      "Droit à l'hébergement d'urgence inconditionnel (CASF art. L345-2-2)",
      "Le 115 ne peut pas vous refuser à cause de votre nationalité",
      "Droit au Logement Opposable (DALO) si situation durable",
    ],
    contacts_nationaux: [
      { label: "SAMU Social", number: "115", desc: "Gratuit, 24h/24, hébergement d'urgence" },
      { label: "SOS Amitié", number: "09 72 39 40 50", desc: "Soutien psychologique" },
    ],
  },

  alimentation: {
    id: "alimentation",
    label: "Manger",
    sublabel: "Distribution alimentaire",
    color: "#10B981",
    urgence_number: "115",
    urgence_label: "SAMU Social (signale aussi la faim)",
    tags_overpass: [
      '"social_facility"="food_bank"',
      '"amenity"="food_bank"',
      '"social_facility"="soup_kitchen"',
    ],
    action_script: "Dites : « Je cherche une distribution alimentaire, je suis dans le besoin »",
    documents: [
      "Justificatif de domicile (optionnel selon structure)",
      "Quotient familial CAF si disponible (réduit les délais)",
    ],
    droits: [
      "Accès à l'aide alimentaire sans conditions de nationalité",
      "Les épiceries sociales pratiquent des tarifs réduits (jusqu'à -80%)",
      "RSA inclut une aide pour l'alimentation",
    ],
    contacts_nationaux: [
      { label: "Restos du Cœur", number: "0800 130 000", desc: "Gratuit, distribution alimentaire" },
      { label: "Banque Alimentaire", number: "01 41 62 50 00", desc: "Réseau national" },
      { label: "Croix-Rouge", number: "0800 858 858", desc: "Aide d'urgence" },
    ],
  },

  sante: {
    id: "sante",
    label: "Se soigner",
    sublabel: "Santé & soins gratuits",
    color: "#F59E0B",
    urgence_number: "15",
    urgence_label: "SAMU",
    tags_overpass: [
      '"healthcare"~"."',
      '"amenity"="clinic"',
      '"amenity"="hospital"',
      '"social_facility"="healthcare"',
    ],
    action_script: "Dites : « Je cherche la PASS (Permanence d'Accès aux Soins) »",
    documents: [
      "Pas de carte vitale obligatoire à la PASS",
      "Pièce d'identité si disponible",
    ],
    droits: [
      "Aide Médicale d'État (AME) pour les sans-papiers après 3 mois en France",
      "Protection Universelle Maladie (PUMa) pour les résidents légaux",
      "PASS dans chaque hôpital public : soins gratuits sans dossier",
      "CMU-C / CSS (ex-CMU) : complémentaire santé gratuite sous conditions",
    ],
    contacts_nationaux: [
      { label: "SAMU", number: "15", desc: "Urgence médicale" },
      { label: "Médecins du Monde", number: "01 44 92 15 15", desc: "Soins gratuits sans papiers" },
      { label: "SAMU Social", number: "115", desc: "Oriente vers soins d'urgence" },
    ],
  },

  urgence: {
    id: "urgence",
    label: "Danger",
    sublabel: "Situation d'urgence immédiate",
    color: "#EF4444",
    urgence_number: "17",
    urgence_label: "Police Secours",
    tags_overpass: [
      '"amenity"="police"',
      '"amenity"="hospital"',
      '"emergency"~"."',
    ],
    action_script: "Appelez le 17 (police), 15 (SAMU) ou 18 (pompiers) IMMÉDIATEMENT",
    documents: [],
    droits: [
      "Droit à la protection immédiate sans condition",
      "Ordonnance de protection possible en 6 jours (violences conjugales)",
      "Téléphone Grave Danger (TGD) pour les victimes de violences",
    ],
    contacts_nationaux: [
      { label: "Police", number: "17", desc: "Urgence sécurité" },
      { label: "SAMU", number: "15", desc: "Urgence médicale" },
      { label: "Pompiers", number: "18", desc: "Urgence incendie/accident" },
      { label: "Numéro unique", number: "112", desc: "Toutes urgences" },
      { label: "SMS urgence (sourds)", number: "114", desc: "SMS si vous ne pouvez pas parler" },
    ],
  },

  "sans-papiers": {
    id: "sans-papiers",
    label: "Papiers",
    sublabel: "Aide administrative & juridique",
    color: "#8B5CF6",
    urgence_number: "3114",
    urgence_label: "Numéro National de Prévention du Suicide",
    tags_overpass: [
      '"office"="association"',
      '"social_facility"="advice"',
      '"amenity"="townhall"',
    ],
    action_script: "Dites : « J'ai besoin d'une aide juridique pour ma situation administrative »",
    documents: [
      "Tout document prouvant votre présence en France (billets, photos, attestations)",
      "Passeport ou document d'identité du pays d'origine si disponible",
      "Preuves de liens en France (famille, logement, travail)",
    ],
    droits: [
      "Droit de déposer une demande d'asile dès l'arrivée en France",
      "Hébergement d'urgence garanti pendant l'instruction de la demande d'asile",
      "Aide juridictionnelle gratuite pour les procédures d'asile",
      "AME (Aide Médicale d'État) après 3 mois de présence",
    ],
    contacts_nationaux: [
      { label: "OFPRA", number: "01 58 68 10 10", desc: "Demande d'asile" },
      { label: "France Terre d'Asile", number: "01 53 04 39 99", desc: "Accompagnement réfugiés" },
      { label: "Gisti", number: "01 43 14 84 84", desc: "Aide juridique migrants" },
    ],
  },

  "mineur-isole": {
    id: "mineur-isole",
    label: "Mineur isolé",
    sublabel: "MNA — Protection enfance",
    color: "#EC4899",
    urgence_number: "119",
    urgence_label: "Allô Enfance en Danger",
    tags_overpass: [
      '"social_facility"="juvenile_center"',
      '"social_facility"="shelter"',
      '"amenity"="social_facility"',
    ],
    action_script: "Dites : « Je suis mineur, je suis seul, j'ai besoin d'une mise à l'abri »",
    documents: [
      "Tout document prouvant votre âge (acte de naissance, passeport)",
      "Si aucun document : une évaluation sera faite par les services sociaux",
    ],
    droits: [
      "Tout mineur isolé étranger a droit à la protection de l'Aide Sociale à l'Enfance (ASE)",
      "Hébergement immédiat obligatoire pendant l'évaluation (5 jours minimum)",
      "Si reconnu MNA : prise en charge jusqu'à 18 ans (21 ans avec contrat jeune majeur)",
      "Scolarisation obligatoire peu importe la situation administrative",
    ],
    contacts_nationaux: [
      { label: "Allô Enfance en Danger", number: "119", desc: "Gratuit, 24h/24" },
      { label: "SAMU Social", number: "115", desc: "Mise à l'abri d'urgence" },
      { label: "Croix-Rouge MNA", number: "01 44 43 11 00", desc: "Accompagnement MNA" },
    ],
  },

  "violence-familiale": {
    id: "violence-familiale",
    label: "Violence",
    sublabel: "Violences conjugales & familiales",
    color: "#F97316",
    urgence_number: "3919",
    urgence_label: "Violences Femmes Info",
    tags_overpass: [
      '"social_facility"="shelter"',
      '"social_facility"="refuge"',
      '"amenity"="police"',
    ],
    action_script: "Dites : « Je fuis une situation de violence, j'ai besoin d'une mise à l'abri »",
    documents: [
      "Pièce d'identité si disponible (pas obligatoire)",
      "Médicaments essentiels",
      "Documents importants (actes de naissance enfants, livret famille)",
    ],
    droits: [
      "Hébergement d'urgence garanti pour les victimes de violence",
      "Ordonnance de protection en 6 jours (éloignement du conjoint violent)",
      "Téléphone Grave Danger (TGD) pour les cas les plus sérieux",
      "Dépôt de plainte possible sans quitter le foyer (en ligne sur masecurite.fr)",
    ],
    contacts_nationaux: [
      { label: "Violences Femmes Info", number: "3919", desc: "Gratuit, anonyme, 24h/24" },
      { label: "Police", number: "17", desc: "Urgence sécurité immédiate" },
      { label: "SMS urgence", number: "114", desc: "Si vous ne pouvez pas parler" },
    ],
  },

  "aide-financiere": {
    id: "aide-financiere",
    label: "Aide financière",
    sublabel: "RSA, APL, aides d'urgence",
    color: "#06B6D4",
    urgence_number: "3960",
    urgence_label: "Info Droits Sociaux",
    tags_overpass: [
      '"office"="government"',
      '"amenity"="townhall"',
      '"social_facility"="advice"',
    ],
    action_script: "Dites : « Je souhaite faire une demande d'aide d'urgence »",
    documents: [
      "Pièce d'identité",
      "Justificatif de domicile (facture, attestation d'hébergement)",
      "RIB pour les virements",
      "Dernier avis d'imposition si disponible",
    ],
    droits: [
      "RSA : 607€/mois pour une personne seule (au 1er avril 2024)",
      "APL : aide au logement, demande sur caf.fr",
      "Aide d'urgence CCAS : versée en 48h par votre mairie",
      "Fonds de solidarité logement (FSL) : aide pour la caution ou les dettes de loyer",
      "Prime d'activité pour les travailleurs à bas revenus",
    ],
    contacts_nationaux: [
      { label: "CAF", number: "3230", desc: "Allocations familiales, APL, RSA" },
      { label: "CCAS de votre mairie", number: "Mairie", desc: "Aide d'urgence locale" },
      { label: "Banque de France", number: "3414", desc: "Surendettement, gratuit" },
    ],
  },
};

// Liste ordonnée pour l'affichage
export const SCENARIO_LIST = [
  SCENARIOS["logement"],
  SCENARIOS["alimentation"],
  SCENARIOS["sante"],
  SCENARIOS["urgence"],
  SCENARIOS["sans-papiers"],
  SCENARIOS["mineur-isole"],
  SCENARIOS["violence-familiale"],
  SCENARIOS["aide-financiere"],
];

// Mapping besoin URL → scenario id
export const BESOIN_TO_SCENARIO: Record<string, string> = {
  logement: "logement",
  alimentation: "alimentation",
  sante: "sante",
  urgence: "urgence",
  "sans-papiers": "sans-papiers",
  "mineur-isole": "mineur-isole",
  violence: "violence-familiale",
  finance: "aide-financiere",
};
