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
        <section className="admin-surface admin-chart-surface min-w-0 overflow-visible rounded-xl border border-[#040DBF]/10 bg-white/95 p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 space-y-4">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF] dark:bg-sky-500/20 dark:text-sky-400">
                        <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold tracking-tight text-[#010440] dark:text-white">{title}</h2>
                        <p className="mt-1 text-xs leading-5 font-medium wrap-break-word text-slate-600 dark:text-slate-400">{detail}</p>
                    </div>
                </div>
                {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2">{actions}</div>}
            </div>
            {children}
        </section>
    );
}
