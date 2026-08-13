import { type SharedData } from '@/types/shared';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { navItems } from './admin-layout.constants';
import type { AdminSidebarProps } from './admin-layout.types';
import { AdminLogoMark } from './admin-logo-mark';
import { AdminUserMenu } from './admin-user-menu';

export function AdminSidebar({ active, collapsed, mobileOpen, onNavigate }: AdminSidebarProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const currentUrl = page.url;
    const user = auth.user;
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({ [active]: true }));
    const [pendingHref, setPendingHref] = useState<string | null>(null);
    const displayUrl = pendingHref ?? currentUrl;
    const sidebarMotion = 'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';
    const sidebarColumns = collapsed ? 'grid-cols-[40px_minmax(0,1fr)] lg:grid-cols-[40px_0px]' : 'grid-cols-[40px_minmax(0,1fr)]';
    const sidebarRowWidth = collapsed ? 'w-full lg:w-10' : 'w-full';
    const sidebarRow = `grid h-10 ${sidebarRowWidth} items-center overflow-hidden text-left transition-[width,grid-template-columns,background-color,color,border-color,box-shadow] ${sidebarMotion} ${sidebarColumns}`;
    const sidebarLabel = `min-w-0 overflow-hidden transition-[opacity,transform] ${sidebarMotion} ${
        collapsed ? 'translate-x-0 opacity-100 lg:-translate-x-2 lg:opacity-0' : 'translate-x-0 opacity-100'
    }`;

    useEffect(() => {
        setOpenGroups({ [active]: true });
    }, [active]);

    useEffect(() => {
        if (pendingHref && isCurrentHref(currentUrl, pendingHref)) {
            setPendingHref(null);
        }
    }, [currentUrl, pendingHref]);

    return (
        <aside
            className={`admin-surface fixed inset-y-0 left-0 z-50 flex h-dvh min-h-dvh w-72 transform-gpu flex-col overflow-y-auto overscroll-contain border-r border-[#040DBF]/10 bg-white/80 p-4 shadow-xl shadow-[#010440]/15 backdrop-blur-xl transition-[transform,width] ${sidebarMotion} will-change-transform ${collapsed ? 'lg:w-[72px] 2xl:w-[84px]' : 'lg:w-[280px] 2xl:w-[304px]'} ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 lg:shadow-sm`}
        >
            <TooltipProvider>
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
                        const isActive = pendingHref ? itemMatchesHref(item, pendingHref) : active === item.key;
                        const hasChildren = Boolean(item.children?.length);
                        const open = Boolean(openGroups[item.key]);

                        if (hasChildren) {
                            const content = (
                                <div key={item.key} className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={() => setOpenGroups(open ? (item.key === active ? {} : { [active]: true }) : { [item.key]: true })}
                                        className={`${sidebarRow} rounded-lg border text-sm font-medium ${
                                            isActive
                                                ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/20'
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
                                            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 lg:opacity-0'
                                        }`}
                                    >
                                        <div className={`min-h-0 space-y-1 ${collapsed ? 'pl-0' : 'pl-6'}`}>
                                            {item.children?.map((child) => {
                                                const ChildIcon = child.icon;
                                                const childActive = isCurrentHref(displayUrl, child.href);

                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        onClick={() => {
                                                            setPendingHref(child.href);
                                                            onNavigate?.();
                                                        }}
                                                        className={`admin-sidebar-child-link grid h-9 items-center rounded-lg border text-left text-sm font-medium transition-[background-color,border-color,color,box-shadow] ${
                                                            collapsed
                                                                ? 'w-10 grid-cols-[40px_0px_0px] lg:w-10'
                                                                : 'grid-cols-[28px_minmax(0,1fr)_1rem]'
                                                        } ${
                                                            childActive
                                                                ? 'admin-sidebar-child-active border-[#040DBF]/25 bg-[#040DBF]/10 text-[#010440] dark:border-sky-300/35 dark:bg-sky-400/15 dark:text-sky-50'
                                                                : 'border-transparent text-[#020659]/75 hover:border-[#040DBF]/15 hover:bg-[#040DBF]/5 hover:text-[#040DBF] dark:text-slate-200/80 dark:hover:border-sky-300/25 dark:hover:bg-sky-400/10 dark:hover:text-white'
                                                        }`}
                                                    >
                                                        <span className="flex items-center justify-center">
                                                            <ChildIcon
                                                                className={`${collapsed ? 'size-4' : 'size-3.5'} shrink-0`}
                                                                aria-hidden="true"
                                                            />
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

                            if (collapsed) {
                                return (
                                    <Tooltip key={item.key} delayDuration={0}>
                                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={16} className="flex flex-col gap-1">
                                            <div className="font-semibold">{item.label}</div>
                                            {item.children?.map((child) => (
                                                <div key={child.href} className="text-[10px] font-medium text-white/70">
                                                    {child.label}
                                                </div>
                                            ))}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            }

                            return content;
                        }

                        const linkContent = (
                            <Link
                                key={item.href}
                                href={item.href ?? '#'}
                                onClick={() => {
                                    if (item.href) {
                                        setPendingHref(item.href);
                                    }

                                    onNavigate?.();
                                }}
                                className={`${sidebarRow} rounded-lg border text-sm font-medium ${
                                    isActive
                                        ? 'border-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/20'
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

                        if (collapsed) {
                            return (
                                <Tooltip key={item.key} delayDuration={0}>
                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={16}>
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return linkContent;
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
            </TooltipProvider>
        </aside>
    );
}

function itemMatchesHref(item: (typeof navItems)[number], href: string) {
    if (item.href && isCurrentHref(href, item.href)) {
        return true;
    }

    return item.children?.some((child) => isCurrentHref(href, child.href)) ?? false;
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
