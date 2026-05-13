import { ToastProvider } from '@/components/ui/toaster';
import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

import { AdminContentLoadingSkeleton, type AdminLoadingTarget } from './admin-content-loading-skeleton';
import { sidebarCollapsedStorageKey } from './admin-layout.constants';
import type { AdminLayoutProps } from './admin-layout.types';
import { AdminNavbar } from './admin-navbar';
import { AdminRoutePreloader } from './admin-route-preloader';
import { AdminSidebar } from './admin-sidebar';
import { useAdminThemePreference } from './use-admin-theme-preference';

const pageLoadingDelayMs = 500;

export function AdminLayout({ active, children }: AdminLayoutProps) {
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [loadingTarget, setLoadingTarget] = useState<AdminLoadingTarget>(() => loadingTargetFromPath(activePathFromSection(active)));
    const pageLoadingTimer = useRef<number | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
    });

    const { resolvedTheme, setThemePreference } = useAdminThemePreference();

    useEffect(() => {
        const clearPageLoadingTimer = () => {
            if (pageLoadingTimer.current !== null) {
                window.clearTimeout(pageLoadingTimer.current);
                pageLoadingTimer.current = null;
            }
        };

        const removeStartListener = router.on('start', (event) => {
            const visit = event.detail.visit;

            if (visit.prefetch || visit.preserveState === true) {
                return;
            }

            clearPageLoadingTimer();
            setLoadingTarget(loadingTargetFromPath(visit.url.pathname));
            pageLoadingTimer.current = window.setTimeout(() => {
                setIsPageLoading(true);
            }, pageLoadingDelayMs);
        });
        const removeFinishListener = router.on('finish', () => {
            clearPageLoadingTimer();
            setIsPageLoading(false);
        });

        return () => {
            removeStartListener();
            removeFinishListener();
            clearPageLoadingTimer();
        };
    }, []);

    const changeSidebarCollapsed = (collapsed: boolean) => {
        setIsSidebarCollapsed(collapsed);
        window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? 'true' : 'false');
    };

    return (
        <ToastProvider>
            <AdminRoutePreloader />
            <div
                className={`admin-theme-root admin-readable grid min-h-screen bg-[#f5f7ff] text-[#010440] transition-[grid-template-columns] duration-300 ${
                    isSidebarCollapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'
                } ${isSidebarCollapsed ? 'admin-sidebar-collapsed' : ''}`}
            >
                <AdminSidebar active={active} collapsed={isSidebarCollapsed} />

                <section className="min-w-0 space-y-6">
                    <AdminNavbar
                        collapsed={isSidebarCollapsed}
                        resolvedTheme={resolvedTheme}
                        onCollapsedChange={changeSidebarCollapsed}
                        onThemeToggle={() => setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark')}
                    />
                    {isPageLoading ? <AdminContentLoadingSkeleton target={loadingTarget} /> : children}
                </section>
            </div>
        </ToastProvider>
    );
}

function loadingTargetFromPath(pathname: string): AdminLoadingTarget {
    if (pathname === '/admin' || pathname === '/admin/') {
        return 'dashboard';
    }

    if (pathname.startsWith('/admin/live-visits')) {
        return 'live-visits';
    }

    if (pathname === '/admin/registered-visitors/create' || /^\/admin\/registered-visitors\/[^/]+\/edit$/.test(pathname)) {
        return 'members-form';
    }

    if (pathname.startsWith('/admin/registered-visitors')) {
        return 'members-index';
    }

    if (pathname.startsWith('/admin/reports')) {
        return 'reports';
    }

    if (pathname.startsWith('/admin/settings')) {
        return 'settings';
    }

    return 'dashboard';
}

function activePathFromSection(active: AdminLayoutProps['active']) {
    if (active === 'dashboard') {
        return '/admin';
    }

    if (active === 'live-visits') {
        return '/admin/live-visits';
    }

    if (active === 'members') {
        return '/admin/registered-visitors';
    }

    if (active === 'archive') {
        return '/admin/registered-visitors/archive';
    }

    return `/admin/${active}`;
}
