import { ForcedLogoutListener } from '@/components/auth/forced-logout-listener';
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

export function AdminLayout({ active, children, themeOverride }: AdminLayoutProps) {
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [loadingTarget, setLoadingTarget] = useState<AdminLoadingTarget>(() => loadingTargetFromPath(activePathFromSection(active)));
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const pageLoadingTimer = useRef<number | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
    });

    const { resolvedTheme, setThemePreference } = useAdminThemePreference(themeOverride);

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
            <ForcedLogoutListener />
            <AdminRoutePreloader />
            <div
                className={`admin-theme-root admin-readable min-h-screen overflow-x-hidden bg-[#f5f7ff] text-[#010440] ${
                    isSidebarCollapsed ? 'admin-sidebar-collapsed' : ''
                }`}
            >
                {isMobileSidebarOpen && (
                    <button
                        type="button"
                        className="fixed inset-0 z-[45] bg-black/45 backdrop-blur-[1px] lg:hidden"
                        aria-label="Close sidebar"
                        onClick={() => setIsMobileSidebarOpen(false)}
                    />
                )}

                <AdminSidebar
                    active={active}
                    collapsed={isSidebarCollapsed}
                    mobileOpen={isMobileSidebarOpen}
                    onNavigate={() => setIsMobileSidebarOpen(false)}
                />

                <section
                    className={`admin-main-shell min-w-0 space-y-6 overflow-x-hidden ${
                        isSidebarCollapsed ? 'lg:pl-[72px] 2xl:pl-[84px]' : 'lg:pl-[280px] 2xl:pl-[304px]'
                    }`}
                >
                    <AdminNavbar
                        collapsed={isSidebarCollapsed}
                        mobileSidebarOpen={isMobileSidebarOpen}
                        resolvedTheme={resolvedTheme}
                        onCollapsedChange={changeSidebarCollapsed}
                        onMobileSidebarToggle={() => setIsMobileSidebarOpen((open) => !open)}
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

    if (pathname.startsWith('/admin/visit-logs') || pathname.startsWith('/admin/visits-history')) {
        return 'visit-logs';
    }

    if (pathname.startsWith('/admin/visit-progress')) {
        return 'visit-progress';
    }

    if (pathname === '/admin/registered-visitors/create' || /^\/admin\/registered-visitors\/[^/]+\/edit$/.test(pathname)) {
        return 'visitors-form';
    }

    if (pathname.startsWith('/admin/registered-visitors')) {
        return 'visitors-index';
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

    if (active === 'visitors') {
        return '/admin/registered-visitors/students';
    }

    if (active === 'visit-logs') {
        return '/admin/visit-logs/students';
    }

    if (active === 'visit-progress') {
        return '/admin/visit-progress/students';
    }

    if (active === 'reports') {
        return '/admin/reports/students';
    }

    return `/admin/${active}`;
}
