# ORIZEN — CLAUDE.md

## Codebase existante
Projet partiellement construit. Avant toute action :
1. `find . -type f | head -60` — cartographier la structure
2. Lire les fichiers clés (index.html, app.js, package.json, etc.)
3. NE PAS réécrire ce qui existe — étendre et corriger uniquement
4. Identifier les écarts avec l'architecture cible ci-dessus
5. Proposer un delta (ce qui manque) avant de coder

## Règle critique
Ne jamais supprimer du code existant sans confirmation explicite.
Toujours commenter les changements majeurs dans un CHANGELOG.md.

---

## Projet
GPS des droits et aides sociales en France. Web-app PWA mobile-first qui transforme
une situation décrite en plan d'action concret + structures géolocalisées.
Public : mineurs non accompagnés (MNA), jeunes étrangers 18–25 ans, personnes précaires.
Modèle : anonyme par défaut, associatif/entrepreneurial.

## Stack actuelle
- **Frontend** : Next.js 15 · React 19 · TypeScript · Tailwind CSS
- **IA** : Groq API (llama-3.1-8b-instant) via openai SDK compatible
- **Géo** : Leaflet + OpenStreetMap + Overpass API (réel, pas de mock)
- **Animations** : framer-motion
- **Icons** : lucide-react

## Architecture 4 couches
1. Analyse IA → JSON structuré {age, situation, urgence, priorite}
2. Moteur de règles → sélection scénario (lib/scenarios.ts)
3. Recherche géo → structures proches via Overpass API (api/structures/route.ts)
4. IA → génère plan court et actionnable (jamais de décision libre)

## Structure des fichiers
```
src/
├── app/
│   ├── page.tsx              ← Accueil : urgence bouton rouge + grid 2x2
│   ├── carte/page.tsx        ← Carte wrapper (dynamic import Leaflet)
│   ├── assistant/page.tsx    ← Chat : boutons situations → chat conditionnel
│   ├── droits/page.tsx       ← Annuaire droits par scénario (accordéon)
│   ├── vault/page.tsx        ← [À créer] Documents sécurisés
│   ├── api/
│   │   ├── structures/route.ts  ← Overpass API + fallback curated
│   │   └── assistant/route.ts   ← Groq llama-3.1-8b + system prompt OriZen
├── components/
│   ├── Map.tsx               ← Leaflet + popup enrichi (fiabilité, docs, script, itinéraire)
│   ├── ActionCard.tsx        ← Composant card réutilisable
│   ├── EmergencyBar.tsx      ← Barre urgence
│   └── InfoCard.tsx          ← Card info
├── lib/
│   ├── scenarios.ts          ← 8 scénarios : tags Overpass, scripts, documents, contacts
│   └── agent.ts              ← SDK 21st — NE PAS MODIFIER
```

## 8 scénarios prioritaires
```
logement | alimentation | sante | urgence |
sans-papiers | mineur-isole | violence-familiale | aide-financiere
```
Chaque scénario est défini dans `src/lib/scenarios.ts` avec :
- `tags_overpass[]` : requêtes Overpass pour trouver les structures
- `action_script` : phrase à dire à l'arrivée
- `documents[]` : ce qu'il faut apporter
- `droits[]` : droits légaux applicables
- `contacts_nationaux[]` : numéros d'urgence nationaux

## System Prompt OriZen (dans api/assistant/route.ts)
```
Tu es OriZen, un assistant de crise pour personnes en difficulté en France.
RÈGLES : réponse < 4 phrases · pas de blabla · toujours une action concrète ·
danger immédiat → 15/17/18 en premier · ne pas inventer de lois/structures
LANGUE : auto-detect fr/ar/en/es
FORMAT : Situation / Action / Contact
```

## Variables d'environnement
```env
GROQ_API_KEY=           # Groq API (llama-3.1-8b-instant) — REQUIS
NEXT_PUBLIC_APP_URL=    # URL de production (ex: https://orizen.vercel.app)
```

## Design system
- **Fond** : `bg-[#020617]` (presque noir)
- **Logement** : `#6366F1` (indigo)
- **Alimentation** : `#10B981` (vert)
- **Santé** : `#F59E0B` (amber)
- **Urgence** : `#EF4444` (rouge)
- **Assistant** : `#8B5CF6` (violet)
- **Coins** : `rounded-2xl` (cartes principales), `rounded-xl` (éléments secondaires)
- **Bordures** : `border-slate-700` ou couleur thématique à 30–40% opacité
- **Backdrop blur** : sur tous les headers superposés à la carte

## Fonctions critiques
- **Géolocalisation** : au chargement (silencieuse, fallback Paris si refus)
- **Bouton urgence** : rouge plein, EN PREMIER sur la page d'accueil → modale SOS
- **Vocal** : OFF par défaut · `speechSynthesis` au clic uniquement (bouton micro)
- **Quick Exit** : [À implémenter] → redirection site neutre + sessionStorage clear
- **Plan partageable** : [À implémenter] → lien /plan/:id (POST backend)
- **Mode discret** : [À implémenter] → UI ressemble à site banal

## Fichiers à NE PAS TOUCHER
- `src/lib/agent.ts` et `src/app/api/agent-token/route.ts` — liés au SDK 21st
- `src/app/layout.tsx` — ok tel quel
- `src/app/static-tailwind.css` — généré automatiquement (`npm run build:css`)
- `tailwind.config.js`, `postcss.config.js`, `tsconfig.json`

## Priorités restantes (V2)
1. **Quick Exit** — bouton discret + cache vidé
2. **Mode discret** — toggle UI neutre
3. **Plan partageable** — `/plan/:id` + POST backend
4. **vault/page.tsx** — Documents sécurisés (session only)
5. **Multilangue** — i18n fr/ar/en/es
6. **PWA manifest** — offline-first pour les numéros d'urgence

## Tests rapides
```bash
# Structures réelles depuis Overpass :
curl "http://localhost:3000/api/structures?lat=48.8566&lng=2.3522&type=logement"
# → structures avec verified_at, reliability_score, distance_m

# Assistant court et actionnable :
curl -X POST http://localhost:3000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"message":"je suis sans abri ce soir","history":[]}'
# → réponse < 100 mots avec numéro à appeler
```

## Vision
V1 assistant + annuaire → V2 plan automatisé → V3 géo + carte → V4 plateforme nationale
Objectif : 1 000 utilisateurs/mois pour valider, puis partenariats missions locales/associations.
