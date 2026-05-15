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
        <article className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-[#030A8C]">{label}</p>
                    <p className="mt-3 text-4xl font-semibold tracking-normal text-[#010440]">{value.toLocaleString()}</p>
                    <p className="mt-3 truncate text-sm text-[#020659]/70">{detail}</p>
                </div>
                <IconBadge icon={Icon} />
            </div>
        </article>
    );
}
