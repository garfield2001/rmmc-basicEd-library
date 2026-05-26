import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { IndividualProgressPoint } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, Target, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartCard } from './chart-card';

const individualProgressConfig = {
    percent: {
        label: 'Progress',
        color: '#2563eb',
    },
} satisfies ChartConfig;

export function IndividualProgressPanel({ progress }: { progress: IndividualProgressPoint[] }) {
    const [activeType, setActiveType] = useState<'student' | 'employee'>('student');
    const activeRows = useMemo(
        () =>
            progress
                .filter((row) => row.type === activeType)
                .sort(
                    (first, second) => first.percent - second.percent || second.remaining - first.remaining || first.name.localeCompare(second.name),
                ),
        [activeType, progress],
    );
    const chartRows = activeRows.slice(0, 12).map((row) => ({
        ...row,
        label: row.name.length > 22 ? `${row.name.slice(0, 21)}...` : row.name,
    }));
    const completeCount = activeRows.filter((row) => row.percent >= 100).length;
    const noVisitCount = activeRows.filter((row) => row.visits === 0).length;

    return (
        <ChartCard
            title="Individual Visit Progress"
            detail="Lowest required-visit completion first, based on the active school year."
            icon={Target}
            actions={
                <div className="admin-segmented-tabs w-full sm:w-fit">
                    <ProgressTab
                        active={activeType === 'student'}
                        icon={GraduationCap}
                        label="Students"
                        count={studentCount(progress)}
                        onClick={() => setActiveType('student')}
                    />
                    <ProgressTab
                        active={activeType === 'employee'}
                        icon={BriefcaseBusiness}
                        label="Employees"
                        count={employeeCount(progress)}
                        onClick={() => setActiveType('employee')}
                    />
                </div>
            }
        >
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)]">
                <section className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-[#010440]">Lowest individual progress</h3>
                            <p className="mt-1 text-sm text-[#020659]/70">Top 12 people needing the most follow-up.</p>
                        </div>
                        <p className="text-xs font-semibold text-[#030A8C]">
                            {completeCount.toLocaleString()} complete - {noVisitCount.toLocaleString()} no visits
                        </p>
                    </div>
                    {chartRows.length > 0 ? (
                        <ChartContainer config={individualProgressConfig} className="h-80 w-full">
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
                        <div className="rounded-lg border border-dashed border-[#040DBF]/15 px-4 py-12 text-center text-sm text-[#020659]/70">
                            No individual progress data is available yet.
                        </div>
                    )}
                </section>

                <section className="overflow-hidden rounded-lg border border-[#040DBF]/10">
                    <div className="border-b border-[#040DBF]/10 bg-[#f6f8ff] px-4 py-3">
                        <h3 className="font-semibold text-[#010440]">Follow-up list</h3>
                        <p className="mt-1 text-sm text-[#020659]/70">Sorted by lowest completion.</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {activeRows.slice(0, 16).map((row) => (
                            <div key={row.id} className="border-b border-[#040DBF]/5 px-4 py-3 last:border-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-[#010440]">{row.name}</p>
                                        <p className="mt-1 truncate text-xs text-[#020659]/65">
                                            {row.schoolId ?? 'No school ID'} - {row.group}
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
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </ChartCard>
    );
}

function ProgressTab({
    active,
    icon: Icon,
    label,
    count,
    onClick,
}: {
    active: boolean;
    icon: LucideIcon;
    label: string;
    count: number;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`admin-segmented-tab rounded-md px-3 py-2 text-sm font-semibold transition ${active ? 'admin-segmented-tab-active' : ''}`}
        >
            <Icon className="size-3.5" />
            {label}
            <span className={active ? 'text-white/75' : 'text-[#030A8C]/60'}>{count.toLocaleString()}</span>
        </button>
    );
}

function studentCount(progress: IndividualProgressPoint[]) {
    return progress.filter((row) => row.type === 'student').length;
}

function employeeCount(progress: IndividualProgressPoint[]) {
    return progress.filter((row) => row.type === 'employee').length;
}
