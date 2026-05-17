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

export function VisitTrafficChart({ data, emptyMessage = 'No visits have been recorded for this period.' }: { data: VisitTrendPoint[]; emptyMessage?: string }) {
    if (!data.some((point) => point.total > 0)) {
        return <EmptyChartState message={emptyMessage} />;
    }

    return (
        <ChartContainer config={trafficChartConfig} className="h-76 w-full">
            <AreaChart data={data} margin={{ top: 12, right: 20, left: 0, bottom: 0 }}>
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
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area dataKey="students" type="monotone" stackId="visits" stroke="var(--color-students)" fill="url(#students-fill)" strokeWidth={2} />
                <Area
                    dataKey="employees"
                    type="monotone"
                    stackId="visits"
                    stroke="var(--color-employees)"
                    fill="url(#employees-fill)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ChartContainer>
    );
}
