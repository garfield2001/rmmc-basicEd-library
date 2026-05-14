import { type SharedData } from '@/types/shared';
import { usePage } from '@inertiajs/react';
import { Menu, Moon, Sun } from 'lucide-react';
import type { AdminNavbarProps } from './admin-layout.types';
import { SchoolYearNavbarControl } from './school-year-navbar-control';

export function AdminNavbar({ collapsed, mobileSidebarOpen, resolvedTheme, onCollapsedChange, onMobileSidebarToggle, onThemeToggle }: AdminNavbarProps) {
    const { name } = usePage<SharedData>().props;
    const ThemeIcon = resolvedTheme === 'dark' ? Sun : Moon;

    return (
        <header className="admin-surface sticky top-0 z-40 flex flex-col gap-4 border-b border-[#040DBF]/10 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        if (window.matchMedia('(min-width: 1024px)').matches) {
                            onCollapsedChange(!collapsed);
                            return;
                        }

                        onMobileSidebarToggle();
                    }}
                    className="flex size-11 items-center justify-center rounded-lg border border-[#040DBF]/15 bg-white text-[#020659] shadow-sm transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-md hover:shadow-[#040DBF]/10"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-label="Toggle sidebar"
                    aria-expanded={mobileSidebarOpen || !collapsed}
                >
                    <Menu className="size-5" aria-hidden="true" />
                </button>

                <div>
                    <p className="text-sm font-semibold text-[#010440]">{name}</p>
                    <p className="text-xs text-[#030A8C]">Library attendance monitoring</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onThemeToggle}
                    className="flex size-9 items-center justify-center rounded-full border border-[#040DBF]/10 bg-white text-[#020659] shadow-sm transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#030A8C] hover:shadow-md hover:shadow-[#040DBF]/10"
                    title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    <ThemeIcon className="size-4" aria-hidden="true" />
                </button>
                <SchoolYearNavbarControl />
            </div>
        </header>
    );
}
