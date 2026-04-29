import { Button } from '@/components/ui/button';
import { ToastProvider } from '@/components/ui/toaster';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { FileText, LayoutDashboard, LogOut, Menu, ScanLine, ShieldCheck, UsersRound } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

type AdminNavItem = {
    key: AdminSection;
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
};

export type AdminSection = 'monitor' | 'members' | 'reports';

interface AdminShellProps {
    active: AdminSection;
    children: ReactNode;
}

interface AdminSidebarProps {
    active: AdminSection;
    collapsed: boolean;
}

interface AdminPageHeaderProps {
    title: string;
    description: string;
    badge?: ReactNode;
    actions?: ReactNode;
}

const navItems: AdminNavItem[] = [
    {
        key: 'monitor',
        label: 'Live Visits',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        key: 'members',
        label: 'Students & Staff',
        href: '/admin/members',
        icon: UsersRound,
    },
    {
        key: 'reports',
        label: 'Visit Records',
        href: '/admin/reports',
        icon: FileText,
    },
];

const sidebarAnimationStorageKey = 'rmmc-admin-sidebar-entered-v1';
const sidebarCollapsedStorageKey = 'rmmc-admin-sidebar-collapsed-v1';
const adminPreloaderDuration = 2200;
const adminLoginSuccessMessage = 'Admin session started.';

function AdminPreloader() {
    return (
        <div className="admin-preloader flex min-h-screen items-center justify-center px-6 text-zinc-950">
            <div className="w-full max-w-sm text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm">
                    <ShieldCheck className="size-5" />
                </div>
                <p className="mt-5 text-sm font-medium text-zinc-500">Loading admin workspace</p>
                <p className="mt-2 text-2xl font-semibold">Preparing library tools</p>
                <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                    <div className="admin-preloader-bar h-full rounded-full bg-zinc-950" />
                </div>
            </div>
        </div>
    );
}

export function AdminTopBar() {
    const { name } = usePage<SharedData>().props;

    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white shadow-sm">
                        <ScanLine className="size-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold">{name}</p>
                        <p className="text-xs text-zinc-500">Library RFID attendance monitor</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        Auto-sync
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                        <ShieldCheck className="size-3.5" />
                        Admin mode
                    </span>
                </div>
            </div>
        </header>
    );
}

interface AdminNavbarProps {
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
}

export function AdminNavbar({ collapsed, onCollapsedChange }: AdminNavbarProps) {
    const { name } = usePage<SharedData>().props;

    return (
        <header className="sticky top-0 z-40 flex flex-col gap-4 border-b border-zinc-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onCollapsedChange(!collapsed)}
                    className="flex size-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-950"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!collapsed}
                >
                    <Menu className="size-5" aria-hidden="true" />
                </button>
                <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-zinc-500">Library RFID attendance monitor</p>
                </div>
            </div>

            <Button variant="outline" asChild>
                <Link href="/logout" method="post" as="button">
                    <LogOut className="size-4" />
                    Log out
                </Link>
            </Button>
        </header>
    );
}

export function AdminPageHeader({ title, description, badge, actions }: AdminPageHeaderProps) {
    return (
        <header className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
                {badge && <div className="mb-4">{badge}</div>}
                <h1 className="text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p>
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}

export function AdminSidebar({ active, collapsed }: AdminSidebarProps) {
    const { auth } = usePage<SharedData>().props;
    const sidebarMotion = 'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';
    const sidebarColumns = collapsed ? 'grid-cols-[40px_0px]' : 'grid-cols-[40px_minmax(0,1fr)]';
    const sidebarRowWidth = collapsed ? 'w-10' : 'w-full';
    const sidebarRow = `grid h-10 ${sidebarRowWidth} items-center overflow-hidden transition-[width,grid-template-columns,background-color,color,border-color,box-shadow] ${sidebarMotion} ${sidebarColumns}`;
    const sidebarLabel = `min-w-0 overflow-hidden transition-[opacity,transform] ${sidebarMotion} ${
        collapsed ? '-translate-x-2 opacity-0' : 'translate-x-0 opacity-100'
    }`;
    const [shouldAnimate] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        if (window.sessionStorage.getItem(sidebarAnimationStorageKey) === 'true') {
            return false;
        }

        window.sessionStorage.setItem(sidebarAnimationStorageKey, 'true');

        return true;
    });

    return (
        <aside
            className={`${shouldAnimate ? 'admin-sidebar-enter ' : ''}border-zinc-200 bg-white/95 p-4 shadow-sm transition-[width] ${sidebarMotion} lg:sticky lg:top-0 lg:h-screen lg:w-full lg:self-start lg:overflow-y-auto lg:border-r`}
        >
            <div className="border-b border-zinc-100 pb-4">
                <div className={sidebarRow}>
                    <div className="flex min-w-0 items-center justify-center">
                        <div className={`flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white transition-[transform,box-shadow] ${sidebarMotion}`}>
                            <ShieldCheck className="size-5" aria-hidden="true" />
                        </div>
                    </div>
                    <div className={`${sidebarLabel} pl-3`}>
                        <p className="truncate text-sm font-semibold">Admin workspace</p>
                        <p className="truncate text-xs text-zinc-500">{auth.user?.email}</p>
                    </div>
                </div>
            </div>

            <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={`${sidebarRow} rounded-lg border text-sm font-medium ${
                                isActive
                                    ? 'border-zinc-800 bg-zinc-950 text-white shadow-sm ring-1 ring-zinc-950/10'
                                    : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <span className="flex min-w-0 items-center justify-center">
                                <Icon className="size-4 shrink-0" aria-hidden="true" />
                            </span>
                            <span className={`${sidebarLabel} pl-3 whitespace-nowrap`}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

export function AdminShell({ active, children }: AdminShellProps) {
    const { flash } = usePage<SharedData>().props;
    const shouldShowLoginPreloader = flash.success === adminLoginSuccessMessage;
    const [isLoading, setIsLoading] = useState(shouldShowLoginPreloader);
    const [shouldAnimateEntry] = useState(shouldShowLoginPreloader);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return window.localStorage.getItem(sidebarCollapsedStorageKey) === 'true';
    });

    const changeSidebarCollapsed = (collapsed: boolean) => {
        setIsSidebarCollapsed(collapsed);
        window.localStorage.setItem(sidebarCollapsedStorageKey, collapsed ? 'true' : 'false');
    };

    useEffect(() => {
        if (!isLoading) {
            return;
        }

        const timer = window.setTimeout(() => setIsLoading(false), adminPreloaderDuration);

        return () => window.clearTimeout(timer);
    }, [isLoading]);

    useEffect(() => {
        const logoutOnClose = () => {
            const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
            const formData = new FormData();

            if (token) {
                formData.append('_token', token);
            }

            if (navigator.sendBeacon) {
                navigator.sendBeacon('/session/close', formData);
                return;
            }

            void fetch('/session/close', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                keepalive: true,
            });
        };

        window.addEventListener('pagehide', logoutOnClose);

        return () => window.removeEventListener('pagehide', logoutOnClose);
    }, []);

    return (
        <ToastProvider>
            {isLoading ? (
                <AdminPreloader />
            ) : (
                <div
                    className={`${shouldAnimateEntry ? 'admin-window-enter ' : ''}grid min-h-screen transition-[grid-template-columns] duration-300 ${
                        isSidebarCollapsed ? 'lg:grid-cols-[72px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'
                    }`}
                >
                    <AdminSidebar active={active} collapsed={isSidebarCollapsed} />
                    <section className="min-w-0 space-y-6">
                        <AdminNavbar collapsed={isSidebarCollapsed} onCollapsedChange={changeSidebarCollapsed} />
                        {children}
                    </section>
                </div>
            )}
        </ToastProvider>
    );
}
