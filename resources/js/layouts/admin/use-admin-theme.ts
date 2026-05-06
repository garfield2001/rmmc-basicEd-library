import { useEffect } from 'react';
import { resolveTheme } from './admin-layout.theme';
import type { ThemePreference } from './admin-layout.types';

export function useAdminTheme(preference: ThemePreference) {
    useEffect(() => {
        const theme = resolveTheme(preference);

        document.documentElement.dataset.adminTheme = theme;

        return () => {
            delete document.documentElement.dataset.adminTheme;
        };
    }, [preference]);
}
