# CHANGELOG — OriZen

## [2025-04-07] — Refacto complète P0/P1

### Nouveau
- `src/lib/scenarios.ts` — 8 scénarios centralisés (tags Overpass, scripts, documents, contacts, droits)
- `src/app/droits/page.tsx` — Annuaire droits par scénario (accordéon, contacts cliquables, CTA carte)
- `CLAUDE.md` — Contexte projet complet pour Claude Code

### Modifié

#### `src/app/api/structures/route.ts` — CRITIQUE
- **Avant** : données 100% hardcodées avec coordonnées simulées par offset GPS
- **Après** : appel réel Overpass API (OpenStreetMap), fallback curated si API down
- Ajout champs : `verified_at`, `reliability_score`, `distance_m`, `action_script`, `documents`, `source`
- Calcul distance Haversine côté serveur

#### `src/app/api/assistant/route.ts` — CRITIQUE
- **Avant** : system prompt générique "helpful coding and social aid assistant"
- **Après** : system prompt OriZen complet (8 scénarios, règles absolues, format Situation/Action/Contact)
- Ajout : détection automatique du scénario + injection contexte géo (structures proches)
- Température réduite à 0.2, max_tokens 400 (réponses forcément courtes)

#### `src/app/assistant/page.tsx` — P1
- **Avant** : AgentChat générique (chat libre, friction maximale)
- **Après** : 5 boutons de situation → envoi auto → réponse courte + bouton action
- Ajout : géolocalisation silencieuse, vocal conditionnel (speechSynthesis), formatage numéros cliquables
- Chat libre disponible via "Autre situation" ou après première réponse

#### `src/components/Map.tsx` — P1
- **Avant** : popup simple (nom, adresse, téléphone)
- **Après** : popup enrichi avec score fiabilité, badge source OSM/fallback, documents à apporter,
  script d'action, bouton itinéraire Google Maps, bouton signalement

#### `src/app/page.tsx` — P2
- Bouton urgence déplacé EN PREMIER (rouge plein, ombre rouge)
- Modale SOS avec 4 numéros d'urgence cliquables (remplace la barre discrète en haut)
- Liens "Vos droits" et "Assistant" ajoutés en bas
