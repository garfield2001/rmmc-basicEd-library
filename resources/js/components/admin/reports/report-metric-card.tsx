import type { LucideIcon } from 'lucide-react';

interface ReportMetricCardProps {
    icon: LucideIcon;
    label: string;
    value: number;
    detail?: string;
}

export function ReportMetricCard({ icon: Icon, label, value, detail }: ReportMetricCardProps) {
    return (
        <div className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-[#030A8C]">{label}</p>
                    <p className="mt-3 text-4xl font-semibold tracking-normal text-[#010440]">{value.toLocaleString()}</p>
                </div>
                <span className="admin-icon-badge inline-flex size-10 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <Icon className="size-5" />
                </span>
            </div>
            {detail && <p className="mt-3 text-sm text-[#020659]/70">{detail}</p>}
        </div>
    );
}
