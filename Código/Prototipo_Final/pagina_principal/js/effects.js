document.addEventListener('DOMContentLoaded', () => {
    // Este archivo solo mete el detallito visual del nav activo y las entradas suaves.
    const page = document.body.dataset.page;
    const activeLink = document.querySelector(`[data-nav="${page}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    const revealItems = document.querySelectorAll('.reveal');
    revealItems.forEach((item, index) => {
        // Les damos retraso escalonado para que no aparezca todo de golpe.
        item.style.transitionDelay = `${index * 90}ms`;
        requestAnimationFrame(() => {
            item.classList.add('is-visible');
        });
    });
});