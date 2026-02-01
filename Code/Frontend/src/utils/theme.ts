export type Theme = 'light' | 'dark' | 'system';



const STORAGE_KEY = 'autologic-theme';

/**
 * Applies the theme to the HTML element
 */
const applyTheme = (theme: Theme) => {
    const root = window.document.documentElement;
    const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.remove('light', 'dark');
    root.classList.add(isDark ? 'dark' : 'light');

    // Set color-scheme property for native controls
    root.style.colorScheme = isDark ? 'dark' : 'light';
};

/**
 * Gets the stored theme or defaults to 'system'
 */
export const getStoredTheme = (): Theme => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
};

/**
 * Sets the theme and persists it
 */
export const setTheme = (theme: Theme) => {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
        applyTheme(theme);
    } catch (e) {
        console.warn('Failed to save theme preference', e);
    }
};

/**
 * Initializes the theme system
 */
export const initializeTheme = () => {
    const theme = getStoredTheme();
    applyTheme(theme);

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const current = getStoredTheme();
        if (current === 'system') {
            applyTheme('system');
        }
    });
};
