import type { LucideIcon } from 'lucide-react';

interface PublicMetricCardProps {
    label: string;
    value: string | number;
    detail: string;
    icon: LucideIcon;
}

export function PublicMetricCard({ label, value, detail, icon: Icon }: PublicMetricCardProps) {
    return (
        <div key={label} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-zinc-500">{label}</p>
                <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700">
                    <Icon className="size-4" />
                </div>
            </div>
            <p className="mt-3 text-4xl font-semibold">{value.toLocaleString()}</p>
            <p className="mt-2 text-sm text-zinc-500">{detail}</p>
        </div>
    );
}
