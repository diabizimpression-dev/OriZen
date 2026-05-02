/**
 * geo.js — Utilitaires géographiques OriZen
 * Formule de Haversine : distance entre deux points GPS (en km)
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calcule la distance en kilomètres entre deux coordonnées.
 * @param {number} lat1 - Latitude du point 1
 * @param {number} lng1 - Longitude du point 1
 * @param {number} lat2 - Latitude du point 2
 * @param {number} lng2 - Longitude du point 2
 * @returns {number} Distance en km (arrondie à 2 décimales)
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Estimation du temps de marche (minutes) à 5 km/h.
 * @param {number} distKm
 * @returns {number}
 */
export function walkingMinutes(distKm) {
  return Math.round((distKm / 5) * 60);
}
