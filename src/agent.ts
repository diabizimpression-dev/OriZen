import { agent, tool } from "@21st-sdk/agent";
import { z } from "zod";

export default agent({
  model: "claude-sonnet-4-6",
  systemPrompt: `You are OriZen Assistant, a premium, high-integrity AI for social aid.
  Direct, empathetic, and reliable. You help users find housing, legal aid, and emergency services.
  Always cite official sources from Service-Public.fr or Data-Inclusion when possible.
  Use a clear and professional tone.`,
  tools: {
    get_emergency_numbers: tool({
      description: "Get critical emergency numbers in France",
      inputSchema: z.object({}),
      execute: async () => ({
        content: [{ type: "text", text: "Police: 17, Samu: 15, Pompiers: 18, Violences Femmes Info: 3919, Samu Social: 115" }],
      }),
    }),
    search_structures: tool({
      description: "Search for aid structures near the user",
      inputSchema: z.object({ 
        query: z.string().describe("Type of aid (housing, food, etc)"),
        lat: z.number().optional(),
        lng: z.number().optional()
      }),
      execute: async ({ query, lat, lng }) => ({
        content: [{ type: "text", text: `Je cherche des structures pour '${query}'... (Intégration API en cours)` }],
      }),
    }),
  },
});
