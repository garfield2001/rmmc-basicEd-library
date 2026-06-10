import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { ChartPoint } from '@/types/dashboard';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { EmptyChartState } from './empty-chart-state';

const studentGroupChartConfig = {
    value: {
        label: 'Visits',
        color: '#6ea0ee',
    },
} satisfies ChartConfig;

interface HorizontalBarChartProps {
    data: ChartPoint[];
    emptyMessage: string;
    labelWidth?: number;
    height?: number;
}

export function HorizontalBarChart({ data, emptyMessage, labelWidth = 104, height = 320 }: HorizontalBarChartProps) {
    if (!data.some((point) => point.value > 0)) {
        return <EmptyChartState message={emptyMessage} />;
    }

    return (
        <div className="admin-chart-frame">
            <ChartContainer config={studentGroupChartConfig} className="w-full" style={{ height }}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={labelWidth} tickMargin={10} className="text-xs" />
                    <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" fill="#6ea0ee" radius={[0, 6, 6, 0]} isAnimationActive={false} />
                </BarChart>
            </ChartContainer>
        </div>
    );
}
