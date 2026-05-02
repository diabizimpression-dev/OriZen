/**
 * OriZen Public Data Integration
 * Centralizes calls to data.gouv.fr APIs
 */

const ORIZEN_API = {
  // 1. Geocoding & Address Search (api-adresse.data.gouv.fr)
  async searchAddress(query) {
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      return data.features;
    } catch (err) {
      console.error("API Adresse Error:", err);
      return [];
    }
  },

  // 2. Geolocation / communes (geo.api.gouv.fr)
  async getCommuneByCoords(lat, lon) {
    try {
      const res = await fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lon}&fields=nom,code,codesPostaux&format=json`);
      const data = await res.json();
      return data[0] || null;
    } catch (err) {
      console.error("API Geo Error:", err);
      return null;
    }
  },

  // 3. Main Sync Engine (OSM Overpass + Data.gouv.fr logic)
  async syncExternalData(lat, lon, radius = 5000) {
    const cacheKey = `orizen_sync_${Math.round(lat*100)}_${Math.round(lon*100)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        console.log("Using cached structures");
        return data;
      }
    }

    try {
      // OSM Overpass Query: Hospitals, Police, Social Facilities, Shelters
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          node["amenity"="police"](around:${radius},${lat},${lon});
          node["amenity"="social_facility"](around:${radius},${lat},${lon});
          node["amenity"="townhall"](around:${radius},${lat},${lon});
          node["amenity"="soup_kitchen"](around:${radius},${lat},${lon});
          node["social_facility:for"~"homeless|refugee"](around:${radius},${lat},${lon});
        );
        out body;
      `;
      
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
      });
      const data = await res.json();

      const standardized = data.elements.map(el => {
        let type = "social";
        const tags = el.tags;
        if (tags.amenity === 'police') type = "protection";
        if (tags.amenity === 'hospital' || tags.amenity === 'doctors') type = "santé";
        if (tags.amenity === 'soup_kitchen' || tags.social_facility === 'shelter' || tags["social_facility:for"] === 'homeless') type = "hebergement";
        if (tags.amenity === 'townhall') type = "social";

        return {
          id: el.id,
          name: tags.name || tags.operator || (type === "protection" ? "Commissariat" : "Structure Aide"),
          type: type,
          lat: el.lat,
          lng: el.lon,
          addr: tags["addr:full"] || (`${tags["addr:housenumber"] || ''} ${tags["addr:street"] || ''} ${tags["addr:city"] || ''}`).trim() || "Adresse non spécifiée",
          tel: tags.phone || tags["contact:phone"] || (type === "hebergement" ? "115" : type === "protection" ? "17" : "15"),
          hours: tags.opening_hours || "24h/24 (Vérifier sur place)",
          avail: "high"
        };
      });

      localStorage.setItem(cacheKey, JSON.stringify({ data: standardized, timestamp: Date.now() }));
      return standardized;
    } catch (err) {
      console.error("Sync Error:", err);
      return [];
    }
  }
};

window.ORIZEN_API = ORIZEN_API;
