import { useLayoutEffect, useState } from 'react';
import { resolveTheme } from './admin-layout.theme';
import type { ThemePreference } from './admin-layout.types';

export function useAdminTheme(preference: ThemePreference) {
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(preference));

    useLayoutEffect(() => {
        const applyTheme = () => {
            const theme = resolveTheme(preference);
            const root = document.documentElement;

            root.classList.toggle('dark', theme === 'dark');
            root.classList.toggle('admin-theme-dark', theme === 'dark');
            root.classList.toggle('admin-theme-light', theme === 'light');
            root.setAttribute('data-admin-theme', theme);
            root.style.colorScheme = theme === 'dark' ? 'dark' : 'only light';
            setResolvedTheme(theme);
        };

        applyTheme();

        if (preference !== 'system' || typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', applyTheme);

        return () => {
            mediaQuery.removeEventListener('change', applyTheme);
        };
    }, [preference]);

    return resolvedTheme;
}

function clearAdminTheme() {
    const root = document.documentElement;

    root.classList.remove('dark', 'admin-theme-dark', 'admin-theme-light');
    root.removeAttribute('data-admin-theme');
    root.style.colorScheme = 'only light';
}
