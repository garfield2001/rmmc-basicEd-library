import { type SharedData } from '@/types/shared';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { navItems } from './admin-layout.constants';
import type { AdminSidebarProps } from './admin-layout.types';
import { AdminLogoMark } from './admin-logo-mark';
import { AdminUserMenu } from './admin-user-menu';

export function AdminSidebar({ active, collapsed, mobileOpen, onNavigate }: AdminSidebarProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const currentUrl = page.url;
    const user = auth.user;
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    const sidebarMotion = 'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';
    const sidebarColumns = collapsed ? 'grid-cols-[40px_minmax(0,1fr)] lg:grid-cols-[40px_0px]' : 'grid-cols-[40px_minmax(0,1fr)]';
    const sidebarRowWidth = collapsed ? 'w-full lg:w-10' : 'w-full';
    const sidebarRow = `grid h-10 ${sidebarRowWidth} items-center overflow-hidden text-left transition-[width,grid-template-columns,background-color,color,border-color,box-shadow] ${sidebarMotion} ${sidebarColumns}`;
    const sidebarLabel = `min-w-0 overflow-hidden transition-[opacity,transform] ${sidebarMotion} ${
        collapsed ? 'translate-x-0 opacity-100 lg:-translate-x-2 lg:opacity-0' : 'translate-x-0 opacity-100'
    }`;

    useEffect(() => {
        setOpenGroups((groups) => ({ ...groups, [active]: true }));
    }, [active]);

    return (
        <aside
            className={`admin-surface fixed inset-y-0 left-0 z-50 flex h-screen w-72 transform-gpu flex-col overflow-y-auto border-r border-[#040DBF]/10 bg-white/95 p-4 shadow-xl shadow-[#010440]/15 transition-[transform,width] ${sidebarMotion} will-change-transform ${collapsed ? 'lg:overflow-y-hidden' : ''} ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:sticky lg:top-0 lg:z-auto lg:w-full lg:translate-x-0 lg:self-start lg:shadow-sm`}
        >
            <div className="border-b border-[#040DBF]/10 pb-4">
                <div className={sidebarRow}>
                    <div className="flex min-w-0 items-center justify-center">
                        <AdminLogoMark className="size-10" />
                    </div>
                    <div className={`${sidebarLabel} pl-3`}>
                        <p className="truncate text-sm font-semibold text-[#010440]">Admin dashboard</p>
                        <p className="truncate text-xs text-[#030A8C]">{user?.email}</p>
                    </div>
                </div>
            </div>

            <nav className="mt-4 flex-1 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = active === item.key;
                    const hasChildren = Boolean(item.children?.length);
                    const open = openGroups[item.key] ?? isActive;

                    if (hasChildren) {
                        return (
                            <div key={item.key} className="space-y-1">
                                <button
                                    type="button"
                                    onClick={() => setOpenGroups((groups) => ({ ...groups, [item.key]: !open }))}
                                    title={collapsed ? item.label : undefined}
                                    className={`${sidebarRow} rounded-lg border text-sm font-medium ${
                                        isActive
                                            ? 'border-[#040DBF] bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/20'
                                            : 'border-transparent text-[#020659] hover:border-[#040DBF]/15 hover:bg-[#040DBF]/5 hover:text-[#040DBF]'
                                    }`}
                                    aria-expanded={open}
                                >
                                    <span className="flex min-w-0 items-center justify-center">
                                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                                    </span>
                                    <span
                                        className={`${sidebarLabel} grid min-w-0 grid-cols-[minmax(0,1fr)_1.25rem] items-center gap-2 pl-3 text-left whitespace-nowrap`}
                                    >
                                        <span className="truncate">{item.label}</span>
                                        <ChevronDown
                                            className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                                            aria-hidden="true"
                                        />
                                    </span>
                                </button>

                                <div
                                    className={`grid overflow-hidden transition-[grid-template-rows,opacity] ${sidebarMotion} ${
                                        open && !collapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 lg:opacity-0'
                                    }`}
                                >
                                    <div className="min-h-0 space-y-1 pl-6">
                                        {item.children?.map((child) => {
                                            const ChildIcon = child.icon;
                                            const childActive = isCurrentHref(currentUrl, child.href);

                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    onClick={onNavigate}
                                                    className={`admin-sidebar-child-link grid h-9 grid-cols-[28px_minmax(0,1fr)_1rem] items-center rounded-lg border text-left text-sm font-medium transition-[background-color,border-color,color,box-shadow] ${
                                                        childActive
                                                            ? 'admin-sidebar-child-active border-[#040DBF]/25 bg-[#040DBF]/10 text-[#010440] dark:border-sky-300/35 dark:bg-sky-400/15 dark:text-sky-50'
                                                            : 'border-transparent text-[#020659]/75 hover:border-[#040DBF]/15 hover:bg-[#040DBF]/5 hover:text-[#040DBF] dark:text-slate-200/80 dark:hover:border-sky-300/25 dark:hover:bg-sky-400/10 dark:hover:text-white'
                                                    }`}
                                                >
                                                    <span className="flex items-center justify-center">
                                                        <ChildIcon className="size-3.5 shrink-0" aria-hidden="true" />
                                                    </span>
                                                    <span className="truncate">{child.label}</span>
                                                    <ChevronRight className="size-3.5" aria-hidden="true" />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href ?? '#'}
                            onClick={onNavigate}
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

            <AdminUserMenu
                active={active}
                collapsed={collapsed}
                sidebarLabel={sidebarLabel}
                sidebarMotion={sidebarMotion}
                sidebarRowWidth={sidebarRowWidth}
                onNavigate={onNavigate}
            />
        </aside>
    );
}

function isCurrentHref(currentUrl: string, href: string) {
    const [currentPath, currentQuery = ''] = currentUrl.split('?');
    const [targetPath, targetQuery = ''] = href.split('?');

    if (currentPath !== targetPath) {
        return false;
    }

    if (!targetQuery) {
        return true;
    }

    const currentParams = new URLSearchParams(currentQuery);
    const targetParams = new URLSearchParams(targetQuery);

    return [...targetParams.entries()].every(([key, value]) => currentParams.get(key) === value);
}
