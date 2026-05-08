import { useLayoutEffect } from 'react';
import { resolveTheme } from './admin-layout.theme';
import type { ThemePreference } from './admin-layout.types';

export function useAdminTheme(preference: ThemePreference) {
    useLayoutEffect(() => {
        const theme = resolveTheme(preference);

        document.documentElement.dataset.adminTheme = theme;
    }, [preference]);
}
