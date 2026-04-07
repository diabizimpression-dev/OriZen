(function() {
    const isNight = localStorage.getItem('orizen_night_mode') === 'true';
    if (isNight) {
        document.documentElement.classList.add('oz-night-mode');
    }
})();
