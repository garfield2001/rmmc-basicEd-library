import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { RmmcLogoMark } from './RmmcLogoMark';

export function AdminTopBar() {
    const { name } = usePage<SharedData>().props;

    return (
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <RmmcLogoMark />
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
