document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('.search-input');
    const btn = document.querySelector('.search-btn');
    const rows = Array.from(document.querySelectorAll('#records-body .table-row'));

    function performSearch() {
        const q = (input.value || '').toLowerCase().trim();
        rows.forEach(r => {
            const text = r.textContent.toLowerCase();
            r.style.display = text.includes(q) ? '' : 'none';
        });
    }

    btn?.addEventListener('click', performSearch);
    input?.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });

    // Keep dropdown menu stable
    const navLogo = document.querySelector('.nav-logo');
    let hoverTimer;
    if (navLogo) {
        navLogo.addEventListener('mouseenter', () => { clearTimeout(hoverTimer); navLogo.classList.add('menu-open'); });
        navLogo.addEventListener('mouseleave', () => { clearTimeout(hoverTimer); hoverTimer = setTimeout(()=>{ navLogo.classList.remove('menu-open'); }, 180); });
    }
});


