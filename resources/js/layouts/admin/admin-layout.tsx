import { adminThemePreferenceStorageKey } from '@/layouts/admin/admin-layout.constants';
import type { AdminLayoutProps, ThemePreference } from '@/layouts/admin/admin-layout.types';
import { AdminNavbar } from '@/layouts/admin/admin-navbar';
import { useAdminTheme } from '@/layouts/admin/use-admin-theme';
import { useState } from 'react';

export function AdminLayout({ active, children }: AdminLayoutProps) {
    const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = window.localStorage.getItem(adminThemePreferenceStorageKey);
                if (stored === 'light' || stored === 'dark') {
                    return stored;
                }
            } catch {
                // fall through
            }
        }
        return 'light';
    });
    const resolvedTheme = useAdminTheme(themePreference);

    const handleThemeToggle = () => {
        const nextTheme: ThemePreference = resolvedTheme === 'dark' ? 'light' : 'dark';
        setThemePreference(nextTheme);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(adminThemePreferenceStorageKey, nextTheme);
            } catch {
                // Ignore storage errors
            }
        }
    };

    return (
        <div
            className={`admin-theme-root admin-theme-${resolvedTheme} ${resolvedTheme === 'dark' ? 'dark' : ''} admin-readable min-h-screen overflow-x-hidden bg-[#f5f7ff] text-[#010440] dark:bg-slate-950 dark:text-slate-100`}
        >
            <AdminNavbar active={active} resolvedTheme={resolvedTheme} onThemeToggle={handleThemeToggle} />

            {children}
        </div>
    );
}
