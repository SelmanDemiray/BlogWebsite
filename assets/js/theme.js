// theme.js - Theme Switcher (runs inline in HEAD)

// Inline execution to prevent flash of wrong theme
(function initTheme() {
    try {
        const storedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', initialTheme);
    } catch (e) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

export function toggleTheme() {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    root.setAttribute('data-theme', newTheme);
    try {
        localStorage.setItem('theme', newTheme);
    } catch (e) {
        console.warn('LocalStorage unavailable for theme persistence');
    }
}
