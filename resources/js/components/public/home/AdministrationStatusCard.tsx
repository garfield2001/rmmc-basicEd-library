import type { LucideIcon } from 'lucide-react';

interface AdministrationStatusCardProps {
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
}

export function AdministrationStatusCard({ label, value, detail, icon: Icon }: AdministrationStatusCardProps) {
    return (
        <div key={label} className="flex gap-4 2xl:gap-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF] text-white 2xl:size-12">
                <Icon className="size-5 2xl:size-6" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.16em] text-blue-200 uppercase 2xl:text-sm">{label}</p>
                <p className="mt-1 text-lg font-semibold break-words text-white sm:text-xl 2xl:text-3xl">{value}</p>
                <p className="public-admin-copy mt-1 text-blue-100">{detail}</p>
            </div>
        </div>
    );
}
