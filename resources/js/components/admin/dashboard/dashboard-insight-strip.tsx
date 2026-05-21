import type { DashboardInsight } from '@/components/admin/dashboard/dashboard-insights';
import { CalendarDays, Gauge, TrendingUp } from 'lucide-react';

const icons = [TrendingUp, CalendarDays, Gauge];

export function DashboardInsightStrip({ insights }: { insights: DashboardInsight[] }) {
    return (
        <section className="grid min-w-0 gap-3 lg:grid-cols-3">
            {insights.map((insight, index) => {
                const Icon = icons[index] ?? TrendingUp;

                return (
                    <article key={insight.label} className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                            <span className="admin-icon-badge inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                                <Icon className="size-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#030A8C]">{insight.label}</p>
                                <p className="mt-2 text-2xl font-semibold tracking-normal text-[#010440]">{insight.value}</p>
                                <p className="mt-1 text-sm text-[#020659]/70">{insight.detail}</p>
                            </div>
                        </div>
                    </article>
                );
            })}
        </section>
    );
}
