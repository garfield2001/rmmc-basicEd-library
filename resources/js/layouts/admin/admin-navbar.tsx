import { type SharedData } from '@/types/shared';
import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { AdminNavbarProps } from './admin-layout.types';
import { SchoolYearNavbarControl } from './school-year-navbar-control';

export function AdminNavbar({ collapsed, onCollapsedChange }: AdminNavbarProps) {
    const { name } = usePage<SharedData>().props;

    return (
        <header className="admin-surface sticky top-0 z-40 flex flex-col gap-4 border-b border-[#040DBF]/10 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onCollapsedChange(!collapsed)}
                    className="flex size-11 items-center justify-center rounded-lg border border-[#040DBF]/15 bg-white text-[#020659] shadow-sm transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-md hover:shadow-[#040DBF]/10"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-expanded={!collapsed}
                >
                    <Menu className="size-5" aria-hidden="true" />
                </button>

                <div>
                    <p className="text-sm font-semibold text-[#010440]">{name}</p>
                    <p className="text-xs text-[#030A8C]">Library RFID attendance monitor</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <SchoolYearNavbarControl />
            </div>
        </header>
    );
}
