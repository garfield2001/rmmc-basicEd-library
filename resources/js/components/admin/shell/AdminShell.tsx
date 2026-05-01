import { ToastProvider } from '@/components/ui/toaster';
import { useState } from 'react';

import { AdminNavbar } from './AdminNavbar';
import { AdminSidebar } from './AdminSidebar';
import { adminThemePreferenceStorageKey, sidebarCollapsedStorageKey } from './constants';
import { resolveStoredThemePreference } from './theme';
import type { AdminShellProps, ThemePreference } from './types';
import { useAdminTheme } from './use-admin-theme';

export function AdminShell({ active, children }: AdminShellProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
    });

    const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
        if (typeof window === 'undefined') {
            return 'system';
        }

        return resolveStoredThemePreference(window.localStorage.getItem(adminThemePreferenceStorageKey));
    });

    const changeSidebarCollapsed = (collapsed: boolean) => {
        setIsSidebarCollapsed(collapsed);
        window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? 'true' : 'false');
    };

    const changeThemePreference = (preference: ThemePreference) => {
        setThemePreference(preference);
        window.localStorage.setItem(adminThemePreferenceStorageKey, preference);
    };

    useAdminTheme(themePreference);

    return (
        <ToastProvider>
            <div
                className={`grid min-h-screen transition-[grid-template-columns] duration-300 ${
                    isSidebarCollapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'
                } admin-theme-root`}
            >
                <AdminSidebar
                    active={active}
                    collapsed={isSidebarCollapsed}
                    themePreference={themePreference}
                    onThemePreferenceChange={changeThemePreference}
                />

                <section className="min-w-0 space-y-6">
                    <AdminNavbar collapsed={isSidebarCollapsed} onCollapsedChange={changeSidebarCollapsed} />
                    {children}
                </section>
            </div>
        </ToastProvider>
    );
}
