import type { ActivityChartPoint } from '@/components/admin/dashboard/activity-breakdown-helpers';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { EmptyChartState } from './empty-chart-state';

const defaultChartConfig = {
    value: {
        label: 'Visits',
        color: '#6ea0ee',
    },
} satisfies ChartConfig;

interface HorizontalBarChartProps {
    data: ActivityChartPoint[];
    emptyMessage: string;
    labelWidth?: number;
    height?: number;
}

export function HorizontalBarChart({ data, emptyMessage, labelWidth = 104, height = 320 }: HorizontalBarChartProps) {
    if (!data.some((point) => point.value > 0)) {
        return <EmptyChartState message={emptyMessage} />;
    }

    const segmentConfig = data.reduce<ChartConfig>((config, point) => {
        point.segments?.forEach((segment) => {
            config[segment.key] = {
                label: segment.label,
                color: segment.color,
            };
        });

        return config;
    }, {});
    const hasSegments = Object.keys(segmentConfig).length > 0;
    const chartConfig = hasSegments ? segmentConfig : defaultChartConfig;

    const CustomTooltip = ({
        active,
        payload,
        label,
    }: {
        active?: boolean;
        payload?: { payload: ActivityChartPoint }[];
        label?: React.ReactNode;
    }) => {
        if (!active || !payload || !payload.length) return null;

        const pointData = payload[0].payload as ActivityChartPoint;

        if (pointData.segments && pointData.segments.length > 0) {
            const segmentsPayload = pointData.segments.map((seg) => ({
                dataKey: seg.key,
                name: seg.label,
                color: seg.color,
                value: seg.value,
            }));
            return <ChartTooltipContent active={active} payload={segmentsPayload} label={label} />;
        }

        return <ChartTooltipContent active={active} payload={payload} label={label} />;
    };

    return (
        <div className="admin-chart-frame">
            <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="4 4" />
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={labelWidth} tickMargin={10} className="text-xs" />
                    <ChartTooltip cursor={{ fill: 'rgb(4 13 191 / 0.06)' }} content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[0, 6, 6, 0]} isAnimationActive={false} />
                </BarChart>
            </ChartContainer>
        </div>
    );
}
