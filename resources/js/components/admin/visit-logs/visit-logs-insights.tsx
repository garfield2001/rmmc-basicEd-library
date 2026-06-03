import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatDisplayDate } from '@/components/ui/date-input';
import type React from 'react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { VisitInsightModal, type InsightModalState } from './visit-logs-insight-modal';
import { parseVisitDate, toLocalIsoDate, type VisitorTypeFilter, type VisitorWithRangeVisits } from './visit-logs-helpers';

interface VisitLogsInsightsProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    onStudentGroupSelect: (yearLevel: string, section: string) => void;
    onDepartmentSelect: (department: string) => void;
}

const chartConfig = {
    visits: { label: 'Visits', color: '#2563eb' },
} satisfies ChartConfig;

export function VisitLogsInsights({ visitors, visitorType, onStudentGroupSelect, onDepartmentSelect }: VisitLogsInsightsProps) {
    const [modal, setModal] = useState<InsightModalState | null>(null);
    const activity = buildActivity(visitors);
    const groups = buildGroups(visitors, visitorType);
    const groupLabel = visitorType === 'student' ? 'Visits by section' : 'Visits by department';

    return (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <InsightPanel title="Visit activity" detail="Recorded visits from the current filters, grouped for the selected date span." onOpen={() => setModal({ kind: 'activity' })}>
                {activity.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <BarChart data={activity} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="4 4" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent />} />
                            <Bar dataKey="visits" fill="var(--color-visits)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <EmptyInsight>No visit activity matches the current filters.</EmptyInsight>
                )}
            </InsightPanel>

            <InsightPanel title={groupLabel} detail="Open a group to review exact visitors and timestamps.">
                {groups.length > 0 ? (
                    <div className="admin-contained-scroll max-h-[16rem] space-y-2 overflow-y-auto overscroll-contain pr-1">
                        {groups.map((group) => (
                            <button
                                key={group.label}
                                type="button"
                                onClick={() => {
                                    setModal({ kind: 'group', group });
                                }}
                                onDoubleClick={() => {
                                    if (visitorType === 'student') {
                                        onStudentGroupSelect(group.yearLevel, group.section);
                                        return;
                                    }

                                    onDepartmentSelect(group.department);
                                }}
                                className="grid w-full grid-cols-[minmax(0,1fr)_5rem] items-center gap-3 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 py-3 text-left transition hover:border-[#040DBF]/25 hover:bg-white"
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-[#010440]">{group.label}</span>
                                    <span className="mt-2 flex items-center gap-3">
                                        <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#040DBF]/10">
                                            <span className="block h-full rounded-full bg-[#040DBF]" style={{ width: `${group.percent}%` }} />
                                        </span>
                                        <span className="text-xs text-[#020659]/70">{group.visitors} people</span>
                                    </span>
                                </span>
                                <span className="text-right text-sm font-semibold text-[#030A8C]">{group.visits.toLocaleString()}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <EmptyInsight>No group activity matches the current filters.</EmptyInsight>
                )}
            </InsightPanel>
            <VisitInsightModal modal={modal} visitors={visitors} visitorType={visitorType} activity={activity} onOpenChange={(open) => !open && setModal(null)} />
        </section>
    );
}

function InsightPanel({ title, detail, children, onOpen }: { title: string; detail: string; children: React.ReactNode; onOpen?: () => void }) {
    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-[#010440]">{title}</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">{detail}</p>
                </div>
                {onOpen && (
                    <button
                        type="button"
                        onClick={onOpen}
                        className="rounded-lg border border-[#040DBF]/15 bg-white px-3 py-2 text-sm font-semibold text-[#030A8C] transition hover:bg-[#f6f8ff]"
                    >
                        More details
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}

function EmptyInsight({ children }: { children: React.ReactNode }) {
    return <div className="rounded-lg border border-dashed border-[#040DBF]/15 px-4 py-16 text-center text-sm text-[#020659]/70">{children}</div>;
}

export type ActivityInsight = ReturnType<typeof buildActivity>[number];

function buildActivity(visitors: VisitorWithRangeVisits[]) {
    const visits = visitors
        .flatMap((visitor) => visitor.rangeVisits)
        .map((visit) => parseVisitDate(visit.visitedAt))
        .filter((date): date is Date => Boolean(date))
        .sort((first, second) => first.getTime() - second.getTime());
    const uniqueDays = new Set(visits.map(toLocalIsoDate));
    const useMonthBuckets = uniqueDays.size > 45;
    const buckets = new Map<string, { label: string; visits: number }>();

    visits.forEach((date) => {
        const key = useMonthBuckets ? toLocalIsoDate(new Date(date.getFullYear(), date.getMonth(), 1)) : toLocalIsoDate(date);
        const label = useMonthBuckets ? date.toLocaleDateString([], { month: 'short', year: 'numeric' }) : formatShortDate(date);
        const current = buckets.get(key) ?? { label, visits: 0 };

        buckets.set(key, { ...current, visits: current.visits + 1 });
    });

    return [...buckets.entries()].map(([key, value]) => ({ key, ...value }));
}

export type GroupInsight = {
    label: string;
    visits: number;
    visitors: number;
    percent: number;
    yearLevel: string;
    section: string;
    department: string;
};

function buildGroups(visitors: VisitorWithRangeVisits[], visitorType: VisitorTypeFilter): GroupInsight[] {
    const groups = new Map<string, GroupInsight>();

    visitors.forEach((visitor) => {
        const label =
            visitorType === 'student' ? [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'Unassigned' : visitor.department || 'Unassigned';
        const current = groups.get(label) ?? {
            label,
            visits: 0,
            visitors: 0,
            percent: 0,
            yearLevel: visitor.yearLevel ?? '',
            section: visitor.section ?? '',
            department: visitor.department ?? '',
        };

        groups.set(label, {
            ...current,
            visits: current.visits + visitor.rangeVisits.length,
            visitors: current.visitors + 1,
        });
    });

    const maxVisits = Math.max(1, ...[...groups.values()].map((group) => group.visits));

    return [...groups.values()]
        .map((group) => ({ ...group, percent: Math.max(4, Math.round((group.visits / maxVisits) * 100)) }))
        .sort((first, second) => second.visits - first.visits || first.label.localeCompare(second.label));
}

function formatShortDate(date: Date) {
    return formatDisplayDate(toLocalIsoDate(date)).replace(`, ${date.getFullYear()}`, '');
}
