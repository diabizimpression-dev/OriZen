import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

// ----- Fix dotenv dans ce fichier -----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../../.env")
});
// --------------------------------------

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY manquant dans .env");
  process.exit(1);
}

export const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});
