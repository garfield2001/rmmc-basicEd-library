import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import type { VisitHistoryVisitor } from '@/types/dashboard';
import { BriefcaseBusiness, GraduationCap, type LucideIcon } from 'lucide-react';

interface VisitHistoryBreakdownProps {
    visitors: VisitHistoryVisitor[];
    studentRequiredVisits: number;
    employeeRequiredVisits: number;
}

export function VisitHistoryBreakdown({ visitors, studentRequiredVisits, employeeRequiredVisits }: VisitHistoryBreakdownProps) {
    const students = visitors.filter((visitor) => visitor.type === 'student');
    const employees = visitors.filter((visitor) => visitor.type === 'employee');
    const yearLevels = groupedCounts(students, (visitor) => visitor.yearLevel || 'Unassigned');
    const sections = groupedCounts(students, (visitor) => [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'Unassigned');
    const departments = groupedCounts(employees, (visitor) => visitor.department || 'Unassigned');
    const attentionRows = [...students, ...employees]
        .map((visitor) => {
            const required = visitor.type === 'employee' ? employeeRequiredVisits : studentRequiredVisits;
            const visits = visitor.visits.length;

            return {
                visitor,
                required,
                visits,
                percent: required > 0 ? Math.min(100, Math.round((visits / required) * 100)) : 0,
            };
        })
        .filter((row) => row.required > 0 && row.visits < row.required)
        .sort((first, second) => first.percent - second.percent || first.visits - second.visits)
        .slice(0, 8);

    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-[#010440]">Visit progress breakdown</h2>
                    <p className="mt-1 text-sm text-[#020659]/70">The attention list shows visitors below the required target, with no-visit cases called out clearly.</p>
                </div>
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
                <BreakdownList title="Students by year level" icon={GraduationCap} rows={yearLevels} />
                <BreakdownList title="Students by section" icon={GraduationCap} rows={sections} />
                <BreakdownList title="Employees by department" icon={BriefcaseBusiness} rows={departments} />
            </div>
            <div className="mt-5 overflow-x-auto">
                <table className="min-w-[720px] text-left text-sm">
                    <thead className="border-b border-[#040DBF]/10 text-[#020659]/70">
                        <tr>
                            <th className="py-2 pr-4">Name</th>
                            <th className="py-2 pr-4">Group</th>
                            <th className="py-2 pr-4">Visits</th>
                            <th className="py-2 pr-4">Progress</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attentionRows.length > 0 ? (
                            attentionRows.map(({ visitor, required, visits, percent }) => (
                                <tr key={visitor.id} className="border-b border-[#040DBF]/5">
                                    <td className="py-2 pr-4 font-medium text-[#010440]">{visitor.name ?? '-'}</td>
                                    <td className="py-2 pr-4 text-[#020659]/70">{groupLabel(visitor)}</td>
                                    <td className="py-2 pr-4 font-semibold text-[#010440]">
                                        {visits === 0 ? (
                                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">No visits yet</span>
                                        ) : (
                                            `${visits} / ${required}`
                                        )}
                                    </td>
                                    <td className="py-2 pr-4">
                                        <div className="flex items-center gap-3">
                                            <ProgressBar value={percent} className="min-w-32 flex-1" />
                                            <span className="w-10 text-right font-semibold text-[#020659]">{percent}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-sm text-[#020659]/70">
                                    Everyone in this group has met the required visit target.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function BreakdownList({ title, icon: Icon, rows }: { title: string; icon: LucideIcon; rows: Array<{ label: string; value: number }> }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold text-[#010440]">
                <Icon className="size-4 text-[#040DBF]" />
                {title}
            </div>
            <div className="space-y-2">
                {rows.slice(0, 6).map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-[#020659]/75">{row.label}</span>
                        <span className="font-semibold text-[#010440]">{row.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function groupedCounts(visitors: VisitHistoryVisitor[], label: (visitor: VisitHistoryVisitor) => string) {
    const groups = new Map<string, number>();

    visitors.forEach((visitor) => {
        groups.set(label(visitor), (groups.get(label(visitor)) ?? 0) + visitor.visits.length);
    });

    return [...groups.entries()].map(([label, value]) => ({ label, value })).sort((first, second) => second.value - first.value);
}

function groupLabel(visitor: VisitHistoryVisitor) {
    if (visitor.type === 'employee') {
        return visitor.department || 'No department';
    }

    return [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || 'No year level or section';
}
