// ─── Parser opening_hours OSM ────────────────────────────────────────────────
// Calcule si une structure est ouverte maintenant depuis la string OSM
// Exemples : "Mo-Fr 09:00-18:00", "24/7", "Mo-Sa 08:30-12:00,14:00-19:00"
//
// Implémentation légère (pas de dépendance) — couvre ~90% des cas réels OSM

export interface OpeningStatus {
  isOpen: boolean | null;       // null = impossible à déterminer
  label: string;                // "Ouvert · ferme à 18h", "Fermé · ouvre lundi 9h"
  color: string;                // hex color
  nextEvent: string | null;     // "ferme dans 2h", "ouvre demain à 9h"
}

const DAY_MAP: Record<string, number> = {
  Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0,
  PH: -1, // Jours fériés — ignorés
};

const DAY_LABELS_FR: Record<number, string> = {
  0: "dimanche", 1: "lundi", 2: "mardi", 3: "mercredi",
  4: "jeudi", 5: "vendredi", 6: "samedi",
};

function parseTime(t: string): number {
  // "09:30" → minutes depuis minuit
  const [h, m] = t.trim().split(":").map(Number);
  return h * 60 + (m || 0);
}

function expandDayRange(range: string): number[] {
  // "Mo-Fr" → [1,2,3,4,5]  |  "Sa" → [6]  |  "Mo,We,Fr" → [1,3,5]
  const days: number[] = [];
  const parts = range.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-");
      const s = DAY_MAP[start.trim()];
      const e = DAY_MAP[end.trim()];
      if (s == null || e == null || s < 0 || e < 0) continue;
      // Gérer le wrap (Sa-Mo = [6,0,1])
      if (s <= e) {
        for (let d = s; d <= e; d++) days.push(d);
      } else {
        for (let d = s; d <= 6; d++) days.push(d);
        for (let d = 0; d <= e; d++) days.push(d);
      }
    } else {
      const d = DAY_MAP[part.trim()];
      if (d != null && d >= 0) days.push(d);
    }
  }
  return days;
}

interface TimeSlot {
  days: number[];
  slots: Array<[number, number]>; // [start_minutes, end_minutes]
}

function parseRule(rule: string): TimeSlot | null {
  // "Mo-Fr 09:00-18:00" | "Mo-Fr 09:00-12:00,14:00-18:00" | "24/7"
  rule = rule.trim();

  if (rule === "24/7" || rule === "open") {
    return {
      days: [0, 1, 2, 3, 4, 5, 6],
      slots: [[0, 24 * 60]],
    };
  }

  if (rule === "off" || rule === "closed") return null;

  // Séparer jours et heures
  const match = rule.match(/^([A-Z][a-z](?:[,-][A-Z][a-z])*)\s+(.+)$/);
  if (!match) return null;

  const [, daysPart, hoursPart] = match;
  const days = expandDayRange(daysPart);
  if (days.length === 0) return null;

  // Plusieurs créneaux séparés par ","
  const slots: Array<[number, number]> = [];
  for (const slot of hoursPart.split(",")) {
    const timeParts = slot.trim().split("-");
    if (timeParts.length === 2) {
      const start = parseTime(timeParts[0]);
      let end = parseTime(timeParts[1]);
      if (end === 0) end = 24 * 60; // "00:00" fin = minuit suivant
      slots.push([start, end]);
    }
  }

  return slots.length > 0 ? { days, slots } : null;
}

export function parseOpeningHours(raw: string | null | undefined): OpeningStatus {
  if (!raw) {
    return { isOpen: null, label: "Horaires non renseignés — appelez avant", color: "#64748b", nextEvent: null };
  }

  const cleaned = raw.trim();

  if (cleaned === "24/7" || cleaned === "open") {
    return { isOpen: true, label: "Ouvert 24h/24 · 7j/7", color: "#10B981", nextEvent: null };
  }

  if (cleaned === "closed" || cleaned === "off") {
    return { isOpen: false, label: "Fermé définitivement", color: "#EF4444", nextEvent: null };
  }

  const now = new Date();
  const currentDay = now.getDay();   // 0=dim, 1=lun…
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Parser les règles (séparées par ";")
  const rules: TimeSlot[] = [];
  for (const ruleStr of cleaned.split(";")) {
    const parsed = parseRule(ruleStr.trim());
    if (parsed) rules.push(parsed);
  }

  if (rules.length === 0) {
    return { isOpen: null, label: `Horaires : ${cleaned}`, color: "#64748b", nextEvent: null };
  }

  // Vérifier si ouvert maintenant
  for (const rule of rules) {
    if (!rule.days.includes(currentDay)) continue;
    for (const [start, end] of rule.slots) {
      if (currentMin >= start && currentMin < end) {
        const closeHour = Math.floor(end / 60);
        const closeMin = end % 60;
        const closeStr = `${closeHour}h${closeMin > 0 ? String(closeMin).padStart(2, "0") : ""}`;
        const minsLeft = end - currentMin;
        const nextEvent = minsLeft < 60
          ? `ferme dans ${minsLeft} min`
          : `ferme à ${closeStr}`;
        return {
          isOpen: true,
          label: `Ouvert · ferme à ${closeStr}`,
          color: "#10B981",
          nextEvent,
        };
      }
    }
  }

  // Chercher la prochaine ouverture (7 jours max)
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const checkDay = (currentDay + dayOffset) % 7;
    const checkMin = dayOffset === 0 ? currentMin : 0;

    for (const rule of rules) {
      if (!rule.days.includes(checkDay)) continue;
      for (const [start] of rule.slots) {
        if (dayOffset === 0 && start <= checkMin) continue; // Passé aujourd'hui
        const openHour = Math.floor(start / 60);
        const openMin = start % 60;
        const openStr = `${openHour}h${openMin > 0 ? String(openMin).padStart(2, "0") : ""}`;
        const dayLabel = dayOffset === 0
          ? "aujourd'hui"
          : dayOffset === 1
            ? "demain"
            : DAY_LABELS_FR[checkDay];

        return {
          isOpen: false,
          label: `Fermé · ouvre ${dayLabel} à ${openStr}`,
          color: "#F59E0B",
          nextEvent: `ouvre ${dayLabel} à ${openStr}`,
        };
      }
    }
  }

  return {
    isOpen: false,
    label: "Fermé cette semaine",
    color: "#EF4444",
    nextEvent: null,
  };
}

/** Formate la string brute pour affichage lisible */
export function formatOpeningHours(raw: string | null | undefined): string {
  if (!raw) return "Horaires non renseignés";
  if (raw === "24/7") return "24h/24 · 7j/7";

  // Remplacer les abréviations anglaises par du français
  return raw
    .replace(/Mo/g, "Lun")
    .replace(/Tu/g, "Mar")
    .replace(/We/g, "Mer")
    .replace(/Th/g, "Jeu")
    .replace(/Fr/g, "Ven")
    .replace(/Sa/g, "Sam")
    .replace(/Su/g, "Dim")
    .replace(/off/g, "fermé")
    .replace(/PH off/g, "Fermé jours fériés");
}
