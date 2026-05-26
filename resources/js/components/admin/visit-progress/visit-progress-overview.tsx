import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { AlertTriangle, CheckCircle2, ListChecks, Target, UserRoundX, type LucideIcon } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import type { VisitorTypeFilter, VisitorWithRangeVisits } from '../visits-history/visit-history-helpers';
import { buildWatchlist } from '../visits-history/visit-log-watchlist';

interface VisitProgressOverviewProps {
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    studentRequiredVisits: number;
    employeeRequiredVisits: number;
    onYearLevelSelect: (value: string) => void;
    onSectionSelect: (yearLevel: string, section: string) => void;
    onDepartmentSelect: (value: string) => void;
}

const chartConfig = {
    value: {
        label: 'People',
        color: '#2563eb',
    },
    noVisits: {
        label: 'No visits',
        color: '#dc2626',
    },
} satisfies ChartConfig;

const bucketColors = ['#dc2626', '#f59e0b', '#2563eb', '#7c3aed', '#059669'];

export function VisitProgressOverview({
    visitors,
    visitorType,
    studentRequiredVisits,
    employeeRequiredVisits,
    onYearLevelSelect,
    onSectionSelect,
    onDepartmentSelect,
}: VisitProgressOverviewProps) {
    const watchlist = useMemo(
        () => buildWatchlist(visitors, studentRequiredVisits, employeeRequiredVisits),
        [employeeRequiredVisits, studentRequiredVisits, visitors],
    );
    const summary = visitorType === 'employee' ? watchlist.employeeSummary : watchlist.studentSummary;
    const buckets = visitorType === 'employee' ? watchlist.employeeBuckets : watchlist.studentBuckets;
    const groups = visitorType === 'employee' ? watchlist.departments : watchlist.sections;
    const yearLevelGroups = watchlist.yearLevels.slice(0, 6);
    const strongestGroups = [...groups].sort((first, second) => second.percent - first.percent || first.noVisits - second.noVisits).slice(0, 5);
    const weakGroups = groups.slice(0, 6);
    const audience = visitorType === 'employee' ? 'employees' : 'students';

    return (
        <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <ProgressSummaryCard
                    icon={Target}
                    label="Overall completion"
                    value={`${summary.percent}%`}
                    detail={`${summary.visits.toLocaleString()} of ${summary.requiredTotal.toLocaleString()} expected visits`}
                />
                <ProgressSummaryCard
                    icon={CheckCircle2}
                    label="Completed"
                    value={summary.metTarget.toLocaleString()}
                    detail={`${audience} already meeting the target`}
                />
                <ProgressSummaryCard
                    icon={UserRoundX}
                    label="No visits"
                    value={summary.noVisits.toLocaleString()}
                    detail={`${audience} with no visits in this coverage`}
                />
                <ProgressSummaryCard
                    icon={AlertTriangle}
                    label="Need follow-up"
                    value={summary.belowTarget.toLocaleString()}
                    detail={`${audience} still below required visits`}
                />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <ProgressChart title="Completion distribution" detail="A quick view of how many people are at each progress level.">
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <BarChart data={buckets} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="4 4" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {buckets.map((entry, index) => (
                                    <Cell key={entry.label} fill={bucketColors[index % bucketColors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </ProgressChart>

                <ProgressChart
                    title={visitorType === 'employee' ? 'No visits by department' : 'No visits by year level and section'}
                    detail="Groups with the largest number of people who still have no visits."
                >
                    {visitorType === 'student' ? (
                        <div className="grid gap-3 lg:grid-cols-2">
                            <GroupActionList
                                title="Year levels"
                                groups={yearLevelGroups}
                                visitorType={visitorType}
                                onYearLevelSelect={onYearLevelSelect}
                                onSectionSelect={onSectionSelect}
                                onDepartmentSelect={onDepartmentSelect}
                            />
                            <GroupActionList
                                title="Sections"
                                groups={weakGroups}
                                visitorType={visitorType}
                                onYearLevelSelect={onYearLevelSelect}
                                onSectionSelect={onSectionSelect}
                                onDepartmentSelect={onDepartmentSelect}
                            />
                        </div>
                    ) : weakGroups.length > 0 ? (
                        <GroupActionList
                            groups={weakGroups}
                            visitorType={visitorType}
                            onYearLevelSelect={onYearLevelSelect}
                            onSectionSelect={onSectionSelect}
                            onDepartmentSelect={onDepartmentSelect}
                        />
                    ) : (
                        <EmptyProgressMessage>No group data for this coverage.</EmptyProgressMessage>
                    )}
                </ProgressChart>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <ProgressChart title="Strongest groups" detail="Highest average completion first.">
                    <div className="space-y-3">
                        {strongestGroups.map((group) => (
                            <div key={group.label} className="rounded-lg border border-[#040DBF]/10 bg-white px-3 py-3">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="min-w-0 truncate text-sm font-semibold text-[#010440]">{group.label}</span>
                                    <span className="shrink-0 text-sm font-semibold text-[#030A8C]">{group.percent}%</span>
                                </div>
                                <div className="mt-2 flex items-center gap-3">
                                    <ProgressBar value={group.percent} className="min-w-0 flex-1" />
                                    <span className="w-28 text-right text-xs text-[#020659]/70">{group.metTarget.toLocaleString()} complete</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ProgressChart>

                <ProgressChart title="Staff action guide" detail="Plain-language next steps based on the current view.">
                    <div className="space-y-3 text-sm text-[#020659]/75">
                        <ActionLine icon={ListChecks} text="Start with groups that have the highest no-visit count." />
                        <ActionLine icon={AlertTriangle} text="Use Watchlist for people still below the required visit target." />
                        <ActionLine icon={CheckCircle2} text="Use Progress to confirm who already completed the target." />
                    </div>
                </ProgressChart>
            </div>
        </section>
    );
}

function GroupActionList({
    title,
    groups,
    visitorType,
    onYearLevelSelect,
    onSectionSelect,
    onDepartmentSelect,
}: {
    title?: string;
    groups: Array<{ label: string; visitors: number; noVisits: number; percent: number }>;
    visitorType: VisitorTypeFilter;
    onYearLevelSelect: (value: string) => void;
    onSectionSelect: (yearLevel: string, section: string) => void;
    onDepartmentSelect: (value: string) => void;
}) {
    if (!groups.length) {
        return <EmptyProgressMessage>No group data.</EmptyProgressMessage>;
    }

    return (
        <div>
            {title && <h3 className="mb-2 text-sm font-semibold text-[#010440]">{title}</h3>}
            <div className="space-y-2">
                {groups.map((group) => (
                    <GroupAction
                        key={group.label}
                        group={group}
                        visitorType={visitorType}
                        onYearLevelSelect={onYearLevelSelect}
                        onSectionSelect={onSectionSelect}
                        onDepartmentSelect={onDepartmentSelect}
                    />
                ))}
            </div>
        </div>
    );
}

function GroupAction({
    group,
    visitorType,
    onYearLevelSelect,
    onSectionSelect,
    onDepartmentSelect,
}: {
    group: { label: string; visitors: number; noVisits: number; percent: number };
    visitorType: VisitorTypeFilter;
    onYearLevelSelect: (value: string) => void;
    onSectionSelect: (yearLevel: string, section: string) => void;
    onDepartmentSelect: (value: string) => void;
}) {
    const chooseGroup = () => {
        if (visitorType === 'employee') {
            onDepartmentSelect(group.label);
            return;
        }

        const [yearLevel, section] = group.label.split(' - ');

        if (yearLevel && section) {
            onSectionSelect(yearLevel, section);
            return;
        }

        onYearLevelSelect(group.label);
    };

    return (
        <button
            type="button"
            onClick={chooseGroup}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-[#040DBF]/10 bg-white px-3 py-3 text-left transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff]"
        >
            <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#010440]">{group.label}</span>
                <span className="mt-1 block text-xs text-[#020659]/65">
                    {group.noVisits.toLocaleString()} no visits out of {group.visitors.toLocaleString()}
                </span>
            </span>
            <span className="rounded-md bg-[#040DBF]/10 px-2 py-1 text-xs font-semibold text-[#030A8C]">{group.percent}%</span>
        </button>
    );
}

function ProgressSummaryCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
    return (
        <article className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-[#030A8C]">{label}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-normal text-[#010440]">{value}</p>
                </div>
                <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <Icon className="size-5" />
                </span>
            </div>
            <p className="mt-3 text-sm text-[#020659]/70">{detail}</p>
        </article>
    );
}

function ProgressChart({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#010440]">{title}</h2>
            <p className="mt-1 text-sm text-[#020659]/70">{detail}</p>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function ActionLine({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-3 py-3">
            <span className="admin-icon-badge inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                <Icon className="size-4" />
            </span>
            <p>{text}</p>
        </div>
    );
}

function EmptyProgressMessage({ children }: { children: React.ReactNode }) {
    return <div className="rounded-lg border border-dashed border-[#040DBF]/15 px-4 py-10 text-center text-sm text-[#020659]/70">{children}</div>;
}
