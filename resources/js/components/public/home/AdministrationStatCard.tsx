import type { LucideIcon } from 'lucide-react';

interface AdministrationStatCardProps {
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
}

export function AdministrationStatCard({ label, value, detail, icon: Icon }: AdministrationStatCardProps) {
    return (
        <div
            key={label}
            className="grid gap-3 py-4 sm:grid-cols-[52px_minmax(0,1fr)_150px] sm:items-center sm:gap-4 sm:py-5 2xl:grid-cols-[64px_minmax(0,1fr)_220px] 2xl:gap-6 2xl:py-7"
        >
            <div className="flex size-11 items-center justify-center rounded-lg bg-white/10 text-blue-100 ring-1 ring-white/10 2xl:size-14">
                <Icon className="size-5 2xl:size-7" />
            </div>
            <div>
                <p className="public-display-label font-semibold text-white">{label}</p>
                <p className="public-admin-copy mt-1 text-blue-100">{detail}</p>
            </div>
            <p className="text-3xl font-semibold tracking-normal text-white sm:text-right sm:text-4xl 2xl:text-6xl">{value}</p>
        </div>
    );
}
