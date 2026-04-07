/**
 * OriZen Security Logic
 * Handles Discreet Mode and Quick Exit
 */

const ORIZEN_SECURITY = {
  init() {
    this.setupDiscreetMode();
    this.setupQuickExit();
    this.setupNightMode();
    this.setupAutoDiscreetMode();
  },

  setupNightMode() {
    const html = document.documentElement;
    const isNight = localStorage.getItem('orizen_night_mode') === 'true';
    
    // Initial sync (in case theme-init.js didn't run or for redundancy)
    html.classList.toggle('oz-night-mode', isNight);
    
    // Global function for buttons to call
    window.toggleNightMode = () => {
      const active = html.classList.toggle('oz-night-mode');
      localStorage.setItem('orizen_night_mode', active);
      
      // Update all toggle buttons
      this.syncThemeButtons(active);
      
      // Custom event for components like Leaflet that need to react
      window.dispatchEvent(new CustomEvent('oz-theme-change', { detail: { isNight: active } }));
    };

    // Sync button icons on load
    this.syncThemeButtons(isNight);
  },

  syncThemeButtons(isNight) {
    const btns = document.querySelectorAll('button[onclick="toggleNightMode()"], button[title="Mode Nuit"]');
    btns.forEach(btn => {
      btn.innerText = isNight ? '☀️' : '🌙';
    });
  },


  setupDiscreetMode() {
    const btns = document.querySelectorAll('[id^="modeDiscretBtn"]');
    const isDiscret = localStorage.getItem('oz-discret-mode') === 'true';

    if (isDiscret) {
      document.body.classList.add('mode-discret-active');
      btns.forEach(btn => btn.textContent = '🕶 Mode Normal');
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const active = document.body.classList.toggle('mode-discret-active');
        localStorage.setItem('oz-discret-mode', active);
        
        // Broadcast change to other tabs
        window.dispatchEvent(new Event('storage'));
        
        btns.forEach(b => b.textContent = active ? '🕶 Mode Normal' : '🕶 Mode Discret');
      });
    });

    // Listen for changes in other tabs
    window.addEventListener('storage', () => {
      const active = localStorage.getItem('oz-discret-mode') === 'true';
      document.body.classList.toggle('mode-discret-active', active);
      btns.forEach(b => b.textContent = active ? '🕶 Mode Normal' : '🕶 Mode Discret');
    });
  },

  setupQuickExit() {
    const exitBtns = document.querySelectorAll('[id^="quickExitBtn"]');
    exitBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // --- AMNESIA PROTOCOL ---
        sessionStorage.clear();
        
        // Remove everything but the encrypted vault and night mode preference
        const safeKeys = ['oz_vault_docs', 'orizen_night_mode'];
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (!safeKeys.includes(key)) {
                localStorage.removeItem(key);
            }
        }
        
        window.location.replace('https://www.google.com');
      });
    });
  },

  setupAutoDiscreetMode() {
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      // Wait 60 seconds of inactivity to auto-enable discreet mode
      timeout = setTimeout(() => {
        if (localStorage.getItem('oz-discret-mode') !== 'true') {
           document.body.classList.add('mode-discret-active');
           localStorage.setItem('oz-discret-mode', 'true');
           
           const btns = document.querySelectorAll('[id^="modeDiscretBtn"]');
           btns.forEach(b => b.textContent = '🕶 Mode Normal');
           
           window.dispatchEvent(new Event('storage')); // Notify other tabs
        }
      }, 60000); 
    };

    ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => 
      window.addEventListener(evt, resetTimer, { passive: true })
    );
    resetTimer(); // Init
  },

  // --- VAULT ENCRYPTION (Web Crypto API) ---
  
  async deriveKey(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return await crypto.subtle.importKey(
      'raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
    );
  },

  async encryptFile(file, password) {
    const key = await this.deriveKey(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const content = await file.arrayBuffer();
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      content
    );

    // Combine IV + Encrypted Data for storage
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to Base64 for localStorage
    return btoa(String.fromCharCode.apply(null, combined));
  },

  async decryptFile(base64Data, password) {
    try {
        const combined = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const key = await this.deriveKey(password);

        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv },
          key,
          data
        );

        return decrypted;
    } catch (e) {
        throw new Error("Clé de déchiffrement incorrecte.");
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ORIZEN_SECURITY.init());
