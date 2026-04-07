import fetch from "node-fetch";

class ApiSyncService {
  constructor() {
    this.cache = new Map();
    this.TTL = 24 * 60 * 60 * 1000; // 24h
  }

  async getStructures(lat, lng, radius = 5000) {
    const cacheKey = `${Math.round(lat * 100)}_${Math.round(lng * 100)}`;
    const now = Date.now();

    if (this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey);
      if (now - entry.timestamp < this.TTL) {
        console.log("Serving from backend cache");
        return entry.data;
      }
    }

    console.log("Syncing from external sources...");
    const [osmData, inclusionData] = await Promise.all([
      this.fetchOSM(lat, lng, radius),
      this.fetchDataInclusion(lat, lng, radius)
    ]);

    const combined = this.deduplicate([...osmData, ...inclusionData]);
    this.cache.set(cacheKey, { data: combined, timestamp: now });
    
    return combined;
  }

  async fetchOSM(lat, lng, radius) {
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"hospital|police|social_facility|townhall|soup_kitchen"](around:${radius},${lat},${lng});
        node["social_facility:for"~"homeless|refugee"](around:${radius},${lat},${lng});
      );
      out body;
    `;
    
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
      });
      const data = await res.json();
      return data.elements.map(el => {
        const type = this.mapType(el.tags.amenity || el.tags.social_facility);
        return {
          id: `osm_${el.id}`,
          source: "osm",
          name: el.tags.name || "Structure Aide",
          type: type,
          lat: el.lat,
          lng: el.lon,
          addr: el.tags["addr:full"] || "Adresse non spécifiée",
          tel: el.tags.phone || (type === "protection" ? "17" : "115"),
          hours: el.tags.opening_hours || "24h/24"
        };
      });
    } catch (e) {
      console.error("OSM Fetch Error:", e.message);
      return [];
    }
  }

  async fetchDataInclusion(lat, lng, radius) {
    // Data·inclusion API (search structures around coords)
    // Radius in km for this API
    const radiusKm = radius / 1000;
    const url = `https://api.data.inclusion.beta.gouv.fr/api/v0/structures/?latitude=${lat}&longitude=${lng}&distance_max=${radiusKm}`;
    
    try {
      const res = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      const data = await res.json();
      
      // The API returns paginated results in 'items' or similar
      const results = data.results || data.items || [];
      return results.map(s => ({
        id: `inc_${s.id}`,
        source: "data-inclusion",
        name: s.nom,
        type: "social", // Standardize
        lat: s.latitude,
        lng: s.longitude,
        addr: `${s.adresse || ''} ${s.code_postal || ''} ${s.commune || ''}`.trim(),
        tel: s.telephone || "N/A",
        hours: "Vérifier sur place",
        accessibility: s.accessibilite || "N/A"
      }));
    } catch (e) {
      console.error("Data·Inclusion Error:", e.message);
      return [];
    }
  }

  mapType(tag) {
    if (tag === 'police') return "protection";
    if (tag === 'hospital' || tag === 'doctors') return "santé";
    if (tag === 'soup_kitchen' || tag === 'shelter') return "hebergement";
    return "social";
  }

  deduplicate(list) {
    const seen = new Set();
    return list.filter(item => {
      const slug = `${item.name.toLowerCase().substring(0, 10)}_${Math.round(item.lat*1000)}_${Math.round(item.lng*1000)}`;
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });
  }
}

export const apiSyncService = new ApiSyncService();
