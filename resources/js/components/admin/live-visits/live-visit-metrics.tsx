import { BriefcaseBusiness, GraduationCap, Library, type LucideIcon } from 'lucide-react';

interface LiveVisitMetricsProps {
    visitsToday: number;
    studentVisitsToday: number;
    employeeVisitsToday: number;
}

export function LiveVisitMetrics({ visitsToday, studentVisitsToday, employeeVisitsToday }: LiveVisitMetricsProps) {
    const metrics: { label: string; value: number; detail: string; icon: LucideIcon }[] = [
        {
            label: 'Visits today',
            value: visitsToday,
            detail: 'Successful RFID scans since midnight',
            icon: Library,
        },
        {
            label: 'Students',
            value: studentVisitsToday,
            detail: 'Student entries logged today',
            icon: GraduationCap,
        },
        {
            label: 'Employees',
            value: employeeVisitsToday,
            detail: 'Employee entries logged today',
            icon: BriefcaseBusiness,
        },
    ];

    return (
        <section className="grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => {
                const Icon = metric.icon;

                return (
                    <div key={metric.label} className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-medium text-[#030A8C]">{metric.label}</p>
                            <div className="flex size-9 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                                <Icon className="size-4" />
                            </div>
                        </div>
                        <p className="mt-3 text-4xl font-semibold tracking-normal text-[#010440]">{metric.value.toLocaleString()}</p>
                        <p className="mt-2 text-sm text-[#020659]/70">{metric.detail}</p>
                    </div>
                );
            })}
        </section>
    );
}
