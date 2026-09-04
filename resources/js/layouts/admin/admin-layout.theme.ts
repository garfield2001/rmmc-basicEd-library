import type { ThemePreference } from './admin-layout.types';

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
    if (preference !== 'system') {
        return preference;
    }

    if (typeof window === 'undefined') {
        return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
