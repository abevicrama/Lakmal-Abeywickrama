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
});