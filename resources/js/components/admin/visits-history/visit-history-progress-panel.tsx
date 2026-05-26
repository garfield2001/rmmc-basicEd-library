import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart3 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { VisitorTypeFilter, VisitorWithRangeVisits } from './visit-history-helpers';
import { watchlistGroupLabel } from './visit-log-watchlist';

interface VisitHistoryProgressPanelProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    studentRequiredVisits: number;
    employeeRequiredVisits: number;
    onVisitorOpen: (visitor: VisitorWithRangeVisits) => void;
}

const progressConfig = {
    percent: {
        label: 'Progress',
        color: '#2563eb',
    },
} satisfies ChartConfig;

export function VisitHistoryProgressPanel({
    visitors,
    visitorType,
    studentRequiredVisits,
    employeeRequiredVisits,
    onVisitorOpen,
}: VisitHistoryProgressPanelProps) {
    const required = visitorType === 'employee' ? employeeRequiredVisits : studentRequiredVisits;
    const rows = visitors
        .filter((visitor) => visitor.type === visitorType && required > 0)
        .map((visitor) => {
            const visits = visitor.rangeVisits.length;

            return {
                visitor,
                visits,
                required,
                remaining: Math.max(0, required - visits),
                percent: Math.min(100, Math.round((visits / required) * 100)),
            };
        })
        .sort((first, second) => first.percent - second.percent || second.remaining - first.remaining || first.visits - second.visits);
    const chartRows = rows.slice(0, 12).map((row) => ({
        ...row,
        label: (row.visitor.name ?? 'Unnamed visitor').length > 22 ? `${(row.visitor.name ?? 'Unnamed visitor').slice(0, 21)}...` : row.visitor.name,
    }));
    const completeCount = rows.filter((row) => row.percent >= 100).length;
    const noVisitCount = rows.filter((row) => row.visits === 0).length;
    const averagePercent = rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length) : 0;

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                        <BarChart3 className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-[#010440]">Individual Progress</h2>
                        <p className="mt-1 text-sm leading-6 text-[#020659]/70">
                            {visitorType === 'student' ? 'Student' : 'Employee'} required-visit completion for the selected date coverage.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#030A8C]">
                    <span className="rounded-full bg-[#040DBF]/10 px-3 py-1.5">{averagePercent}% average</span>
                    <span className="rounded-full bg-[#040DBF]/10 px-3 py-1.5">{completeCount.toLocaleString()} complete</span>
                    <span className="rounded-full bg-[#040DBF]/10 px-3 py-1.5">{noVisitCount.toLocaleString()} no visits</span>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(24rem,0.85fr)]">
                <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
                    <h3 className="font-semibold text-[#010440]">Lowest progress first</h3>
                    <p className="mt-1 text-sm text-[#020659]/70">Top 12 people needing attention.</p>
                    {chartRows.length > 0 ? (
                        <ChartContainer config={progressConfig} className="mt-4 h-80 w-full">
                            <BarChart data={chartRows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                                <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                                <YAxis
                                    dataKey="label"
                                    type="category"
                                    width={150}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    className="text-xs"
                                />
                                <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="percent" fill="#2563eb" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <div className="mt-4 rounded-lg border border-dashed border-[#040DBF]/15 px-4 py-12 text-center text-sm text-[#020659]/70">
                            No progress data for this selected coverage.
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-lg border border-[#040DBF]/10">
                    <div className="border-b border-[#040DBF]/10 bg-[#f6f8ff] px-4 py-3">
                        <h3 className="font-semibold text-[#010440]">Follow-up ranking</h3>
                        <p className="mt-1 text-sm text-[#020659]/70">Click a person to open their full visit history.</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {rows.slice(0, 18).map((row) => (
                            <button
                                key={row.visitor.id}
                                type="button"
                                onClick={() => onVisitorOpen(row.visitor)}
                                className="block w-full border-b border-[#040DBF]/5 px-4 py-3 text-left transition last:border-0 hover:bg-[#f6f8ff]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-[#010440]">{row.visitor.name ?? '-'}</p>
                                        <p className="mt-1 truncate text-xs text-[#020659]/65">
                                            {row.visitor.schoolId ?? 'No ID'} - {watchlistGroupLabel(row.visitor)}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold text-[#010440]">{row.percent}%</span>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                    <ProgressBar value={row.percent} className="min-w-0 flex-1" />
                                    <span className="w-24 text-right text-xs font-medium text-[#020659]/70">
                                        {row.visits}/{row.required} visits
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
