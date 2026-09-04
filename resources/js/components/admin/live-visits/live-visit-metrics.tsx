import { formatTime } from '@/components/admin/dashboard/dashboard-summary';
import { BriefcaseBusiness, Clock3, GraduationCap, Library, type LucideIcon } from 'lucide-react';

interface LiveVisitMetricsProps {
    visitsToday: number;
    studentVisitsToday: number;
    employeeVisitsToday: number;
    scanStartsAt: string;
    scanEndsAt?: string;
}

export function LiveVisitMetrics({
    visitsToday,
    studentVisitsToday,
    employeeVisitsToday,
    scanStartsAt,
    scanEndsAt = '17:00',
}: LiveVisitMetricsProps) {
    const metrics: { label: string; value: string | number; detail: string; icon: LucideIcon; color: string }[] = [
        {
            label: 'Visits Today',
            value: visitsToday.toLocaleString(),
            detail: 'Total scans recorded today',
            icon: Library,
            color: 'text-[#040DBF] bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
        },
        {
            label: 'Students Today',
            value: studentVisitsToday.toLocaleString(),
            detail: 'Student entries logged',
            icon: GraduationCap,
            color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
        },
        {
            label: 'Employees Today',
            value: employeeVisitsToday.toLocaleString(),
            detail: 'Faculty & staff logged',
            icon: BriefcaseBusiness,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
        },
        {
            label: 'Scan Window',
            value: `${formatTime(scanStartsAt)} - ${formatTime(scanEndsAt)}`,
            detail: 'Active automated entry hours',
            icon: Clock3,
            color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
        },
    ];

    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
                const Icon = metric.icon;

                return (
                    <div
                        key={metric.label}
                        className="admin-surface rounded-xl border border-[#040DBF]/10 bg-white/95 p-4 shadow-sm transition hover:border-[#040DBF]/25 dark:border-slate-800 dark:bg-slate-900"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold tracking-wide text-[#030A8C] uppercase dark:text-sky-300">{metric.label}</p>
                            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${metric.color}`}>
                                <Icon className="size-4" />
                            </span>
                        </div>
                        <p className="mt-2 text-2xl font-extrabold tracking-tight text-[#010440] sm:text-3xl dark:text-white">{metric.value}</p>
                        <p className="mt-1.5 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{metric.detail}</p>
                    </div>
                );
            })}
        </section>
    );
}
