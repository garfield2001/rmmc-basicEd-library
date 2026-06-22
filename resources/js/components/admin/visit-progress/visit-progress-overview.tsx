import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import type { VisitorTypeFilter, VisitorWithRangeVisits } from '../visit-logs/visit-logs-helpers';
import type { VisitProgressDrilldown } from './visit-progress-drilldown-modal';
import { progressBucketDefinitions, progressBucketForVisitor, progressPercent } from './visit-progress-helpers';
import { Panel } from './visit-progress-panels';

interface VisitProgressOverviewProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    requiredVisits: number;
    onDrilldownOpen: (drilldown: VisitProgressDrilldown) => void;
}

const chartConfig = {
    value: { label: 'Visitors', color: '#14b8a6' },
    percent: { label: 'Progress', color: '#14b8a6' },
} satisfies ChartConfig;

const bucketColors = ['#dc2626', '#f59e0b', '#14b8a6', '#7c3aed', '#059669'];

export function VisitProgressOverview({ visitors, visitorType, requiredVisits, onDrilldownOpen }: VisitProgressOverviewProps) {
    const progress = useMemo(() => buildProgress(visitors, visitorType, requiredVisits), [requiredVisits, visitorType, visitors]);

    return (
        <section className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Panel title="Completion distribution" detail="Click a bar to open the matching people without changing the main table.">
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <BarChart data={progress.buckets} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="4 4" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent hideLabel />} />
                            <Bar
                                dataKey="value"
                                radius={[6, 6, 0, 0]}
                                className="cursor-pointer"
                                onClick={(data) => {
                                    const bucket = data?.payload as ProgressBucketBucket | undefined;

                                    if (bucket) {
                                        onDrilldownOpen({
                                            title: bucket.label,
                                            detail: `${bucket.value.toLocaleString()} ${visitorType === 'student' ? 'students' : 'employees'} in this progress range.`,
                                            visitors: bucket.visitors,
                                        });
                                    }
                                }}
                            >
                                {progress.buckets.map((bucket, index) => (
                                    <Cell key={bucket.label} fill={bucketColors[index % bucketColors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </Panel>

                <Panel
                    title={visitorType === 'student' ? 'Group progress' : 'Department progress'}
                    detail="Click a group to open the matching people."
                >
                    <div className="admin-contained-scroll max-h-55 space-y-2 overflow-y-auto overscroll-contain pr-1">
                        {progress.groups.map((group) => (
                            <button
                                key={group.label}
                                type="button"
                                onClick={() =>
                                    onDrilldownOpen({
                                        title: group.label,
                                        detail: `${group.visitors.length.toLocaleString()} ${visitorType === 'student' ? 'students' : 'employees'} in this group.`,
                                        visitors: group.visitors,
                                    })
                                }
                                className="grid w-full grid-cols-[minmax(0,1fr)_4rem] items-center gap-3 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 py-3 text-left transition hover:border-[#040DBF]/25 hover:bg-white"
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-[#010440]">{group.label}</span>
                                    <span className="mt-2 flex items-center gap-3">
                                        <ProgressBar value={group.percent} className="min-w-0 flex-1" />
                                        <span className="text-xs text-[#020659]/70">{group.noVisits} none</span>
                                    </span>
                                </span>
                                <span className="text-right text-sm font-semibold text-[#030A8C]">{group.percent}%</span>
                            </button>
                        ))}
                    </div>
                </Panel>
            </div>
        </section>
    );
}

type ProgressBucketBucket = ReturnType<typeof buildBuckets>[number];

function buildProgress(visitors: VisitorWithRangeVisits[], visitorType: VisitorTypeFilter, requiredVisits: number) {
    const rows = visitors.filter((visitor) => visitor.type === visitorType);
    const visits = rows.reduce((sum, visitor) => sum + visitor.rangeVisits.length, 0);
    const requiredTotal = rows.length * requiredVisits;

    return {
        total: rows.length,
        visits,
        requiredTotal,
        percent: requiredTotal > 0 ? Math.min(100, Math.round((visits / requiredTotal) * 100)) : 0,
        complete: rows.filter((visitor) => requiredVisits > 0 && visitor.rangeVisits.length >= requiredVisits).length,
        noVisits: rows.filter((visitor) => visitor.rangeVisits.length === 0).length,
        buckets: buildBuckets(rows, requiredVisits),
        groups: buildGroups(rows, visitorType, requiredVisits),
    };
}

function buildBuckets(rows: VisitorWithRangeVisits[], requiredVisits: number) {
    const buckets = progressBucketDefinitions.map((bucket) => ({ ...bucket, value: 0, visitors: [] as VisitorWithRangeVisits[] }));

    rows.forEach((visitor) => {
        const bucket = buckets.find((item) => item.key === progressBucketForVisitor(visitor, requiredVisits));

        if (bucket) {
            bucket.value += 1;
            bucket.visitors.push(visitor);
        }
    });

    return buckets;
}

function buildGroups(rows: VisitorWithRangeVisits[], visitorType: VisitorTypeFilter, requiredVisits: number) {
    const groups = new Map<string, VisitorWithRangeVisits[]>();

    rows.forEach((visitor) => {
        const label =
            visitorType === 'employee'
                ? visitor.department || 'No department'
                : [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'No section';
        groups.set(label, [...(groups.get(label) ?? []), visitor]);
    });

    return [...groups.entries()]
        .map(([label, groupRows]) => ({
            label,
            noVisits: groupRows.filter((visitor) => visitor.rangeVisits.length === 0).length,
            percent: Math.round(
                groupRows.reduce((sum, visitor) => sum + progressPercent(visitor, requiredVisits), 0) / Math.max(1, groupRows.length),
            ),
            visitors: groupRows,
        }))
        .sort((first, second) => first.percent - second.percent || second.noVisits - first.noVisits || first.label.localeCompare(second.label));
}
