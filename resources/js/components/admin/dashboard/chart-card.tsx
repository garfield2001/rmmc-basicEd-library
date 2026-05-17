import type { LucideIcon } from 'lucide-react';
import type React from 'react';

interface ChartCardProps {
    title: string;
    detail: string;
    icon: LucideIcon;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

export function ChartCard({ title, detail, icon: Icon, actions, children }: ChartCardProps) {
    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">{title}</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">{detail}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    {actions}
                    <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                        <Icon className="size-5" />
                    </span>
                </div>
            </div>
            {children}
        </section>
    );
}
