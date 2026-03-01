// search.js - Handles the site-wide search functionality

import { debounce } from './utils.js';

let postsData = null;

async function loadSearchData() {
    if (postsData) return postsData;
    try {
        const response = await fetch(new URL('data/posts.json', document.baseURI).href);
        postsData = await response.json();
        return postsData;
    } catch (e) {
        console.error("Search data failed to load", e);
        return [];
    }
}

function initSearch() {
    const searchBtn = document.getElementById('search-btn');
    const overlay = document.getElementById('search-overlay');
    const closeBtn = document.getElementById('search-close');
    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    if (!searchBtn || !overlay) return;

    const toggleOverlay = async (force) => {
        const isOpen = force ?? !overlay.classList.contains('is-open');
        overlay.classList.toggle('is-open', isOpen);

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            input.focus();
            await loadSearchData();
        } else {
            document.body.style.overflow = '';
            input.value = '';
            resultsContainer.innerHTML = '';
        }
    };

    searchBtn.addEventListener('click', () => toggleOverlay(true));
    closeBtn.addEventListener('click', () => toggleOverlay(false));

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
            toggleOverlay(false);
        }
    });

    // Close by clicking outside container
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            toggleOverlay(false);
        }
    });

    // Handle input with debounce
    const handleSearch = debounce(() => {
        const query = input.value.trim().toLowerCase();

        if (query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }

        if (!postsData) return;

        const results = postsData.filter(post =>
            post.title.toLowerCase().includes(query) ||
            post.category.toLowerCase().includes(query) ||
            post.tags.join(' ').toLowerCase().includes(query)
        );

        renderResults(results, query);
    }, 200);

    input.addEventListener('input', handleSearch);

    function renderResults(results, query) {
        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="p-4 text-center text-muted">No results found for "${query}"</div>`;
            return;
        }

        const html = results.map(post => `
            <div class="search-result-item p-4 border-b border-gray-800 hover:bg-gray-900 transition-colors">
                <a href="/posts/${post.category}/${post.slug}.html" class="block">
                    <span class="text-xs font-mono text-cyan-400 mb-1 block">${post.category.toUpperCase()}</span>
                    <h4 class="text-lg font-bold text-white mb-2">${post.title}</h4>
                    <p class="text-sm text-gray-400 truncate">${post.excerpt}</p>
                </a>
            </div>
        `).join('');

        resultsContainer.innerHTML = html;
    }
}

export { initSearch };
