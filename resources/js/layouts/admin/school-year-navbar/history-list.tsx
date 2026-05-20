import { Button } from '@/components/ui/button';
import { formatDisplayDate } from '@/components/ui/date-input';
import type { SchoolYearRow } from '@/types/school-year';
import { CheckCircle2, Pencil } from 'lucide-react';
import { MiniStat } from './mini-stat';

export function SchoolYearHistoryList({
    schoolYears,
    onEdit,
}: {
    schoolYears: SchoolYearRow[];
    onEdit: (schoolYear: SchoolYearRow) => void;
}) {
    return (
        <div className="max-h-[min(31rem,calc(100vh-13rem))] space-y-3 overflow-y-auto pr-1">
            {schoolYears.length > 0 ? (
                schoolYears.map((schoolYear) => (
                    <div key={schoolYear.id} className="rounded-lg border border-[#040DBF]/10 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-[#010440]">{schoolYear.name}</p>
                                    {schoolYear.is_active && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                            <CheckCircle2 className="size-3.5" />
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-sm text-[#020659]/70">
                                    {formatDisplayDate(schoolYear.starts_at)} to {formatDisplayDate(schoolYear.ends_at)}
                                </p>
                            </div>
                            {schoolYear.is_active && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(schoolYear)} title="Edit active school year">
                                    <Pencil className="size-4" />
                                </Button>
                            )}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <MiniStat label="Students" value={schoolYear.student_required_visits} />
                            <MiniStat label="Employees" value={schoolYear.employee_required_visits} />
                        </div>
                        {!schoolYear.is_active && (
                            <p className="mt-3 rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-600">
                                Historical record only. Previous school years cannot be reactivated.
                            </p>
                        )}
                    </div>
                ))
            ) : (
                <div className="rounded-lg border border-dashed border-[#040DBF]/20 p-5 text-sm text-[#020659]/70">
                    No school years yet. Add one to start tracking Student registrations.
                </div>
            )}
        </div>
    );
}
