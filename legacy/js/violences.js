// violences.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Bouton Quick Exit (Bannière)
    // Les liens sont maintenant directs dans le HTML (a href="..."), 
    // mais on peut rajouter une sécurité supplémentaire ici.

    // 2. Bascule Mode Discret
    const discretBtn = document.getElementById('ozToggleDiscretBtn');
    const body = document.body;
    
    if (discretBtn) {
        // Charger l'état initial (partagé avec l'assistant)
        const isDiscret = localStorage.getItem("oz-discret-mode") === "true";
        if (isDiscret) body.classList.add("mode-discret-active");

        discretBtn.addEventListener('click', () => {
            const active = body.classList.toggle('mode-discret-active');
            localStorage.setItem("oz-discret-mode", active);
            discretBtn.textContent = active ? "🕶 Mode Normal" : "🕶 Mode Discret";
            
            // Si discret, changer le titre du document pour l'onglet
            document.title = active ? "Météo et Infos Santé" : "Violences & Protection | OriZen";
        });
    }

    // 3. Gestion simplifiée des clics sur les cartes de violence
    const cards = document.querySelectorAll('.oz-card.oz-hover-scale');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Pour l'instant, on fait défiler vers le protocole par défaut
            const protocolSection = document.querySelector('.oz-card.oz-section--elevated');
            if (protocolSection) {
                protocolSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // On pourrait dynamiser le contenu ici si besoin, 
                // mais le HTML contient déjà un plan d'urgence générique efficace.
            }
        });
    });
});
