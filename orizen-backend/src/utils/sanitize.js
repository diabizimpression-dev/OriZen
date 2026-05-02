// Nettoyage basique pour éviter spam, injections, caractères dangereux

export function sanitizeInput(text = "") {
  if (!text) return "";

  return text
    .replace(/<script.*?>.*?<\/script>/gi, "")   // supprime scripts
    .replace(/<\/?[^>]+(>|$)/g, "")              // supprime HTML
    .replace(/[\u0000-\u0019]+/g, " ")           // supprime caractères non imprimables
    .trim();
}
