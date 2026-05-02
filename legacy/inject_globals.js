const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(file => file.endsWith('.html'));

const headInjection = `
  <!-- PWA & SEO Global -->
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#2563eb">
  <link rel="apple-touch-icon" href="img/icons/compass.svg">
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js');
      });
    }
  </script>
`;

const bodyInjection = `
  <!-- Actions Globales -->
  <a href="#" id="quickExit" class="oz-quick-exit" title="Quitter immédiatement">
    <img src="img/icons/warning.svg" alt="" class="oz-icon" aria-hidden="true">
    <span>Sortie Rapide</span>
  </a>

  <a href="assistant.html" class="oz-floating-assistant" title="Parler à l'assistant">
    <img src="img/icons/chat.svg" alt="Assistant" class="oz-icon" aria-hidden="true">
  </a>

  <script>
    document.getElementById('quickExit').addEventListener('click', (e) => {
      e.preventDefault();
      // Redirection immédiate vers un site neutre et suppression de l'historique
      window.location.replace('https://www.google.com');
    });
  </script>
`;

htmlFiles.forEach(file => {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // Inject in <head>
  if (!content.includes('manifest.json')) {
    content = content.replace('</head>', `${headInjection}</head>`);
  }

  // Inject in <body>
  if (!content.includes('oz-quick-exit')) {
    content = content.replace('</body>', `${bodyInjection}</body>`);
  }

  fs.writeFileSync(path.join(dir, file), content, 'utf8');
  console.log(`Injected globals into ${file}`);
});
