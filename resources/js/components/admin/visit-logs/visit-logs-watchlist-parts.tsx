import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarChart3, CheckCircle2, type LucideIcon } from 'lucide-react';
import type React from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import type { buildWatchlist, WatchlistGroup } from './visit-log-watchlist';
import { watchlistGroupLabel } from './visit-log-watchlist';

type AttentionRows = ReturnType<typeof buildWatchlist>['attentionRows'];

export function WatchlistTab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
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

export function BreakdownList({
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

export function WatchlistSummaryCard({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
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

export function WatchlistChart({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
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
    value: { label: 'Visitors', color: '#14b8a6' },
    percent: { label: 'Average progress', color: '#14b8a6' },
} satisfies ChartConfig;

const bucketColors = ['#dc2626', '#f59e0b', '#14b8a6', '#7c3aed', '#059669'];

export function ProgressDistributionChart({ data }: { data: Array<{ label: string; value: number }> }) {
    if (!data.some((item) => item.value > 0)) {
        return <EmptyChartMessage>No progress data for this coverage.</EmptyChartMessage>;
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

export function WeakGroupChart({ data }: { data: Array<{ label: string; percent: number; noVisits: number }> }) {
    if (!data.length) {
        return <EmptyChartMessage>No group data for this coverage.</EmptyChartMessage>;
    }

    return (
        <ChartContainer config={watchlistChartConfig} className="h-56 w-full">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" width={128} tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
                <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="percent" name="Average progress" fill="#14b8a6" radius={[0, 6, 6, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

export function WatchlistTable({ rows }: { rows: AttentionRows }) {
    return (
        <div className="overflow-x-auto rounded-lg border border-[#040DBF]/10">
            <table className="min-w-215 text-left text-sm">
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
                <tbody>{rows.length > 0 ? rows.map((row) => <WatchlistTableRow key={row.visitor.id} row={row} />) : <WatchlistEmptyRow />}</tbody>
            </table>
        </div>
    );
}

function WatchlistTableRow({ row }: { row: AttentionRows[number] }) {
    const { visitor, required, visits, percent, todayVisits, remaining } = row;

    return (
        <tr className="border-b border-[#040DBF]/5 last:border-0">
            <td className="px-4 py-3 font-medium text-[#010440]">{visitor.name ?? '-'}</td>
            <td className="px-4 py-3 text-[#020659]/70">{watchlistGroupLabel(visitor)}</td>
            <td className="px-4 py-3 font-semibold text-[#010440]">{visits === 0 ? 'No visits yet' : `${visits} / ${required}`}</td>
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
    );
}

function WatchlistEmptyRow() {
    return (
        <tr>
            <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#020659]/70">
                Everyone in this coverage has met the required visit target.
            </td>
        </tr>
    );
}

function EmptyChartMessage({ children }: { children: React.ReactNode }) {
    return <div className="rounded-lg border border-dashed border-[#040DBF]/15 px-4 py-10 text-center text-sm text-[#020659]/70">{children}</div>;
}

export function studentCount(rows: AttentionRows) {
    return rows.filter((row) => row.visitor.type === 'student').length;
}

export function employeeCount(rows: AttentionRows) {
    return rows.filter((row) => row.visitor.type === 'employee').length;
}
