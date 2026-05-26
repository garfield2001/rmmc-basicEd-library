import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatDisplayDate } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    AlertTriangle,
    BarChart3,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    GraduationCap,
    ListChecks,
    Target,
    type LucideIcon,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import type { VisitorWithRangeVisits } from './visit-history-helpers';
import { buildWatchlist, matchesWatchlistGroup, watchlistGroupLabel, type WatchlistGroup } from './visit-log-watchlist';

interface VisitHistoryBreakdownProps {
    visitors: VisitorWithRangeVisits[];
    studentRequiredVisits: number;
    employeeRequiredVisits: number;
}

export function VisitHistoryBreakdown({ visitors, studentRequiredVisits, employeeRequiredVisits }: VisitHistoryBreakdownProps) {
    const [open, setOpen] = useState(false);
    const watchlist = useMemo(
        () => buildWatchlist(visitors, studentRequiredVisits, employeeRequiredVisits),
        [employeeRequiredVisits, studentRequiredVisits, visitors],
    );

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-[#010440]">Low-visit watchlist</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">
                        Open the watchlist to review low-activity groups and visitor names for the selected coverage.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button type="button" size="sm" className="gap-2">
                            <ListChecks className="size-4" />
                            Open watchlist
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Low-visit watchlist</DialogTitle>
                            <DialogDescription>
                                Review required-visit progress by person, section, year level, and department as of{' '}
                                {formatDisplayDate(watchlist.today)}.
                            </DialogDescription>
                        </DialogHeader>
                        <WatchlistContent watchlist={watchlist} />
                    </DialogContent>
                </Dialog>
            </div>
        </section>
    );
}

export function VisitHistoryWatchlistPanel({
    visitors,
    studentRequiredVisits,
    employeeRequiredVisits,
    activeType,
    onActiveTypeChange,
}: VisitHistoryBreakdownProps & {
    activeType: 'student' | 'employee';
    onActiveTypeChange: (type: 'student' | 'employee') => void;
}) {
    const watchlist = useMemo(
        () => buildWatchlist(visitors, studentRequiredVisits, employeeRequiredVisits),
        [employeeRequiredVisits, studentRequiredVisits, visitors],
    );

    return <WatchlistContent watchlist={watchlist} activeType={activeType} onActiveTypeChange={onActiveTypeChange} />;
}

function WatchlistContent({
    watchlist,
    activeType: controlledActiveType,
    onActiveTypeChange,
}: {
    watchlist: ReturnType<typeof buildWatchlist>;
    activeType?: 'student' | 'employee';
    onActiveTypeChange?: (type: 'student' | 'employee') => void;
}) {
    const [internalActiveType, setInternalActiveType] = useState<'student' | 'employee'>('student');
    const [activeGroup, setActiveGroup] = useState<WatchlistGroup>(null);
    const isControlled = controlledActiveType !== undefined;
    const activeType = controlledActiveType ?? internalActiveType;
    const changeActiveType = (type: 'student' | 'employee') => {
        setActiveGroup(null);
        setInternalActiveType(type);
        onActiveTypeChange?.(type);
    };
    const visibleRows = watchlist.attentionRows.filter((row) => row.visitor.type === activeType && matchesWatchlistGroup(row.visitor, activeGroup));
    const activeSummary = activeType === 'student' ? watchlist.studentSummary : watchlist.employeeSummary;
    const activeBuckets = activeType === 'student' ? watchlist.studentBuckets : watchlist.employeeBuckets;
    const activeGroups = activeType === 'student' ? watchlist.sections : watchlist.departments;
    const selectGroup = (group: Exclude<WatchlistGroup, null>) => {
        changeActiveType(group.kind === 'department' ? 'employee' : 'student');
        setActiveGroup(group);
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                {isControlled ? (
                    <span className="rounded-full bg-[#040DBF]/10 px-3 py-1.5 text-xs font-semibold text-[#030A8C]">
                        {activeType === 'student' ? 'Student watchlist' : 'Employee watchlist'}
                    </span>
                ) : (
                    <div className="admin-segmented-tabs w-full sm:w-fit">
                        <WatchlistTab
                            active={activeType === 'student'}
                            label="Students"
                            count={studentCount(watchlist.attentionRows)}
                            onClick={() => changeActiveType('student')}
                        />
                        <WatchlistTab
                            active={activeType === 'employee'}
                            label="Employees"
                            count={employeeCount(watchlist.attentionRows)}
                            onClick={() => changeActiveType('employee')}
                        />
                    </div>
                )}
                {activeGroup && (
                    <button
                        type="button"
                        onClick={() => setActiveGroup(null)}
                        className="rounded-full bg-[#040DBF]/10 px-3 py-1.5 text-xs font-semibold text-[#030A8C] transition hover:bg-[#040DBF]/15"
                    >
                        Viewing {activeGroup.label} - clear
                    </button>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <WatchlistSummaryCard
                    icon={Target}
                    label="Target coverage"
                    value={`${activeSummary.percent}%`}
                    detail={`${activeSummary.visits.toLocaleString()} of ${activeSummary.requiredTotal.toLocaleString()} expected visits`}
                />
                <WatchlistSummaryCard
                    icon={AlertTriangle}
                    label="Needs follow-up"
                    value={activeSummary.belowTarget.toLocaleString()}
                    detail={`${activeSummary.metTarget.toLocaleString()} already met the target`}
                />
                <WatchlistSummaryCard
                    icon={ListChecks}
                    label="No visits yet"
                    value={activeSummary.noVisits.toLocaleString()}
                    detail="People with zero recorded visits"
                />
                <WatchlistSummaryCard
                    icon={CalendarDays}
                    label="Active today"
                    value={activeSummary.todayVisitors.toLocaleString()}
                    detail={`${activeSummary.todayVisits.toLocaleString()} visits today`}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
                <WatchlistChart title="Progress distribution" detail="How many people are at each required-visit progress level.">
                    <ProgressDistributionChart data={activeBuckets} />
                </WatchlistChart>
                <WatchlistChart
                    title={activeType === 'student' ? 'Weakest sections' : 'Weakest departments'}
                    detail="Lowest average completion first, with no-visit groups rising to the top."
                >
                    <WeakGroupChart data={activeGroups.slice(0, 8)} />
                </WatchlistChart>
            </div>

            <div className={`grid gap-4 ${activeType === 'student' ? 'xl:grid-cols-2' : 'xl:grid-cols-1'}`}>
                {activeType === 'student' ? (
                    <>
                        <BreakdownList
                            title="Low year levels"
                            icon={GraduationCap}
                            rows={watchlist.yearLevels}
                            kind="yearLevel"
                            onSelect={selectGroup}
                        />
                        <BreakdownList title="Low sections" icon={GraduationCap} rows={watchlist.sections} kind="section" onSelect={selectGroup} />
                    </>
                ) : (
                    <BreakdownList
                        title="Low departments"
                        icon={BriefcaseBusiness}
                        rows={watchlist.departments}
                        kind="department"
                        onSelect={selectGroup}
                    />
                )}
            </div>

            <WatchlistTable rows={visibleRows} />
        </div>
    );
}

function WatchlistTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`admin-segmented-tab rounded-md px-3 py-2 text-sm font-semibold transition ${active ? 'admin-segmented-tab-active' : 'text-[#020659]/75 hover:bg-white hover:text-[#010440]'}`}
        >
            {label} <span className="ml-1 opacity-70">{count}</span>
        </button>
    );
}

function BreakdownList({
    title,
    icon: Icon,
    rows,
    kind,
    onSelect,
}: {
    title: string;
    icon: LucideIcon;
    rows: Array<{ label: string; visitors: number; visits: number; noVisits: number; percent: number }>;
    kind: Exclude<WatchlistGroup, null>['kind'];
    onSelect: (group: Exclude<WatchlistGroup, null>) => void;
}) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-[#010440]">
                <Icon className="size-4 text-[#040DBF]" />
                {title}
            </div>
            <div className="space-y-2">
                {rows.slice(0, 6).map((row) => (
                    <button
                        key={row.label}
                        type="button"
                        onClick={() => onSelect({ kind, label: row.label })}
                        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition hover:bg-white"
                    >
                        <span className="min-w-0">
                            <span className="block truncate font-medium text-[#020659]/80">{row.label}</span>
                            <span className="mt-0.5 block truncate text-xs text-[#020659]/60">
                                {row.visits.toLocaleString()} visits - {row.noVisits.toLocaleString()} no visits
                            </span>
                        </span>
                        <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#010440] shadow-sm">{row.percent}%</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function WatchlistSummaryCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
    return (
        <article className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-[0.12em] text-[#030A8C] uppercase">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-[#010440]">{value}</p>
                </div>
                <span className="admin-icon-badge inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <Icon className="size-4" aria-hidden="true" />
                </span>
            </div>
            <p className="mt-3 text-sm text-[#020659]/70">{detail}</p>
        </article>
    );
}

function WatchlistChart({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
    return (
        <section className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <div className="mb-4 flex items-start gap-3">
                <span className="admin-icon-badge inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <BarChart3 className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <h3 className="font-semibold text-[#010440]">{title}</h3>
                    <p className="mt-1 text-sm text-[#020659]/70">{detail}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

const watchlistChartConfig = {
    value: {
        label: 'Visitors',
        color: '#2563eb',
    },
    percent: {
        label: 'Average progress',
        color: '#2563eb',
    },
} satisfies ChartConfig;

const bucketColors = ['#dc2626', '#f59e0b', '#2563eb', '#7c3aed', '#059669'];

function ProgressDistributionChart({ data }: { data: Array<{ label: string; value: number }> }) {
    if (!data.some((item) => item.value > 0)) {
        return (
            <div className="rounded-lg border border-dashed border-[#040DBF]/15 px-4 py-10 text-center text-sm text-[#020659]/70">
                No progress data for this coverage.
            </div>
        );
    }

    return (
        <ChartContainer config={watchlistChartConfig} className="h-56 w-full">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={entry.label} fill={bucketColors[index % bucketColors.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}

function WeakGroupChart({ data }: { data: Array<{ label: string; percent: number; noVisits: number }> }) {
    if (!data.length) {
        return (
            <div className="rounded-lg border border-dashed border-[#040DBF]/15 px-4 py-10 text-center text-sm text-[#020659]/70">
                No group data for this coverage.
            </div>
        );
    }

    return (
        <ChartContainer config={watchlistChartConfig} className="h-56 w-full">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" width={128} tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="percent" name="Average progress" fill="#2563eb" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

function WatchlistTable({ rows }: { rows: ReturnType<typeof buildWatchlist>['attentionRows'] }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-[#040DBF]/10">
            <table className="min-w-[860px] text-left text-sm">
                <thead className="border-b border-[#040DBF]/10 bg-[#f6f8ff] text-[#020659]/70">
                    <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Group</th>
                        <th className="px-4 py-3">Visits</th>
                        <th className="px-4 py-3">Today</th>
                        <th className="px-4 py-3">Remaining</th>
                        <th className="px-4 py-3">Progress</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length > 0 ? (
                        rows.map(({ visitor, required, visits, percent, todayVisits, remaining }) => (
                            <tr key={visitor.id} className="border-b border-[#040DBF]/5 last:border-0">
                                <td className="px-4 py-3 font-medium text-[#010440]">{visitor.name ?? '-'}</td>
                                <td className="px-4 py-3 text-[#020659]/70">{watchlistGroupLabel(visitor)}</td>
                                <td className="px-4 py-3 font-semibold text-[#010440]">
                                    {visits === 0 ? 'No visits yet' : `${visits} / ${required}`}
                                </td>
                                <td className="px-4 py-3 text-[#020659]/70">{todayVisits > 0 ? todayVisits.toLocaleString() : '-'}</td>
                                <td className="px-4 py-3 text-[#020659]/70">{remaining.toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <ProgressBar value={percent} className="min-w-32 flex-1" />
                                        <span className="inline-flex w-24 items-center justify-end gap-1 text-right font-semibold text-[#020659]">
                                            {percent >= 100 && <CheckCircle2 className="size-3.5 text-emerald-600" />}
                                            {percent}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#020659]/70">
                                Everyone in this coverage has met the required visit target.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function studentCount(rows: ReturnType<typeof buildWatchlist>['attentionRows']) {
    return rows.filter((row) => row.visitor.type === 'student').length;
}

function employeeCount(rows: ReturnType<typeof buildWatchlist>['attentionRows']) {
    return rows.filter((row) => row.visitor.type === 'employee').length;
}
