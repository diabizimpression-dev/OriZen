import { createAgentChat } from "@21st-sdk/nextjs";

export const chat = createAgentChat({
  agent: "orizen-agent",
  tokenUrl: "/api/agent-token",
});
