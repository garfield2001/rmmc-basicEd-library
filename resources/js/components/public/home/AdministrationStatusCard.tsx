import type { LucideIcon } from 'lucide-react';

interface AdministrationStatusCardProps {
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
}

export function AdministrationStatusCard({ label, value, detail, icon: Icon }: AdministrationStatusCardProps) {
    return (
        <div key={label} className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF] text-white">
                <Icon className="size-5" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-medium tracking-[0.16em] text-blue-200 uppercase">{}</p>
                <p className="mt-1 text-lg font-semibold break-words text-white sm:text-xl">{value}</p>
                <p className="mt-1 text-sm leading-6 text-blue-100">{detail}</p>
            </div>
        </div>
    );
}
