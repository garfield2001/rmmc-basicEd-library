import { useLayoutEffect, useState } from 'react';
import { resolveTheme } from './admin-layout.theme';
import type { ThemePreference } from './admin-layout.types';

export function useAdminTheme(preference: ThemePreference) {
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(preference));

    useLayoutEffect(() => {
        const applyTheme = () => {
            const theme = resolveTheme(preference);

            document.documentElement.dataset.adminTheme = theme;
            setResolvedTheme(theme);
        };

        applyTheme();

        if (preference !== 'system' || typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', applyTheme);

        return () => mediaQuery.removeEventListener('change', applyTheme);
    }, [preference]);

    return resolvedTheme;
}
