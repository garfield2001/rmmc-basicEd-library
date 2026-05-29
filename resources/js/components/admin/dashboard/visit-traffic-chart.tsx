import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { VisitTrendPoint } from '@/types/dashboard';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { EmptyChartState } from './empty-chart-state';

const trafficChartConfig = {
    students: {
        label: 'Students',
        color: 'var(--chart-1)',
    },
    employees: {
        label: 'Employees',
        color: 'var(--chart-2)',
    },
} satisfies ChartConfig;

export function VisitTrafficChart({
    data,
    emptyMessage = 'No visits have been recorded for this period.',
}: {
    data: VisitTrendPoint[];
    emptyMessage?: string;
}) {
    if (!data.some((point) => point.total > 0)) {
        return <EmptyChartState message={emptyMessage} />;
    }

    const today = new Date().toISOString().slice(0, 10);
    const todayLabel = data.find((point) => point.date === today)?.label;
    const interval = Math.max(0, Math.ceil(data.length / 6) - 1);

    return (
        <ChartContainer config={trafficChartConfig} className="h-80 w-full min-w-0 sm:h-76">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 26 }}>
                <defs>
                    <linearGradient id="students-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-students)" stopOpacity={0.36} />
                        <stop offset="95%" stopColor="var(--color-students)" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="employees-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-employees)" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="var(--color-employees)" stopOpacity={0.04} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval={interval}
                    minTickGap={12}
                    tick={(props) => <TodayTick {...props} todayLabel={todayLabel} />}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area dataKey="students" type="monotone" stroke="var(--color-students)" fill="url(#students-fill)" strokeWidth={2} />
                <Area
                    dataKey="employees"
                    type="monotone"
                    stroke="var(--color-employees)"
                    fill="url(#employees-fill)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ChartContainer>
    );
}

function TodayTick({ x, y, payload, todayLabel }: { x?: number; y?: number; payload?: { value: string }; todayLabel?: string }) {
    const label = payload?.value ?? '';
    const active = Boolean(todayLabel && label === todayLabel);

    return (
        <g transform={`translate(${x ?? 0},${y ?? 0})`}>
            {active && <rect className="admin-today-tick-bg" x={-24} y={2} width={48} height={23} rx={11.5} fill="#dcfce7" />}
            <text x={0} y={18} textAnchor="middle" className={active ? 'admin-today-tick-active text-[11px] font-bold' : 'admin-chart-tick text-[11px]'}>
                {label}
            </text>
        </g>
    );
}
