import { debounce, throttle } from './utils.js';

// animations.js - Core UI Animations and Canvas Effects

class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.numParticles = 80;
        this.maxDistance = 120;
        this.accentColor = 'rgba(0, 242, 254, 0.6)';
        this.fpsLimit = 1000 / 30; // 30 fps
        this.lastDrawTime = 0;
        this.animationId = null;
        this.isRunning = true;

        this.init();
        this.bindEvents();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                radius: Math.random() * 2 + 1
            });
        }
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.numParticles; i++) {
            let p1 = this.particles[i];

            // Move particle
            p1.x += p1.vx;
            p1.y += p1.vy;

            // Bounce off edges
            if (p1.x < 0 || p1.x > this.canvas.width) p1.vx *= -1;
            if (p1.y < 0 || p1.y > this.canvas.height) p1.vy *= -1;

            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.accentColor;
            this.ctx.fill();

            // Draw connecting lines
            for (let j = i + 1; j < this.numParticles; j++) {
                let p2 = this.particles[j];
                let dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

                if (dist < this.maxDistance) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    // Fade line based on distance
                    let opacity = 0.6 * (1 - dist / this.maxDistance);
                    this.ctx.strokeStyle = `rgba(0, 242, 254, ${opacity})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        }
    }

    animate(timestamp) {
        if (!this.isRunning) return;

        if (!timestamp) timestamp = performance.now();
        const deltaTime = timestamp - this.lastDrawTime;

        if (deltaTime >= this.fpsLimit) {
            this.drawParticles();
            this.lastDrawTime = timestamp - (deltaTime % this.fpsLimit);
        }

        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }

    pause() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastDrawTime = performance.now();
            this.animate();
        }
    }

    bindEvents() {
        window.addEventListener('resize', debounce(() => {
            if (this.canvas.width !== window.innerWidth || this.canvas.height !== window.innerHeight) {
                this.resize();
            }
        }, 100));

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.pause();
            } else {
                this.resume();
            }
        });
    }
}

// Custom Cursor Implementation
function initCursor() {
    // Only init if not a touch device
    if (navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches) {
        return;
    }

    const dot = document.createElement('div');
    dot.id = 'cursor-dot';
    const ring = document.createElement('div');
    ring.id = 'cursor-ring';

    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    // Smooth follow for the ring
    const renderRing = () => {
        ringX += (mouseX - ringX) * 0.2; // Lerp factor
        ringY += (mouseY - ringY) * 0.2;
        ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
        requestAnimationFrame(renderRing);
    };
    requestAnimationFrame(renderRing);

    // Setup event delegation for interactive elements
    document.body.addEventListener('mouseover', (e) => {
        const target = e.target.closest('a, button, input, textarea, .clickable');
        if (target) ring.classList.add('cursor-hover');
    });

    document.body.addEventListener('mouseout', (e) => {
        const target = e.target.closest('a, button, input, textarea, .clickable');
        if (target) ring.classList.remove('cursor-hover');
    });
}

// Intersection Observer for scroll animations
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');

                // Remove will-change after transition completes to save memory
                entry.target.addEventListener('transitionend', function handler(e) {
                    if (e.propertyName === 'transform') {
                        entry.target.style.willChange = 'auto';
                        entry.target.removeEventListener('transitionend', handler);
                    }
                });

                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => {
        el.style.willChange = 'opacity, transform';
        observer.observe(el);
    });

    // Stagger grid cards
    const grids = document.querySelectorAll('.stagger-grid');
    grids.forEach(grid => {
        const cards = grid.querySelectorAll('.post-card, .animate-on-scroll');
        cards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 80}ms`;
        });
    });

    // MutationObserver: watch for dynamically added .animate-on-scroll elements
    const mutationObs = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType !== 1) return;
                // Check the node itself
                if (node.classList && node.classList.contains('animate-on-scroll') && !node.classList.contains('is-visible')) {
                    node.style.willChange = 'opacity, transform';
                    observer.observe(node);
                }
                // Check descendants
                if (node.querySelectorAll) {
                    node.querySelectorAll('.animate-on-scroll:not(.is-visible)').forEach(el => {
                        el.style.willChange = 'opacity, transform';
                        observer.observe(el);
                    });
                }
            });
        });

        // Also apply stagger delays to new grid cards
        document.querySelectorAll('.stagger-grid').forEach(grid => {
            const cards = grid.querySelectorAll('.post-card, .animate-on-scroll');
            cards.forEach((card, index) => {
                if (!card.style.transitionDelay || card.style.transitionDelay === '0s') {
                    card.style.transitionDelay = `${index * 80}ms`;
                }
            });
        });
    });
    mutationObs.observe(document.body, { childList: true, subtree: true });
}

// Loader fade effect
function initLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        window.addEventListener('load', () => {
            loader.classList.add('fading');
            loader.addEventListener('transitionend', () => {
                loader.style.display = 'none';
                loader.remove();
            }, { once: true });
        });
    }
}

// Navbar scroll shrink effect
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const handleScroll = debounce(() => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
}

// Initialize all animations when DOM is ready
export function initAnimations() {
    initCursor();
    initScrollAnimations();
    initLoader();
    initNavbar();

    // Init canvas only if homepage
    if (document.getElementById('hero-canvas')) {
        new ParticleNetwork('hero-canvas');
    }

    // Stats counter for about page
    initStatsCounters();
}

function initStatsCounters() {
    const stats = document.querySelectorAll('.stat-number');
    if (!stats.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'), 10);
                const duration = 1500;
                let startTimestamp = null;

                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    // easeOutQuad
                    const easeOut = progress * (2 - progress);
                    entry.target.innerText = Math.floor(easeOut * target).toLocaleString();
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    }
                };
                requestAnimationFrame(step);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));
}
