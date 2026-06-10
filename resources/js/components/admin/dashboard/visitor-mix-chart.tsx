import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Cell, Pie, PieChart } from 'recharts';
import { EmptyChartState } from './empty-chart-state';

const visitorMixChartConfig = {
    students: {
        label: 'Students',
        color: 'var(--chart-1)',
    },
    employees: {
        label: 'Employees',
        color: 'var(--chart-3)',
    },
} satisfies ChartConfig;

interface VisitorMixChartProps {
    students: number;
    employees: number;
}

export function VisitorMixChart({ students, employees }: VisitorMixChartProps) {
    const data = [
        {
            key: 'students',
            label: 'Students',
            value: students,
            fill: 'var(--color-students)',
        },
        {
            key: 'employees',
            label: 'Employees',
            value: employees,
            fill: 'var(--color-employees)',
        },
    ];

    if (!data.some((point) => point.value > 0)) {
        return <EmptyChartState message="Import students or employees to build this mix." />;
    }

    return (
        <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_11rem] xl:grid-cols-1">
            <ChartContainer config={visitorMixChartConfig} className="admin-chart-frame mx-auto h-56 w-full max-w-xs min-w-0 sm:h-64 sm:max-w-sm">
                <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={data} dataKey="value" nameKey="label" innerRadius={58} outerRadius={92} strokeWidth={5} isAnimationActive={false}>
                        {data.map((entry) => (
                            <Cell key={entry.key} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ChartContainer>
            <div className="grid min-w-0 content-center gap-3">
                {data.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="inline-flex min-w-0 items-center gap-2 font-medium text-[#020659]">
                            <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: item.fill }} />
                            {item.label}
                        </span>
                        <span className="text-lg font-semibold text-[#010440] tabular-nums">{item.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
