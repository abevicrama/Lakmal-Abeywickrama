document.addEventListener('DOMContentLoaded', () => {
    // Initialize ScrollReveal
    ScrollReveal().reveal('.scroll-reveal', {
        distance: '20px',
        origin: 'bottom',
        opacity: 0,
        duration: 800,
        delay: 150,
        easing: 'cubic-bezier(0.6, 0.2, 0.1, 1)',
        interval: 100, // Stagger animations for elements with the same class
    });

    // Add a class to header after content loads for fade-in effect
    const header = document.querySelector('header');
    if (header) {
        header.classList.add('animate-fade-in');
    }

    // Theme toggle: support system preference, persist in localStorage
    const themeToggle = document.getElementById('theme-toggle');
    const root = document.documentElement;
    const storedTheme = localStorage.getItem('theme');
    // Default to light mode when there's no stored preference
    let theme = storedTheme || 'light';

    function applyTheme(t) {
        if (t === 'dark') {
            root.setAttribute('data-theme', 'dark');
            if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle && themeToggle.setAttribute('aria-pressed', 'true');
        } else {
            root.removeAttribute('data-theme');
            if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle && themeToggle.setAttribute('aria-pressed', 'false');
        }
    }

    applyTheme(theme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            theme = (theme === 'dark') ? 'light' : 'dark';
            localStorage.setItem('theme', theme);
            applyTheme(theme);
        });
    }
});