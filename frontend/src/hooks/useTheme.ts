import { useState, useEffect } from 'react';

/**
 * useTheme Hook
 *
 * Manages the application's theme (light/dark mode).
 * Syncs the theme state with:
 * 1. Local storage ('theme' key)
 * 2. System preference (prefers-color-scheme)
 * 3. DOM root element (adds 'dark' class and data-theme attribute)
 */
export function useTheme() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Sync Dark Mode with DOM root for Tailwind v4 and CSS variables
    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    return [isDarkMode, setIsDarkMode] as const;
}
