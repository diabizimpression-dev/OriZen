// annuaire.js
// Dynamically fetches structures from OriZen Backend and renders Leaflet Map

const API_URL = "http://localhost:8080/api/structures";
let map = null;
let markers = [];

document.addEventListener("DOMContentLoaded", () => {
  const useLocationBtn = document.getElementById("ozUseLocationBtn");
  const resultsContainer = document.getElementById("ozAnnuaireResults");
  const geoMessage = document.getElementById("ozGeoMessage");
  const needSelect = document.getElementById("ozNeedSelect");
  const searchForm = document.getElementById("ozAnnuaireSearch");
  
  // 1. Initialize Leaflet Map
  initMap();

  // 2. Fetch initial data (without location)
  fetchStructures();

  // 3. Handle filtering
  if (needSelect) {
    needSelect.addEventListener("change", () => {
      fetchStructures();
    });
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      fetchStructures();
    });
  }

  // 4. Handle Geolocation
  if (useLocationBtn && "geolocation" in navigator) {
    useLocationBtn.addEventListener("click", () => {
      hideGeoMessage();
      useLocationBtn.disabled = true;
      useLocationBtn.textContent = "📍 Localisation en cours...";

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          
          showGeoMessage("Ta position est utilisée pour trier les structures du plus proche au plus lointain.");
          
          if (map) {
             map.setView([lat, lng], 13);
             L.marker([lat, lng], {
               icon: L.icon({
                 iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
                 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                 iconSize: [25, 41],
                 iconAnchor: [12, 41],
                 popupAnchor: [1, -34],
                 shadowSize: [41, 41]
               })
             }).addTo(map).bindPopup("📍 Ta position").openPopup();
          }

          fetchStructures(lat, lng);

          useLocationBtn.disabled = false;
          useLocationBtn.textContent = "📍 Position actualisée";
        },
        (err) => {
          console.warn("Erreur géolocalisation:", err);
          showGeoMessage("Impossible d'obtenir ta position. Affichage standard.", "error");
          useLocationBtn.disabled = false;
          useLocationBtn.textContent = "📍 Utiliser ma position";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // --- Functions ---
  
  function initMap() {
    const mapEl = document.getElementById("ozMap");
    if (!mapEl) return;
    
    // Default center (Paris)
    map = L.map("ozMap").setView([48.8566, 2.3522], 6);
    
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);
  }

  async function fetchStructures(lat = null, lng = null) {
    const type = needSelect ? needSelect.value : "";
    
    let url = new URL(API_URL);
    if (lat && lng) {
      url.searchParams.append("lat", lat);
      url.searchParams.append("lng", lng);
    }
    if (type) {
      url.searchParams.append("type", type);
    }

    try {
       resultsContainer.innerHTML = '<div class="oz-loader">Chargement des structures...</div>';
       
       const res = await fetch(url.toString());
       const data = await res.json();
       
       if (data.ok) {
         renderStructures(data.structures, data.hasLocation);
         updateMapMarkers(data.structures);
       } else {
         throw new Error("Erreur de données");
       }
    } catch (e) {
       console.error(e);
       resultsContainer.innerHTML = '<div class="oz-alert oz-alert-error">Impossible de charger l\'annuaire pour le moment.</div>';
    }
  }

  function renderStructures(structures, hasLocation) {
    if (!structures || structures.length === 0) {
      resultsContainer.innerHTML = "<p>Aucune structure trouvée pour cette recherche.</p>";
      return;
    }

    resultsContainer.innerHTML = "";
    
    structures.forEach(s => {
      const card = document.createElement("article");
      card.className = "oz-card-structure" + (s.priority === 1 ? " oz-card-urgent" : "");
      
      let distanceHtml = "";
      if (hasLocation && s.distanceKm !== undefined) {
         distanceHtml = `<p class="oz-card-structure__distance">📍 À ${s.distanceKm} km (🚶 ~${s.walkingMin} min)</p>`;
      }
      
      const tagsHtml = (s.tags || []).slice(0,3).map(t => `<span class="oz-tag">${t}</span>`).join("");

      card.innerHTML = `
        <h3 class="oz-card-structure__title">${s.priority === 1 ? '🚨 ' : ''}${s.name}</h3>
        <p class="oz-card-structure__info">${s.description || ''}</p>
        <div class="oz-card-structure__tags">${tagsHtml}</div>
        ${distanceHtml}
        <div class="oz-card__actions">
          ${s.phone ? `<a href="tel:${s.phone.replace(/\\s/g,'')}" class="oz-btn oz-btn-primary oz-btn-sm">📞 Appeler ${s.phone}</a>` : ''}
          <a href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}" target="_blank" class="oz-btn oz-btn-outline oz-btn-sm">
            🗺️ Itinéraire
          </a>
        </div>
      `;
      
      resultsContainer.appendChild(card);
    });
  }

  function updateMapMarkers(structures) {
    if (!map) return;
    
    // Clear old markers
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    
    if (structures.length === 0) return;

    // Add new markers
    const group = new L.featureGroup();

    structures.forEach(s => {
      const isUrgent = s.priority === 1;
      const iconUrl = isUrgent 
        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png';
      
      const marker = L.marker([s.lat, s.lng], {
        icon: L.icon({
           iconUrl: iconUrl,
           shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
           iconSize: [25, 41],
           iconAnchor: [12, 41],
           popupAnchor: [1, -34],
           shadowSize: [41, 41]
        })
      });
      
      marker.bindPopup(`<strong>${s.name}</strong><br>${s.phone ? '📞 ' + s.phone : ''}`);
      marker.addTo(map);
      markers.push(marker);
      group.addLayer(marker);
    });

    // Auto-fit bounds if we have more than one marker and we're not zoomed into the user
    if (structures.length > 0) {
      map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 14 });
    }
  }

  function showGeoMessage(text, variant = "info") {
    if (!geoMessage) {
      const div = document.createElement("div");
      div.id = "ozGeoMessage";
      div.className = `oz-alert oz-alert-${variant} oz-mt-4`;
      div.innerHTML = `<div class="oz-alert__content"><p class="oz-alert__title">${variant === 'error' ? 'Erreur' : 'Info'}</p><p class="oz-alert__desc">${text}</p></div>`;
      resultsContainer.before(div);
      return;
    }
    geoMessage.className = `oz-alert oz-alert-${variant} oz-mt-4`;
    geoMessage.innerHTML = `<div class="oz-alert__content"><p class="oz-alert__title">${variant === 'error' ? 'Erreur' : 'Localisation active'}</p><p class="oz-alert__desc">${text}</p></div>`;
    geoMessage.style.display = "flex";
  }

  function hideGeoMessage() {
    const m = document.getElementById("ozGeoMessage");
    if (m) m.style.display = "none";
  }
});
