import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';
import { RmmcLogoMark } from './RmmcLogoMark';
import type { AdminNavbarProps } from './types';

export function AdminNavbar({ collapsed, onCollapsedChange }: AdminNavbarProps) {
    const { name, schoolYear } = usePage<SharedData>().props;

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

                <RmmcLogoMark />

                <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-zinc-500">Library RFID attendance monitor</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {schoolYear && (
                    <span className="inline-flex h-9 items-center overflow-hidden rounded-full border border-zinc-200 bg-white text-xs shadow-sm">
                        <span className="border-r border-zinc-200 bg-zinc-50 px-3 font-medium text-zinc-500">School year</span>
                        <span className="px-3 font-semibold text-zinc-950">{schoolYear.name}</span>
                    </span>
                )}

                <Button variant="outline" asChild>
                    <Link href="/logout" method="post" as="button">
                        <LogOut className="size-4" />
                        Log out
                    </Link>
                </Button>
            </div>
        </header>
    );
}
