import type { LucideIcon } from 'lucide-react';

interface AdministrationStatCardProps {
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
}

export function AdministrationStatCard({ label, value, detail, icon: Icon }: AdministrationStatCardProps) {
    return (
        <div key={label} className="grid gap-3 py-4 sm:grid-cols-[52px_minmax(0,1fr)_150px] sm:items-center sm:gap-4 sm:py-5">
            <div className="flex size-11 items-center justify-center rounded-lg bg-white/10 text-blue-100 ring-1 ring-white/10">
                <Icon className="size-5" />
            </div>
            <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-1 text-sm leading-6 text-blue-100">{detail}</p>
            </div>
            <p className="text-3xl font-semibold tracking-normal text-white sm:text-right sm:text-4xl">{value}</p>
        </div>
    );
}
