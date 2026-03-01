// loader.js - Loads and renders JSON data for posts

import { formatDate, generateSlug } from './utils.js';

let postsData = null;

async function fetchPosts() {
    if (postsData) return postsData;
    try {
        const response = await fetch(new URL('data/posts.json', document.baseURI).href);
        postsData = await response.json();
        return postsData;
    } catch (e) {
        console.error('Failed to load posts data', e);
        return [];
    }
}

function createPostCard(post) {
    const base = '';
    return `
        <article class="card post-card animate-on-scroll">
            <div class="post-card-image-wrap">
                <span class="post-badge">${post.category.toUpperCase()}</span>
                <!-- Use WebP with fallback -->
                <picture>
                    <source srcset="${base}assets/images/${post.thumbnail}.webp" type="image/webp">
                    <img src="${base}assets/images/${post.thumbnail}.jpg" 
                         alt="${post.title}" 
                         class="post-card-image" 
                         loading="lazy" 
                         width="400" 
                         height="225">
                </picture>
            </div>
            <div class="post-card-content">
                <h3 class="post-card-title">
                    <a href="${base}posts/${post.category}/${post.slug}.html">${post.title}</a>
                </h3>
                <p class="post-card-excerpt">${post.excerpt}</p>
                <div class="tags">
                    ${post.tags.slice(0, 3).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
                <div class="post-card-meta">
                    <span class="date">${formatDate(post.datePublished)}</span>
                    <span class="read-time">${post.readTime}</span>
                </div>
            </div>
        </article>
    `;
}

// Logic for Homepage grids
export async function renderHomepage() {
    const featuredGrid = document.getElementById('featured-posts-grid');
    const recentGrid = document.getElementById('recent-posts-grid');

    if (!featuredGrid && !recentGrid) return;

    const posts = await fetchPosts();

    if (featuredGrid) {
        const featured = posts.filter(p => p.featured).slice(0, 6);
        featuredGrid.innerHTML = featured.map(createPostCard).join('');
    }

    if (recentGrid) {
        // Sort by date newest first
        const recent = [...posts].sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished)).slice(0, 8);
        recentGrid.innerHTML = recent.map(createPostCard).join('');
    }

    // Force visibility on injected cards after a frame
    requestAnimationFrame(() => {
        document.querySelectorAll('.post-card.animate-on-scroll').forEach(card => {
            card.classList.add('is-visible');
        });
    });
}

// Logic for Category pages
export async function renderCategory(categorySlug) {
    const grid = document.getElementById('category-posts-grid');
    if (!grid) return;

    const posts = await fetchPosts();
    const categoryPosts = posts.filter(p => p.category === categorySlug);

    grid.innerHTML = categoryPosts.map(createPostCard).join('');

    // Force visibility on injected cards
    requestAnimationFrame(() => {
        grid.querySelectorAll('.post-card.animate-on-scroll').forEach(card => {
            card.classList.add('is-visible');
        });
    });
}

// Logic for Single Post page (Related Posts & Pillar Link)
export async function enhancePostPage() {
    const postArticle = document.querySelector('article.post-body');
    if (!postArticle) return;

    const urlParts = window.location.pathname.split('/');
    const categorySlug = urlParts[urlParts.length - 2];
    const currentSlug = urlParts[urlParts.length - 1].replace(/\.html$/, '');

    const posts = await fetchPosts();
    const categoryPosts = posts.filter(p => p.category === categorySlug);

    // Inject Pillar Link
    const pillarPost = categoryPosts.find(p => p.isPillar);
    if (pillarPost && pillarPost.slug !== currentSlug) {
        const pillarAlert = document.createElement('div');
        pillarAlert.className = 'featured-snippet';
        const base = '';
        pillarAlert.innerHTML = `<strong>Start Here:</strong> If you are new to this topic, read our comprehensive pillar guide first: <a href="${base}posts/${categorySlug}/${pillarPost.slug}.html">${pillarPost.title}</a>.`;

        postArticle.insertBefore(pillarAlert, postArticle.firstChild);
    }

    // Inject Related Posts
    const relatedGrid = document.getElementById('related-posts-grid');
    if (relatedGrid) {
        const related = categoryPosts
            .filter(p => p.slug !== currentSlug)
            .sort(() => 0.5 - Math.random()) // naive shuffle
            .slice(0, 3);

        relatedGrid.innerHTML = related.map(createPostCard).join('');
    }

    // Table of Contents generator
    buildTOC('post-body', 'toc');

    // Highlight to share
    initShareTooltip();
}

export function buildTOC(contentId, tocId) {
    const article = document.getElementById(contentId) || document.querySelector('.post-body');
    const tocContainer = document.getElementById(tocId) || document.querySelector('.toc');
    if (!article || !tocContainer) return;

    const headings = article.querySelectorAll('h2');
    if (headings.length === 0) return;

    const ul = document.createElement('ul');

    headings.forEach(h2 => {
        const title = h2.textContent;
        const slug = generateSlug(title);
        h2.id = slug;

        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${slug}`;
        a.textContent = title;
        li.appendChild(a);
        ul.appendChild(li);
    });

    // Clear and append
    const existingUl = tocContainer.querySelector('ul');
    if (existingUl) tocContainer.removeChild(existingUl);
    tocContainer.appendChild(ul);

    // Intersection Observer for active TOC highlighting
    const tocLinks = ul.querySelectorAll('a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                tocLinks.forEach(link => link.classList.remove('toc-active'));
                const activeLink = document.querySelector(`#${tocId} a[href="#${entry.target.id}"]`) || document.querySelector(`.toc a[href="#${entry.target.id}"]`);
                if (activeLink) activeLink.classList.add('toc-active');
            }
        });
    }, { rootMargin: '-20% 0px -80% 0px' });

    headings.forEach(h2 => observer.observe(h2));
}

export async function loadAuthorBlock(containerId) {
    const container = document.getElementById(containerId);

    // Find current post metadata and update header spans
    const urlParts = window.location.pathname.split('/');
    const currentSlug = urlParts[urlParts.length - 1].replace(/\.html$/, '');

    const posts = await fetchPosts();
    const currentPost = posts.find(p => p.slug === currentSlug);

    if (currentPost) {
        const spans = document.querySelectorAll('header span');
        if (spans.length >= 3) {
            spans[0].innerHTML = `📅 ${formatDate(currentPost.datePublished)}`;
            spans[1].innerHTML = `⏱ ${currentPost.readTime}`;
            spans[2].innerHTML = `✍️ ${currentPost.author}`;
        }
    }

    if (!container) return;
    container.innerHTML = `
        <div style="display:flex; gap:1.5rem; align-items:center; margin-top:2rem; padding:2rem; background:rgba(255,255,255,0.02); border-radius:var(--radius-lg); border:1px solid var(--border-color);">
            <div style="font-size:3rem;">👨‍💻</div>
            <div>
                <h4 style="margin-bottom:0.5rem;">${currentPost ? currentPost.author : 'Selman Demiray'}</h4>
                <p style="color:var(--text-muted); font-size:0.95rem;">Cloud Security Engineer and Technical Writer specializing in Azure, DevOps, and Zero Trust Architecture.</p>
            </div>
        </div>
    `;
}

function initShareTooltip() {
    const tooltip = document.getElementById('share-tooltip');
    if (!tooltip) return;

    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        const article = document.querySelector('.post-body');

        if (selection.toString().trim().length > 0 && article && article.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            tooltip.style.display = 'flex';
            tooltip.style.left = `${rect.left + (rect.width / 2) + window.scrollX}px`;
            tooltip.style.top = `${rect.top + window.scrollY}px`;

            const text = encodeURIComponent(selection.toString().substring(0, 280));
            const url = encodeURIComponent(window.location.href);

            tooltip.querySelector('.twitter-share').href = `https://twitter.com/intent/tweet?text="${text}"&url=${url}`;
            tooltip.querySelector('.linkedin-share').href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        } else {
            tooltip.style.display = 'none';
        }
    });

    // Code block copy button injection
    const preBlocks = document.querySelectorAll('pre');
    preBlocks.forEach(pre => {
        const lang = pre.getAttribute('data-language') || 'Code';

        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `
            <span>${lang}</span>
            <button class="copy-btn">Copy</button>
        `;

        pre.parentNode.insertBefore(header, pre);

        const codeElement = pre.querySelector('code') || pre;

        header.querySelector('.copy-btn').addEventListener('click', function (e) {
            navigator.clipboard.writeText(codeElement.innerText).then(() => {
                const btn = e.target;
                const originalText = btn.innerText;
                btn.innerText = 'Copied! ✓';
                btn.classList.add('copied');

                btn.addEventListener('transitionend', () => {
                    btn.classList.remove('copied');
                    setTimeout(() => { btn.innerText = originalText; }, 200);
                }, { once: true });
            });
        });
    });
}

// Inject footer latest posts globally
export async function renderFooter() {
    const list = document.getElementById('footer-latest-posts');
    if (!list) return;

    const posts = await fetchPosts();
    const latest = [...posts].sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished)).slice(0, 3);
    const base = '';

    list.innerHTML = latest.map(p => `
        <li><a href="${base}posts/${p.category}/${p.slug}.html" class="footer-link">${p.title}</a></li>
    `).join('');
}
