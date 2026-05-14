import { cn } from '@/lib/utils';
import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

export type ChartConfig = Record<
    string,
    {
        label?: React.ReactNode;
        color?: string;
    }
>;

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);

    if (!context) {
        throw new Error('useChart must be used within a ChartContainer.');
    }

    return context;
}

function ChartContainer({
    id,
    className,
    children,
    config,
    ...props
}: React.ComponentProps<'div'> & {
    id?: string;
    config: ChartConfig;
    children: React.ReactElement;
}) {
    const uniqueId = React.useId();
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;
    const chartVars = Object.entries(config).reduce<React.CSSProperties>((styles, [key, item]) => {
        if (item.color) {
            styles[`--color-${key}` as keyof React.CSSProperties] = item.color;
        }

        return styles;
    }, {});

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-chart={chartId}
                className={cn(
                    "flex aspect-video justify-center text-xs text-[#020659]/70 [&_.recharts-cartesian-axis-tick_text]:fill-[#020659]/60 [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[#040DBF]/10 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[#040DBF]/20 [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-[#040DBF]/10 [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
                    className,
                )}
                style={{ ...chartVars, ...props.style }}
                {...props}
            >
                <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
    active,
    payload,
    label,
    className,
    hideLabel = false,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
    hideLabel?: boolean;
}) {
    const { config } = useChart();

    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className={cn('grid min-w-36 gap-2 rounded-lg border border-[#040DBF]/10 bg-white/95 p-3 text-sm shadow-xl shadow-[#010440]/10', className)}>
            {!hideLabel && label ? <div className="font-semibold text-[#010440]">{label}</div> : null}
            <div className="grid gap-1.5">
                {payload.map((item) => {
                    const dataKey = String(item.dataKey ?? item.name ?? '');
                    const itemConfig = config[dataKey];
                    const itemLabel = itemConfig?.label ?? item.name ?? dataKey;
                    const itemColor = item.color ?? item.payload?.fill ?? itemConfig?.color ?? '#040DBF';

                    return (
                        <div key={dataKey} className="flex items-center justify-between gap-5">
                            <span className="inline-flex items-center gap-2 text-[#020659]/75">
                                <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: String(itemColor) }} />
                                {itemLabel}
                            </span>
                            <span className="font-semibold tabular-nums text-[#010440]">{Number(item.value ?? 0).toLocaleString()}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
