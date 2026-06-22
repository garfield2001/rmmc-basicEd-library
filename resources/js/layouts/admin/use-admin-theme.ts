import { useLayoutEffect, useState } from 'react';
import { resolveTheme } from './admin-layout.theme';
import type { ThemePreference } from './admin-layout.types';

export function useAdminTheme(preference: ThemePreference) {
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(preference));

    useLayoutEffect(() => {
        const applyTheme = () => {
            const theme = resolveTheme(preference);
            const root = document.documentElement;

            root.removeAttribute('data-admin-theme');
            root.style.colorScheme = theme === 'dark' ? 'dark' : 'only light';
            setResolvedTheme(theme);
        };

        applyTheme();

        if (preference !== 'system' || typeof window === 'undefined') {
            return () => clearAdminTheme();
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', applyTheme);

        return () => {
            mediaQuery.removeEventListener('change', applyTheme);
            clearAdminTheme();
        };
    }, [preference]);

    return resolvedTheme;
}

function clearAdminTheme() {
    const root = document.documentElement;

    root.removeAttribute('data-admin-theme');
    root.style.colorScheme = 'only light';
}
