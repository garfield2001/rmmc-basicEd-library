import { type SharedData } from '@/types/shared';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { navItems, sidebarAnimationStorageKey } from './admin-layout.constants';
import type { AdminSidebarProps } from './admin-layout.types';
import { AdminLogoMark } from './admin-logo-mark';

export function AdminSidebar({ active, collapsed }: AdminSidebarProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
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

            <div
                className={`${collapsed ? 'mt-4 border-t border-[#040DBF]/10 pt-4 lg:hidden' : 'mt-4 border-t border-[#040DBF]/10 pt-4'} text-xs leading-5 text-[#030A8C]`}
            >
                <p className="truncate font-medium text-[#010440]">{user?.name}</p>
                <p className="truncate capitalize">{user?.role}</p>
            </div>
        </aside>
    );
}
