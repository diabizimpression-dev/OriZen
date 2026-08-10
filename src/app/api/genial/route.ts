import { NextResponse } from "next/server";
import OpenAI from "openai";

// =====================================================
// GENIAL API — Assistant juridique IA (Lefebvre Group)
// Endpoint : POST /message — Bearer token auth
// Doc : https://github.com/elseu/sdu-genial-documentation
//
// Fallback automatique → Groq (llama-3.1-8b) si non configuré
// Env vars :
//   GENIAL_API_URL    = URL de base ex: https://genial-api.lefebvre-dalloz.fr
//   GENIAL_API_KEY    = clé API (Bearer token)
//   GROQ_API_KEY      = déjà utilisé par /api/assistant (fallback)
// =====================================================

const SCENARIO_CONTEXT: Record<string, string> = {
  logement:
    "Droit au logement en France : hébergement d'urgence, DALO, 115, SAMU Social, CASF art. L345-2-2.",
  alimentation:
    "Aide alimentaire en France : banques alimentaires, Restos du Cœur, épiceries sociales, RSA.",
  sante:
    "Santé en France : AME (Aide Médicale État), PASS, PUMa, CSS, soins gratuits sans papiers.",
  urgence:
    "Urgences en France : protection immédiate, 15/17/18/112, ordonnance de protection, TGD.",
  "sans-papiers":
    "Droits des sans-papiers en France : demande d'asile, CESEDA, aide juridictionnelle, OFPRA.",
  "mineur-isole":
    "Mineurs non accompagnés (MNA) en France : ASE, 119, protection enfance, CASF.",
  "violence-familiale":
    "Violences conjugales en France : 3919, ordonnance de protection 6 jours, TGD, masecurite.fr.",
  "aide-financiere":
    "Aides financières en France : RSA, APL, CAF, CCAS, FSL, prime d'activité.",
};

const SYSTEM_PROMPT = `Tu es un assistant juridique spécialisé en droit social français.
RÈGLES : réponses courtes et précises · toujours citer le texte de loi applicable (article, code) ·
mentionner le numéro d'urgence si situation grave · ne jamais inventer de lois ·
FORMAT : Article applicable → Ce que ça signifie concrètement → Action à faire`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question: string = body.question ?? "";
  const scenario: string = body.scenario ?? "logement";

  if (!question.trim()) {
    return NextResponse.json({ ok: false, error: "Question vide" }, { status: 400 });
  }

  const scenarioContext = SCENARIO_CONTEXT[scenario] ?? "";
  const enrichedQuestion = scenarioContext
    ? `[Contexte : ${scenarioContext}]\n\nQuestion : ${question}`
    : question;

  // ── Tentative GenIA-L ──────────────────────────────────────────────────────
  const genialUrl = process.env.GENIAL_API_URL;
  const genialKey = process.env.GENIAL_API_KEY;

  if (genialUrl && genialKey) {
    try {
      const res = await fetch(`${genialUrl.replace(/\/$/, "")}/message`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${genialKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          // Format GenIA-L v4 (OpenAI-compatible)
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: enrichedQuestion },
          ],
          // Champs alternatifs selon version de l'API
          message: enrichedQuestion,
          context: scenarioContext,
          stream: false,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const data = await res.json();
        // Normalisation de la réponse (plusieurs formats possibles selon version)
        const answer =
          data.content ??
          data.message ??
          data.response ??
          data.choices?.[0]?.message?.content ??
          data.text ??
          "";

        if (answer) {
          return NextResponse.json({
            ok: true,
            answer,
            source: "genial",
            scenario,
          });
        }
      }
    } catch {
      // Fallback Groq si GenIA-L timeout ou erreur
    }
  }

  // ── Fallback Groq (llama-3.1-8b) ──────────────────────────────────────────
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json({
      ok: false,
      error: "Aucun service IA configuré. Ajoutez GENIAL_API_KEY ou GROQ_API_KEY.",
      source: "none",
    });
  }

  const client = new OpenAI({
    apiKey: groqKey,
    baseURL: "https://api.groq.com/openai/v1",
  });

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.1,
    max_tokens: 350,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: enrichedQuestion },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? "";

  return NextResponse.json({
    ok: true,
    answer,
    source: "groq",
    scenario,
  });
}
