import { useEffect } from 'react';
import { resolveTheme } from './theme';
import type { ThemePreference } from './types';

export function useAdminTheme(preference: ThemePreference) {
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const media = window.matchMedia('(prefers-color-scheme: dark)');

        const applyTheme = () => {
            document.documentElement.dataset.adminTheme = resolveTheme(preference);
        };

        applyTheme();
        media.addEventListener('change', applyTheme);

        return () => {
            media.removeEventListener('change', applyTheme);
            delete document.documentElement.dataset.adminTheme;
        };
    }, [preference]);
}
