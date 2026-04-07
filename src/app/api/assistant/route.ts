import { NextResponse } from "next/server";
import OpenAI from "openai";

// =====================================================
// OriZen Assistant — Groq (llama-3.1-8b-instant)
// System prompt complet + contexte géo
// =====================================================

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "missing-key",
  baseURL: "https://api.groq.com/openai/v1",
});

const ORIZEN_SYSTEM_PROMPT = `Tu es OriZen, un assistant de crise pour personnes en difficulté en France.

RÈGLES ABSOLUES :
1. Réponds TOUJOURS en moins de 4 phrases courtes
2. JAMAIS de blabla, introduction ou "je comprends votre situation"
3. TOUJOURS terminer par une action concrète : numéro à appeler, adresse à aller, phrase à dire
4. Si DANGER IMMÉDIAT → donne le 15 (SAMU), 17 (Police) ou 18 (Pompiers) EN PREMIER
5. Ne jamais inventer une loi, un droit ou une structure qui n'existe pas
6. Si tu n'es pas sûr → dis-le et oriente vers le 115 ou une mairie

SCÉNARIOS ET RÉPONSES DIRECTES :
- Sans logement ce soir → SAMU Social **115** (gratuit, 24h/24, aucun document requis)
- Sans nourriture → Restos du Cœur (0800 130 000) ou Croix-Rouge (0800 858 858)
- Urgence médicale → **15** (SAMU) ou urgences hôpital le plus proche
- Violence / danger → **17** (Police) ou **3919** (violences conjugales, 24h/24)
- Mineur isolé → **119** (Allô Enfance en Danger, gratuit 24h/24)
- Sans papiers / asile → OFPRA (01 58 68 10 10) ou France Terre d'Asile
- Problème admin / droits → Mission Locale (jeunes < 26 ans) ou CCAS de la mairie
- Soins sans sécu → PASS à l'hôpital public (gratuit, sans carte vitale)
- Surendettement → Banque de France **3414** (gratuit)
- Aide financière urgente → CCAS de la mairie (aide en 48h possible)

LANGUE : Détecte automatiquement la langue (fr/ar/en/es) et réponds dans la même langue.

FORMAT obligatoire :
**Situation** : [1 phrase résumant le problème]
**Action** : [Ce que la personne doit faire MAINTENANT]
**Contact** : [Numéro ou adresse concrète]`;

// Fetch structures géolocalisées pour enrichir le contexte
async function getStructuresContext(lat: number, lng: number, type: string): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/structures?lat=${lat}&lng=${lng}&type=${type}&radius=3000`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (!data.ok || !data.structures?.length) return "";

    const list = data.structures
      .slice(0, 3)
      .map((s: { name: string; addr: string; phone: string; open: string; distance_m: number }) =>
        `- ${s.name} · ${s.addr} · ${s.phone} · ${s.open} (${Math.round(s.distance_m / 100) / 10}km)`
      )
      .join("\n");

    return `\n\nSTRUCTURES PROCHES DE L'UTILISATEUR (utilise ces données en priorité) :\n${list}`;
  } catch {
    return "";
  }
}

// Détection de scénario depuis le message
function detectScenario(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("dormir") || lower.includes("logement") || lower.includes("hébergement") || lower.includes("rue") || lower.includes("sdf")) return "logement";
  if (lower.includes("manger") || lower.includes("faim") || lower.includes("nourriture") || lower.includes("alimentaire")) return "alimentation";
  if (lower.includes("soigner") || lower.includes("médecin") || lower.includes("santé") || lower.includes("malade") || lower.includes("soin")) return "sante";
  if (lower.includes("danger") || lower.includes("violence") || lower.includes("agression") || lower.includes("peur") || lower.includes("menace")) return "urgence";
  if (lower.includes("papier") || lower.includes("titre") || lower.includes("séjour") || lower.includes("asile") || lower.includes("étranger")) return "sans-papiers";
  return "tous";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message: string = (body.message || "").trim();
    const history: { role: string; content: string }[] = body.history || [];
    const location: { lat: number; lng: number } | null = body.location || null;

    if (!message || message.length < 2) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    // Contexte géo si localisation disponible
    let geoContext = "";
    if (location?.lat && location?.lng) {
      const scenario = detectScenario(message);
      geoContext = await getStructuresContext(location.lat, location.lng, scenario);
    }

    const systemContent = ORIZEN_SYSTEM_PROMPT + geoContext;

    const messages = [
      { role: "system" as const, content: systemContent },
      ...history.slice(-8).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.2,   // Bas pour des réponses cohérentes et factuelles
      max_tokens: 400,    // Forcément court
      messages,
    });

    const reply = completion.choices[0]?.message?.content || "Je n'ai pas compris. Appelez le 115 pour une aide immédiate.";

    return NextResponse.json({ reply, ok: true });
  } catch (err: unknown) {
    console.error("[/api/assistant] Error:", err);
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json(
      { error: message, reply: "Une erreur est survenue. En cas d'urgence, appelez le 15 (SAMU) ou le 115 (SAMU Social)." },
      { status: 500 }
    );
  }
}
