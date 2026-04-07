// urgences.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Bascule Mode Discret
    const discretBtn = document.getElementById("modeDiscretBtn");
    if (discretBtn) {
        const isDiscret = localStorage.getItem("oz-discret-mode") === "true";
        if (isDiscret) document.body.classList.add("mode-discret-active");

        discretBtn.addEventListener("click", () => {
            const active = document.body.classList.toggle("mode-discret-active");
            localStorage.setItem("oz-discret-mode", active);
            discretBtn.textContent = active ? "🕶 Mode Normal" : "🕶 Mode Discret";
        });
    }

    const urgenceData = {
        medical: {
            title: "Urgence médicale",
            steps: ["Appelle le 15", "Donne ta position exacte", "Ne raccroche pas"]
        },
        violence: {
            title: "Violence / Agression",
            steps: ["Appelle le 17", "Mets-toi en sécurité", "Attends la patrouille"]
        },
        logement: {
            title: "Sans logement",
            steps: ["Appelle le 115", "Précise si tu es seul", "Rappelle si saturé"]
        },
        mineur: {
            title: "Mineur en danger",
            steps: ["Appelle le 119", "Dis 'Je suis mineur et en danger'", "Reste en ligne"]
        }
    };

    const cards = document.querySelectorAll('.oz-card.oz-hover-scale[data-category]');
    const protocolZone = document.getElementById('urgence-protocol');
    const actionTitle = document.getElementById('action-title');
    const stepsContainer = document.getElementById('protocol-steps');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            const data = urgenceData[category];

            if (data) {
                actionTitle.textContent = `QUE FAIRE : ${data.title}`;
                stepsContainer.innerHTML = data.steps.map(step => `
                    <div class="oz-flex oz-gap-sm oz-flex-center oz-mt-2">
                        <span style="color: var(--oz-color-primary);">→</span>
                        <span>${step}</span>
                    </div>
                `).join('');

                protocolZone.style.display = 'block';
                protocolZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
});
