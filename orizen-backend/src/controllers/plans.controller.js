import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLANS_PATH = path.join(__dirname, "../../data/plans.json");

if (!existsSync(PLANS_PATH)) {
  writeFileSync(PLANS_PATH, JSON.stringify({}));
}

export const createPlan = (req, res) => {
  try {
    const { situation, actions, structures } = req.body;
    if (!situation || !actions) {
      return res.status(400).json({ error: "Données du plan manquantes" });
    }

    const planId = uuidv4().split('-')[0];
    const plans = JSON.parse(readFileSync(PLANS_PATH, "utf-8"));

    plans[planId] = {
      id: planId,
      situation,
      actions,
      structures: structures || [],
      createdAt: new Date().toISOString()
    };

    writeFileSync(PLANS_PATH, JSON.stringify(plans, null, 2));
    res.json({ ok: true, planId, url: `/plan.html?id=${planId}` });
  } catch (e) {
    res.status(500).json({ error: "Erreur lors de la sauvegarde du plan" });
  }
};

export const getPlanById = (req, res) => {
  try {
    const plans = JSON.parse(readFileSync(PLANS_PATH, "utf-8"));
    const plan = plans[req.params.id];
    if (!plan) return res.status(404).json({ error: "Plan non trouvé" });
    res.json({ ok: true, plan });
  } catch (e) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
