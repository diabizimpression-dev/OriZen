import fs from "fs";

export function detectDomain(message) {
  const m = message.toLowerCase();
  if (m.includes("hébergement") || m.includes("dehors")) return "hebergement";
  if (m.includes("violence") || m.includes("danger")) return "violences";
  if (m.includes("préf") || m.includes("titre")) return "prefecture";
  if (m.includes("santé") || m.includes("pass") || m.includes("ame")) return "sante";
  return "autre";
}

export function logAnonymous(message) {
  const entry = {
    t: Date.now(),
    domain: detectDomain(message),
    len: message.length
  };

  fs.appendFileSync("logs/assistant.jsonl", JSON.stringify(entry) + "\n");
}
