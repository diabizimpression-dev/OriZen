const EMERGENCY_KEYWORDS_FR = [
  "suicide",
  "je veux mourir",
  "me tuer",
  "mise en danger",
  "violence",
  "il me frappe",
  "viol",
  "abus",
  "agression",
  "je dors dehors",
  "à la rue",
  "danger immédiat"
];

export function detectEmergencyLevel(text) {
  const t = (text || "").toLowerCase();
  return {
    isCritical: EMERGENCY_KEYWORDS_FR.some(k => t.includes(k))
  };
}
