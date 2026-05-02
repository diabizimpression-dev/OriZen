const panel = document.getElementById("oz-widget-panel");
const btn = document.getElementById("oz-widget-button");
const closeBtn = document.getElementById("oz-widget-close");
const openFull = document.getElementById("oz-open-full");

/* OUVRIR WIDGET */
btn.addEventListener("click", () => {
  panel.style.display = "flex";
  btn.style.display = "none";
});

/* FERMER WIDGET */
closeBtn.addEventListener("click", () => {
  panel.style.display = "none";
  btn.style.display = "block";
});

/* OUVRIR VERSION PLEIN ÉCRAN */
openFull.addEventListener("click", () => {
  window.open("assistant.html", "_blank");
});

/* NOTIFICATION PULSE */
setTimeout(() => {
  btn.classList.add("oz-pulse");
}, 2500);

/* SUGGESTIONS → Assistant */
document.querySelectorAll(".oz-sug").forEach(s => {
  s.addEventListener("click", () => {
    const txt = s.getAttribute("data-fill");
    const frame = document.getElementById("oz-widget-frame");
    frame.contentWindow.postMessage({ type: "prefill", text: txt }, "*");
  });
});
