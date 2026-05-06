import { ToastProvider } from '@/components/ui/toaster';
import { useState } from 'react';

import { sidebarCollapsedStorageKey } from './admin-layout.constants';
import type { AdminLayoutProps } from './admin-layout.types';
import { AdminNavbar } from './admin-navbar';
import { AdminRoutePreloader } from './admin-route-preloader';
import { AdminSidebar } from './admin-sidebar';
import { useAdminThemePreference } from './use-admin-theme-preference';

export function AdminLayout({ active, children }: AdminLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
    });

    useAdminThemePreference();

    const changeSidebarCollapsed = (collapsed: boolean) => {
        setIsSidebarCollapsed(collapsed);
        window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? 'true' : 'false');
    };

    return (
        <ToastProvider>
            <AdminRoutePreloader />
            <div
                className={`admin-theme-root grid min-h-screen bg-[#f5f7ff] text-[#010440] transition-[grid-template-columns] duration-300 ${
                    isSidebarCollapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'
                }`}
            >
                <AdminSidebar active={active} collapsed={isSidebarCollapsed} />

                <section className="min-w-0 space-y-6">
                    <AdminNavbar collapsed={isSidebarCollapsed} onCollapsedChange={changeSidebarCollapsed} />
                    {children}
                </section>
            </div>
        </ToastProvider>
    );
}
