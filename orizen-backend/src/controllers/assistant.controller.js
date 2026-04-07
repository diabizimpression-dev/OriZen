import { openai } from "../services/openai.js";
import { ORIZEN_SYSTEM_PROMPT } from "../services/promptOrizen.js";
import { logAnonymous } from "../services/analytics.js";
import { sanitizeInput } from "../utils/sanitize.js";

export const handleAssistantRequest = async (req, res) => {
  try {
    const userMessage = sanitizeInput(req.body.message || "");
    const history = req.body.history || [];

    if (!userMessage || userMessage.length < 2)
      return res.status(400).json({ error: "Message vide" });

    logAnonymous(userMessage);

    let contextStructures = "";
    if (req.body.location) {
      const { lat, lng } = req.body.location;
      try {
        const { apiSyncService } = await import("../services/apiSyncService.js");
        const structures = await apiSyncService.getStructures(lat, lng, 3000); // 3km radius
        
        if (structures && structures.length > 0) {
          contextStructures = "\n\nVoici des structures d'aide PROFESSIONNELLES (Data·inclusion/OSM) proches de l'utilisateur :\n" +
            structures.slice(0, 5).map(s => `- ${s.name} [Type: ${s.type}] (Source: ${s.source}). Tél: ${s.tel || 'N/A'}. Adresse: ${s.addr || s.address}. Accessibilité: ${s.accessibility || 'N/A'}`).join("\n");
        }
      } catch (e) {
        console.error("Erreur récupération structures via apiSyncService:", e.message);
      }
    }

    let contextServicePublic = "";
    const legalKeywords = ["droit", "démarche", "loi", "carte", "identit", "titre", "séjour", "passeport", "vol", "police", "plainte", "justice", "aide", "caf", "rsa", "apl", "emploi", "travail", "logement", "expulsion"];
    const isLegalQuery = legalKeywords.some(kw => userMessage.toLowerCase().includes(kw));

    if (isLegalQuery) {
      try {
        const { servicePublicApi } = await import("../services/servicePublicApi.js");
        const spResults = await servicePublicApi.searchDroits(userMessage);
        
        if (spResults && spResults.length > 0) {
          contextServicePublic = "\n\n📌 DONNÉES OFFICIELLES (SERVICE-PUBLIC.FR) : Tu DOIS utiliser ces informations pour répondre de manière fiable à l'utilisateur. Ne contredis jamais ces fiches et fournis les liens sources si pertinent :\n" + 
            spResults.map(r => `[Fiche] ${r.snippet}\nSource: ${r.url}`).join("\n\n");
        }
      } catch (e) {
        console.error("Erreur récupération Service-Public:", e.message);
      }
    }

    const messages = [
      { role: "system", content: ORIZEN_SYSTEM_PROMPT + contextStructures + contextServicePublic },
      ...history.slice(-10), // Garder les 10 derniers échanges
      { role: "user", content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 900,
      messages: messages
    });

    const aiResponse = completion.choices?.[0]?.message?.content || "Je n'ai pas compris.";
    
    let audioBase64 = null;
    try {
      const speech = await openai.audio.speech.create({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: aiResponse,
        format: "mp3"
      });
      audioBase64 = speech.base64;
    } catch (e) {
      audioBase64 = null;
    }

    res.json({
      reply: aiResponse,
      audio: audioBase64
    });

  } catch (err) {
    res.status(500).json({
      error: "Erreur interne assistant OriZen",
      details: err.message
    });
  }
};
