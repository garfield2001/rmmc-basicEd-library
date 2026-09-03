import { IconBadge } from '@/components/ui/icon-badge';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: number;
    detail: string;
    icon: LucideIcon;
}

export function MetricCard({ label, value, detail, icon: Icon }: MetricCardProps) {
    return (
        <article className="admin-surface rounded-xl border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-bold tracking-wide text-[#030A8C] uppercase dark:text-sky-300">{label}</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-[#010440] dark:text-white sm:text-4xl">{value.toLocaleString()}</p>
                    <p className="mt-2.5 truncate text-xs font-medium text-slate-600 dark:text-slate-400">{detail}</p>
                </div>
                <IconBadge icon={Icon} />
            </div>
        </article>
    );
}
