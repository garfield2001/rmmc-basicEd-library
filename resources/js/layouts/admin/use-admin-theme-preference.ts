import { useState } from 'react';
import { adminThemePreferenceStorageKey } from './admin-layout.constants';
import { resolveStoredThemePreference } from './admin-layout.theme';
import type { ThemePreference } from './admin-layout.types';
import { useAdminTheme } from './use-admin-theme';

export function useAdminThemePreference() {
    const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
        if (typeof window === 'undefined') {
            return 'system';
        }

        return resolveStoredThemePreference(window.localStorage.getItem(adminThemePreferenceStorageKey));
    });

    const setThemePreference = (preference: ThemePreference) => {
        setThemePreferenceState(preference);
        window.localStorage.setItem(adminThemePreferenceStorageKey, preference);
    };

    useAdminTheme(themePreference);

    return {
        themePreference,
        setThemePreference,
    };
}
