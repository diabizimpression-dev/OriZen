import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { haversineDistance, walkingMinutes } from "../utils/geo.js";
import { apiSyncService } from "../services/apiSyncService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STRUCTURES_PATH = path.join(__dirname, "../../data/structures.json");

let localStructures = [];
try {
  localStructures = JSON.parse(readFileSync(STRUCTURES_PATH, "utf-8"));
} catch (e) {
  console.error("❌ Impossible de charger structures.json :", e.message);
}

export const getStructures = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const typeFilter = (req.query.type || "").toLowerCase().trim();
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const hasLocation = !isNaN(lat) && !isNaN(lng);

    // 1. Start with local verified structures
    let results = Array.isArray(localStructures) ? [...localStructures] : [];

    // 2. Fetch external curated data if location is available
    if (hasLocation) {
      const externalData = await apiSyncService.getStructures(lat, lng);
      // Merge and prioritize
      results = [...results, ...externalData];
    }

    // 3. Apply distances and metadata
    results = results.map((s) => {
      const entry = { ...s };
      if (hasLocation) {
        entry.distanceKm = haversineDistance(lat, lng, s.lat, s.lng);
        entry.walkingMin = walkingMinutes(entry.distanceKm);
      }
      return entry;
    });

    // 4. Filtering
    if (typeFilter) {
      results = results.filter((s) =>
        (s.tags || []).some((t) => t.toLowerCase().includes(typeFilter)) ||
        (s.name || "").toLowerCase().includes(typeFilter) ||
        (s.type || "").toLowerCase().includes(typeFilter)
      );
    }

    // 5. Sorting & Deduplication (Deduplication already handled by apiSyncService)
    if (hasLocation) {
      results.sort((a, b) => {
        // High priority first (police/emergency)
        const prioA = a.priority || (a.type === 'protection' ? 1 : 3);
        const prioB = b.priority || (b.type === 'protection' ? 1 : 3);
        if (prioA !== prioB) return prioA - prioB;
        return (a.distanceKm || 999) - (b.distanceKm || 999);
      });
    }

    res.json({
      ok: true,
      hasLocation,
      count: results.length,
      structures: results.slice(0, limit)
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};

