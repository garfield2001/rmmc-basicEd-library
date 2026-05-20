import { Button } from '@/components/ui/button';
import { formatDisplayDate } from '@/components/ui/date-input';
import type { SharedData } from '@/types/shared';
import { CalendarClock } from 'lucide-react';
import type React from 'react';
import { MiniStat } from './mini-stat';

export function SchoolYearPreviewOverlay({
    position,
    previewRef,
    schoolYear,
    onDetailsOpen,
}: {
    position: { top: number; right: number };
    previewRef: React.RefObject<HTMLDivElement | null>;
    schoolYear: SharedData['schoolYear'];
    onDetailsOpen: () => void;
}) {
    return (
        <>
            <div className="pointer-events-none fixed inset-0 z-[55] bg-[#010440]/10 backdrop-blur-[3px] transition" aria-hidden="true" />
            <div ref={previewRef} className="fixed z-[70] w-[min(20rem,calc(100vw-2rem))]" style={{ top: position.top, right: position.right }}>
                <div className="admin-school-year-popover rounded-lg border border-[#040DBF]/10 bg-white p-4 text-sm shadow-xl shadow-[#040DBF]/10">
                    <div className="flex items-start gap-3">
                        <span className="admin-school-year-popover-icon flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f6f8ff] text-[#040DBF]">
                            <CalendarClock className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="font-semibold text-[#010440]">{schoolYear?.name ?? 'No active school year'}</p>
                            <p className="mt-1 text-xs leading-5 text-[#020659]/70">
                                {schoolYear
                                    ? `${formatDisplayDate(schoolYear.starts_at)} to ${formatDisplayDate(schoolYear.ends_at)}`
                                    : 'Add a school year before logging student visits.'}
                            </p>
                        </div>
                    </div>
                    {schoolYear && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <MiniStat label="Students" value={schoolYear.student_required_visits} />
                            <MiniStat label="Employees" value={schoolYear.employee_required_visits} />
                        </div>
                    )}
                    <Button type="button" size="sm" className="mt-4 w-full" onClick={onDetailsOpen}>
                        Transition to new school year
                    </Button>
                </div>
            </div>
        </>
    );
}
