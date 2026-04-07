// Charge automatiquement header.html et footer.html sur toutes les pages
document.addEventListener("DOMContentLoaded", () => {
  includeHTML("header.html", "oz-header-include");
  includeHTML("footer.html", "oz-footer-include");
});

function includeHTML(file, elementId) {
  fetch(file)
    .then(response => response.text())
    .then(html => {
      document.getElementById(elementId).innerHTML = html;
    })
    .catch(err => console.error("Erreur include:", err));
}
