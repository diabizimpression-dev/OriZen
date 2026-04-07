/**
 * OriZen App Shell - Core Controller (SPA)
 * Logic for routing, global state, and view transitions.
 */

window.ORI_APP = {
    currentState: {
        currentView: 'home',
        language: localStorage.getItem('orizen_lang') || 'fr',
        userLocation: null,
        isNightMode: localStorage.getItem('orizen_night_mode') === 'true'
    },

    init() {
        console.log("🚀 OriZen SPA Shell Initializing...");
        
        // Handle initial routing
        const params = new URLSearchParams(window.location.search);
        const targetView = params.get('p') || 'home';
        this.navigate(targetView, false);

        // Geolocation setup
        this.updateLocation();

        // Listen for back/forward
        window.onpopstate = (e) => {
            if (e.state && e.state.view) this.navigate(e.state.view, false);
        };
    },

    async navigate(viewName, updateHistory = true) {
        if (this.currentState.currentView === viewName && updateHistory) return;

        console.log(`🧭 Navigating to: ${viewName}`);
        
        // Update state
        this.currentState.currentView = viewName;
        
        // Load content
        await this.loadView(viewName);

        // Update UI (Active state in Nav)
        document.querySelectorAll('.oz-nav-item').forEach(item => {
            item.classList.remove('active');
            // Check if onclick contains current view name
            const onclick = item.getAttribute('onclick') || "";
            if (onclick.includes(`'${viewName}'`)) {
                item.classList.add('active');
            }
        });

        // Update URL
        if (updateHistory) {
            const newUrl = viewName === 'home' ? 'index.html' : `index.html?p=${viewName}`;
            window.history.pushState({ view: viewName }, '', newUrl);
        }
    },

    async loadView(viewName) {
        const contentArea = document.getElementById('app-shell-content');
        const contentFile = viewName === 'home' ? 'index_content.html' : `${viewName}_content.html`;

        contentArea.style.opacity = '0.3';
        contentArea.style.transform = 'translateY(10px)';
        contentArea.style.transition = 'all 0.3s ease';

        try {
            const response = await fetch(contentFile);
            if (!response.ok) throw new Error("Vue non trouvée");
            const html = await response.text();
            
            // Inject content + mobile spacer
            contentArea.innerHTML = html + '\n<div class="oz-bottom-spacer"></div>';
            // Execute scripts
            const scripts = contentArea.querySelectorAll('script');
            scripts.forEach(oldScript => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                document.body.appendChild(newScript).parentNode.removeChild(newScript);
            });

            // Init global features
            if (typeof checkWeather === 'function') checkWeather();
            
            // Init special views
            if (viewName === 'home') { /* already handled by global above */ }
            if (viewName === 'assistant' && typeof initAssistant === 'function') initAssistant();
            if (viewName === 'carte' && typeof initMap === 'function') initMap();
            if (viewName === 'vault' && typeof initVault === 'function') initVault();

            // Refresh i18n
            if (window.i18n) window.i18n.updatePage();

            setTimeout(() => {
                contentArea.style.opacity = '1';
                contentArea.style.transform = 'translateY(0)';
            }, 50);

        } catch (err) {
            console.error("View load failed:", err);
            contentArea.innerHTML = `<div class="oz-shell oz-mt-12 oz-center"><div class="oz-card"><h2>⚠️ Oops</h2><p>Désolé, cette page (${viewName}) n'est pas accessible.</p><button onclick="window.ORI_APP.navigate('home')" class="oz-btn oz-btn-primary oz-mt-4">Retour Accueil</button></div></div>`;
            contentArea.style.opacity = '1';
        }
    },

    updateLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(pos => {
                this.currentState.userLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                console.log("📍 Location Updated:", this.currentState.userLocation);
            }, err => console.warn("Location access denied"));
        }
    }
};

// =============================================================
// GLOBAL quickAction() — works from any page
// When called from non-assistant views, navigates to assistant
// and pre-fills the query. When on the assistant page, the
// local override from initAssistant() takes precedence.
// =============================================================
window.quickAction = window.quickAction || function(key) {
    // Map key to a human-readable default query
    const queries = {
        housing: "J'ai besoin d'un h\u00e9bergement",
        danger:  "Je suis en danger",
        rights:  "J'ai une question juridique",
        nearby:  "Structures d'aide pr\u00e8s de moi"
    };
    const query = queries[key] || key;

    // Navigate to assistant and queue the message
    if (window.ORI_APP) {
        window.ORI_APP.navigate('assistant').then(() => {
            // Small delay to let initAssistant() run and override quickAction
            setTimeout(() => {
                if (window.quickAction && window.quickAction !== arguments.callee) {
                    window.quickAction(key);
                } else {
                    const input = document.getElementById('chatInput');
                    const form  = document.getElementById('chatForm');
                    if (input && form) {
                        input.value = query;
                        form.dispatchEvent(new Event('submit'));
                    }
                }
            }, 200);
        });
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => window.ORI_APP.init());

