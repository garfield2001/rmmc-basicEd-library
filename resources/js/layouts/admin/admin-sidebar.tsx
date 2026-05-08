import { type SharedData } from '@/types/shared';
import { Link, router, usePage } from '@inertiajs/react';
import { ArchiveRestore, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { navItems, sidebarAnimationStorageKey } from './admin-layout.constants';
import type { AdminSidebarProps } from './admin-layout.types';
import { AdminLogoMark } from './admin-logo-mark';

export function AdminSidebar({ active, collapsed }: AdminSidebarProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const user = auth.user;
    const currentUrl = page.url;
    const sidebarMotion = 'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';
    const sidebarColumns = collapsed ? 'grid-cols-[40px_minmax(0,1fr)] lg:grid-cols-[40px_0px]' : 'grid-cols-[40px_minmax(0,1fr)]';
    const sidebarRowWidth = collapsed ? 'w-full lg:w-10' : 'w-full';
    const sidebarRow = `grid h-10 ${sidebarRowWidth} items-center overflow-hidden transition-[width,grid-template-columns,background-color,color,border-color,box-shadow] ${sidebarMotion} ${sidebarColumns}`;
    const sidebarLabel = `min-w-0 overflow-hidden transition-[opacity,transform] ${sidebarMotion} ${
        collapsed ? 'translate-x-0 opacity-100 lg:-translate-x-2 lg:opacity-0' : 'translate-x-0 opacity-100'
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
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);
    const adminMenuRef = useRef<HTMLDivElement | null>(null);
    const adminTools = [
        {
            label: 'Settings',
            href: '/admin/settings',
            icon: Settings,
            active: active === 'settings',
        },
        {
            label: 'Archive',
            href: '/admin/members/archive',
            icon: ArchiveRestore,
            active: currentUrl.startsWith('/admin/members/archive'),
        },
    ];

    const logout = () => {
        setAdminMenuOpen(false);
        router.post('/logout');
    };

    useEffect(() => {
        if (!adminMenuOpen) {
            return;
        }

        const closeMenu = (event: PointerEvent) => {
            if (!adminMenuRef.current?.contains(event.target as Node)) {
                setAdminMenuOpen(false);
            }
        };

        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setAdminMenuOpen(false);
            }
        };

        document.addEventListener('pointerdown', closeMenu);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('pointerdown', closeMenu);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [adminMenuOpen]);

    return (
        <aside
            className={`${shouldAnimate ? 'admin-sidebar-enter' : ''} admin-surface border-[#040DBF]/10 bg-white/95 p-4 shadow-sm transition-[width] ${sidebarMotion} lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-full lg:flex-col lg:self-start lg:overflow-y-auto lg:border-r`}
        >
            <div className="border-b border-[#040DBF]/10 pb-4">
                <div className={sidebarRow}>
                    <div className="flex min-w-0 items-center justify-center">
                        <AdminLogoMark className="size-10" />
                    </div>
                    <div className={`${sidebarLabel} pl-3`}>
                        <p className="truncate text-sm font-semibold text-[#010440]">Admin workspace</p>
                        <p className="truncate text-xs text-[#030A8C]">{user?.email}</p>
                    </div>
                </div>
            </div>

            <nav className="mt-4 flex-1 space-y-1">
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
                                    ? 'border-[#040DBF] bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/20'
                                    : 'border-transparent text-[#020659] hover:border-[#040DBF]/15 hover:bg-[#040DBF]/5 hover:text-[#040DBF]'
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

            <div ref={adminMenuRef} className="relative mt-4 border-t border-[#040DBF]/10 pt-4">
                <button
                    type="button"
                    onClick={() => setAdminMenuOpen((open) => !open)}
                    className={`flex h-11 ${sidebarRowWidth} items-center overflow-hidden rounded-lg border border-transparent text-left text-[#020659] transition-[width,background-color,border-color,color,box-shadow] ${sidebarMotion} hover:border-[#040DBF]/15 hover:bg-[#040DBF]/5 hover:text-[#040DBF]`}
                    title={collapsed ? `${user?.name ?? 'Admin'} menu` : undefined}
                    aria-expanded={adminMenuOpen}
                    aria-haspopup="menu"
                >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f6f8ff] text-sm font-semibold text-[#030A8C]">
                        {(user?.name ?? 'A').trim().charAt(0).toUpperCase()}
                    </span>
                    <span className={`${sidebarLabel} flex min-w-0 flex-1 items-center justify-between pl-3`}>
                        <span className="min-w-0 leading-5">
                            <span className="block truncate text-xs font-semibold text-[#010440]">{user?.name}</span>
                            <span className="block truncate text-xs capitalize text-[#030A8C]">{user?.role}</span>
                        </span>
                        <ChevronDown
                            className={`ml-2 size-4 shrink-0 transition-transform duration-200 ${adminMenuOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                        />
                    </span>
                </button>

                {adminMenuOpen && (
                    <div
                        className={`absolute bottom-full left-0 mb-2 rounded-lg border border-[#040DBF]/10 bg-white p-1 shadow-lg shadow-[#040DBF]/10 ${
                            collapsed ? 'w-56' : 'w-full'
                        }`}
                        role="menu"
                    >
                        {adminTools.map((tool) => {
                            const Icon = tool.icon;

                            return (
                                <Link
                                    key={tool.href}
                                    href={tool.href}
                                    onClick={() => setAdminMenuOpen(false)}
                                    className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-[background-color,border-color,color,box-shadow] ${
                                        tool.active
                                            ? 'border-[#040DBF] bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/20 hover:bg-[#030A8C]'
                                            : 'border-transparent text-[#020659] hover:border-[#040DBF]/15 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm'
                                    }`}
                                    role="menuitem"
                                >
                                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                                    <span className="truncate">{tool.label}</span>
                                </Link>
                            );
                        })}
                        <button
                            type="button"
                            onClick={logout}
                            className="flex h-10 w-full items-center gap-2 rounded-md border border-transparent px-3 text-left text-sm font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/15 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm"
                            role="menuitem"
                        >
                            <LogOut className="size-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">Log out</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
