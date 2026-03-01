// nav.js - Shared navigation module
// Injects a consistent navigation bar into every page from a single source of truth.

export function initNav() {
    const base = window.BLOG_ROOT || './';

    const navEl = document.getElementById('main-nav');
    if (!navEl) return;

    // Determine current page for active state
    const path = window.location.pathname;

    function isActive(href) {
        // Normalise both to just the filename/path portion
        const hrefFile = href.replace(base, '').replace(/^\.\//, '');
        return path.endsWith(hrefFile);
    }

    const categoryLinks = [
        { href: `${base}categories/azure.html`, label: 'Azure' },
        { href: `${base}categories/cybersecurity.html`, label: 'Cybersecurity' },
        { href: `${base}categories/devops.html`, label: 'DevOps' },
        { href: `${base}categories/cloud.html`, label: 'Cloud' },
        { href: `${base}categories/ai.html`, label: 'AI' },
    ];

    const infoLinks = [
        { href: `${base}about.html`, label: 'About' },
        { href: `${base}certifications.html`, label: 'Certs' },
        { href: `${base}contact.html`, label: 'Contact' },
    ];

    function linkHTML(link) {
        const activeStyle = isActive(link.href) ? ' style="color:var(--text-main)"' : '';
        return `<a href="${link.href}" class="nav-link"${activeStyle}>${link.label}</a>`;
    }

    navEl.className = 'navbar';
    navEl.innerHTML = `
        <div class="container nav-container">
            <a href="${base}index.html" class="logo">My Tech Blog</a>
            <div class="nav-links">
                ${categoryLinks.map(linkHTML).join('\n                ')}
                <span class="nav-divider"></span>
                <div class="nav-dropdown">
                    <button class="dropdown-toggle">My Info ▼</button>
                    <div class="dropdown-menu">
                        ${infoLinks.map(linkHTML).join('\n                        ')}
                    </div>
                </div>
                <button id="search-btn" class="btn-outline" style="padding:0.25rem 0.75rem;border-radius:var(--radius-md);">Search</button>
                <button id="theme-toggle" class="btn-outline" aria-label="Toggle Theme" style="padding:0.25rem 0.5rem;border-radius:var(--radius-md);" onclick="toggleTheme()">🌓</button>
            </div>
            <button id="mobile-menu-btn" class="mobile-menu-toggle" aria-label="Open Menu">☰</button>
        </div>
    `;

    // --- Mobile Menu ---
    const mobileOverlay = document.getElementById('mobile-menu') || createMobileMenu(base, categoryLinks, infoLinks);

    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileClose = mobileOverlay.querySelector('#mobile-menu-close');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            mobileOverlay.style.display = 'flex';
            requestAnimationFrame(() => {
                mobileOverlay.style.transform = 'translateX(0)';
            });
        });
    }

    if (mobileClose) {
        mobileClose.addEventListener('click', () => {
            mobileOverlay.style.transform = 'translateX(100%)';
            setTimeout(() => { mobileOverlay.style.display = 'none'; }, 300);
        });
    }
}

function createMobileMenu(base, categoryLinks, infoLinks) {
    const div = document.createElement('div');
    div.id = 'mobile-menu';
    div.className = 'mobile-menu';
    div.style.cssText = 'position:fixed;inset:0;background:var(--bg-darker);z-index:9998;display:none;flex-direction:column;justify-content:center;align-items:center;padding:2rem;transform:translateX(100%);transition:transform 0.3s ease;';

    const allLinks = [...categoryLinks, ...infoLinks];
    const linksHTML = allLinks.map((l, i) =>
        `<a href="${l.href}" class="nav-link mobile-menu-link" style="font-size:1.75rem;margin-bottom:1rem;transition-delay:${(i + 1) * 0.05}s;">${l.label}</a>`
    ).join('\n');

    div.innerHTML = `
        <button id="mobile-menu-close" style="position:absolute;top:20px;right:20px;background:transparent;border:none;color:white;font-size:2rem;cursor:pointer;">&times;</button>
        ${linksHTML}
    `;

    document.body.appendChild(div);
    return div;
}
