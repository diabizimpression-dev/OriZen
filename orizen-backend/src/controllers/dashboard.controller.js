import fs from "fs";

export const getStats = (req, res) => {
  try {
    const raw = fs.readFileSync("logs/assistant.jsonl", "utf8");
    const lines = raw.trim().split("\n");
    const stats = {
      total: lines.length,
      domains: {}
    };

    for (const l of lines) {
      const row = JSON.parse(l);
      stats.domains[row.domain] = (stats.domains[row.domain] || 0) + 1;
    }

    res.json(stats);
  } catch {
    res.json({ total: 0, domains: {} });
  }
};
