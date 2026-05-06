import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types/shared';
import { router, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';
import type { AdminNavbarProps } from './admin-layout.types';

export function AdminNavbar({ collapsed, onCollapsedChange }: AdminNavbarProps) {
    const { name, schoolYear } = usePage<SharedData>().props;

    const logout = () => {
        router.post('/logout');
    };

    return (
        <header className="admin-surface sticky top-0 z-40 flex flex-col gap-4 border-b border-[#040DBF]/10 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
                    <p className="text-sm font-semibold text-[#010440]">{name}</p>
                    <p className="text-xs text-[#030A8C]">Library RFID attendance monitor</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {schoolYear && (
                    <span className="admin-school-year-badge inline-flex h-9 items-center overflow-hidden rounded-full border border-[#040DBF]/10 bg-white text-xs shadow-sm">
                        <span className="admin-school-year-label border-r border-[#040DBF]/10 bg-[#f6f8ff] px-3 font-medium text-[#030A8C]">
                            School year
                        </span>
                        <span className="admin-school-year-value px-3 font-semibold text-[#010440]">{schoolYear.name}</span>
                    </span>
                )}

                <Button type="button" variant="outline" onClick={logout}>
                    <LogOut className="size-4" />
                    Log out
                </Button>
            </div>
        </header>
    );
}
