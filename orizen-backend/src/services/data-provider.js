/**
 * data-provider.js — Service d'agrégation des données publiques (Data.gouv.fr)
 */

import fetch from 'node-fetch';
import { APP_CONFIG } from '../config/app/settings.js';

/**
 * Récupère les commissariats de police (exemple simplifié via API Géo ou Data.gouv)
 * Note: Dans une version réelle, on utiliserait l'API de recherche d'établissements.
 */
export async function fetchPublicStructures(type = 'police', lat, lng) {
  try {
    // Exemple d'appel à l'API Géo pour trouver des services publics proches
    // Documentation: https://geo.api.gouv.fr/services-publics
    const typesMap = {
      police: 'commissariat_police',
      gendarmerie: 'gendarmerie',
      sante: 'hopital',
      social: 'ccas'
    };

    const serviceTag = typesMap[type] || type;
    const url = `${APP_CONFIG.APIS.GEO}etablissements-publics?lat=${lat}&lon=${lng}&type=${serviceTag}`;

    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();

    // Normalisation au format OriZen
    return data.features.map(f => ({
      id: f.properties.id,
      name: f.properties.nom,
      type: type,
      address: `${f.properties.adresses[0].lignes[0]}, ${f.properties.adresses[0].codePostal} ${f.properties.adresses[0].nomCommune}`,
      phone: f.properties.telephone,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      priority: type === 'police' ? 1 : 2,
      tags: [type, 'public', f.properties.type]
    }));
  } catch (error) {
    console.error(`❌ Erreur fetchPublicStructures (${type}):`, error.message);
    return [];
  }
}
