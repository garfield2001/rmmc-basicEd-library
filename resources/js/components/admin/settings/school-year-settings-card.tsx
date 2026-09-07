import { Button } from '@/components/ui/button';
import { formatDisplayDate } from '@/components/ui/date-input';
import { IconBadge } from '@/components/ui/icon-badge';
import type { SharedData } from '@/types/shared';
import { usePage } from '@inertiajs/react';
import { AlertCircle, CalendarClock, CheckCircle2, GraduationCap, Users } from 'lucide-react';

export function SchoolYearSettingsCard() {
    const { schoolYear } = usePage<SharedData>().props;

    const openSchoolYearModal = () => {
        window.dispatchEvent(new CustomEvent('open-school-year-details'));
    };

    return (
        <section className="admin-surface flex flex-col justify-between rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <IconBadge icon={CalendarClock} className="bg-[#040DBF] text-white" />
                        <div>
                            <h2 className="text-lg font-semibold tracking-normal text-[#010440]">School year details</h2>
                            <p className="text-sm text-[#020659]/70">Academic session and visitor target management.</p>
                        </div>
                    </div>
                    {schoolYear?.is_active && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            Active
                        </span>
                    )}
                </div>

                <div className="mt-6 space-y-4">
                    {schoolYear ? (
                        <>
                            <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                <p className="text-xs font-medium uppercase tracking-wider text-[#030A8C] dark:text-sky-400">Current Academic Year</p>
                                <p className="mt-1 text-xl font-bold text-[#010440] dark:text-white">{schoolYear.name}</p>
                                <p className="mt-1 text-xs text-[#020659]/70 dark:text-slate-400">
                                    {formatDisplayDate(schoolYear.starts_at)} to {formatDisplayDate(schoolYear.ends_at)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-[#040DBF]/10 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#020659] dark:text-slate-300">
                                        <GraduationCap className="size-4 text-[#040DBF] dark:text-sky-400" />
                                        <span>Student target</span>
                                    </div>
                                    <p className="mt-2 text-lg font-bold text-[#010440] dark:text-white">
                                        {schoolYear.student_required_visits}{' '}
                                        <span className="text-xs font-normal text-slate-500">visits</span>
                                    </p>
                                </div>

                                <div className="rounded-lg border border-[#040DBF]/10 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-800/40">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-[#020659] dark:text-slate-300">
                                        <Users className="size-4 text-[#040DBF] dark:text-sky-400" />
                                        <span>Employee target</span>
                                    </div>
                                    <p className="mt-2 text-lg font-bold text-[#010440] dark:text-white">
                                        {schoolYear.employee_required_visits}{' '}
                                        <span className="text-xs font-normal text-slate-500">visits</span>
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                            <AlertCircle className="mt-0.5 size-5 shrink-0" />
                            <div>
                                <p className="font-semibold">No active school year</p>
                                <p className="mt-1 text-xs">An active school year is required for student tracking and library visits.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#040DBF]/10 dark:border-slate-800">
                <Button
                    type="button"
                    onClick={openSchoolYearModal}
                    className="w-full sm:w-auto bg-[#040DBF] text-white hover:bg-[#030A8C] shadow-sm"
                >
                    <CalendarClock className="size-4" />
                    Manage school year
                </Button>
            </div>
        </section>
    );
}
