import type { VisitorDistribution, VisitorDistributionPoint, VisitorType } from '@/components/admin/registered-visitors/table/visitors-index-types';
import { BarChart3, BriefcaseBusiness, ChevronLeft, GraduationCap } from 'lucide-react';
import { useMemo, useState } from 'react';

interface VisitorDistributionChartProps {
    activeType: VisitorType;
    distribution: VisitorDistribution;
}

export function VisitorDistributionChart({ activeType, distribution }: VisitorDistributionChartProps) {
    const [selectedYearLevel, setSelectedYearLevel] = useState<string | null>(null);
    const isStudent = activeType === 'student';
    const sectionData = selectedYearLevel ? (distribution.students.sectionsByYearLevel[selectedYearLevel] ?? []) : [];
    const data = isStudent ? (selectedYearLevel ? sectionData : distribution.students.yearLevels) : distribution.employees.departments;
    const maxCount = useMemo(() => Math.max(1, ...data.map((point) => point.count)), [data]);
    const title = isStudent ? (selectedYearLevel ? `${selectedYearLevel} Sections` : 'Students by Year Level') : 'Employees by Department';
    const detail = isStudent
        ? selectedYearLevel
            ? 'Section counts are sorted alphabetically.'
            : 'Click a year level to compare its sections.'
        : 'Department counts are sorted alphabetically.';
    const Icon = isStudent ? GraduationCap : BriefcaseBusiness;

    return (
        <section className="admin-surface admin-chart-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                        <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold tracking-normal text-[#010440]">{title}</h2>
                        <p className="mt-1 text-sm text-[#020659]/70">{detail}</p>
                    </div>
                </div>
                {isStudent && selectedYearLevel && (
                    <button
                        type="button"
                        onClick={() => setSelectedYearLevel(null)}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#040DBF]/10 bg-white px-3 text-sm font-semibold text-[#030A8C] transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff]"
                    >
                        <ChevronLeft className="size-4" />
                        All year levels
                    </button>
                )}
            </div>

            {data.length > 0 ? (
                <div className="grid gap-2">
                    {data.map((point) => (
                        <DistributionBar
                            key={point.label}
                            point={point}
                            maxCount={maxCount}
                            interactive={isStudent && !selectedYearLevel}
                            selected={selectedYearLevel === point.label}
                            onClick={() => {
                                if (isStudent && !selectedYearLevel) {
                                    setSelectedYearLevel(point.label);
                                }
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#040DBF]/15 bg-[#f6f8ff] px-4 py-8 text-center">
                    <BarChart3 className="size-8 text-[#040DBF]/40" />
                    <p className="text-sm font-medium text-[#020659]/70">No distribution data is available for the active school year.</p>
                </div>
            )}
        </section>
    );
}

function DistributionBar({
    point,
    maxCount,
    interactive,
    selected,
    onClick,
}: {
    point: VisitorDistributionPoint;
    maxCount: number;
    interactive: boolean;
    selected: boolean;
    onClick: () => void;
}) {
    const percent = Math.max(4, Math.round((point.count / maxCount) * 100));
    const Wrapper = interactive ? 'button' : 'div';

    return (
        <Wrapper
            type={interactive ? 'button' : undefined}
            onClick={interactive ? onClick : undefined}
            className={`grid min-h-14 grid-cols-[minmax(8rem,14rem)_minmax(0,1fr)_4rem] items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                selected
                    ? 'border-[#040DBF] bg-[#040DBF]/10'
                    : interactive
                      ? 'border-[#040DBF]/10 bg-[#f8fbff] hover:border-[#040DBF]/25 hover:bg-white hover:shadow-sm'
                      : 'border-[#040DBF]/10 bg-[#f8fbff]'
            }`}
        >
            <span className="truncate text-sm font-semibold text-[#010440]">{point.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-[#040DBF]/10">
                <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#0284c7_0%,#2563eb_48%,#16a34a_100%)]"
                    style={{ width: `${percent}%` }}
                />
            </span>
            <span className="text-right text-sm font-semibold tabular-nums text-[#030A8C]">{point.count.toLocaleString()}</span>
        </Wrapper>
    );
}
