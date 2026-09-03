import { IconBadge } from '@/components/ui/icon-badge';
import { cn } from '@/lib/utils';
import type { VisitReport, VisitReportRow } from '@/types/reports';
import { GraduationCap, Printer, Search, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StudentSectionTable } from './student-section-table';
import type { SectionAggregate, StudentFilterStatus } from './student-section-types';

interface StudentSectionDetailProps {
    activeSection: SectionAggregate | null;
    requiredVisits: number;
    reportFilters: VisitReport['filters'];
    onSelectStudent: (student: VisitReportRow) => void;
}

export function StudentSectionDetail({ activeSection, requiredVisits, reportFilters, onSelectStudent }: StudentSectionDetailProps) {
    const [statusFilter, setStatusFilter] = useState<StudentFilterStatus>('all');
    const [studentSearch, setStudentSearch] = useState('');

    const counts = useMemo(() => {
        if (!activeSection) {
            return { all: 0, met: 0, in_progress: 0, zero: 0 };
        }

        const all = activeSection.students.length;
        const met = activeSection.students.filter((st) => st.visit_count >= requiredVisits).length;
        const zero = activeSection.students.filter((st) => st.visit_count === 0).length;
        const in_progress = all - met - zero;

        return { all, met, in_progress, zero };
    }, [activeSection, requiredVisits]);

    const filteredStudents = useMemo(() => {
        if (!activeSection) {
            return [];
        }

        let list = activeSection.students;

        if (statusFilter === 'met') {
            list = list.filter((st) => st.visit_count >= requiredVisits);
        } else if (statusFilter === 'in_progress') {
            list = list.filter((st) => st.visit_count > 0 && st.visit_count < requiredVisits);
        } else if (statusFilter === 'zero') {
            list = list.filter((st) => st.visit_count === 0);
        }

        if (studentSearch.trim()) {
            const q = studentSearch.toLowerCase();
            list = list.filter((st) => (st.name || '').toLowerCase().includes(q) || (st.school_id || '').toLowerCase().includes(q));
        }

        return list;
    }, [activeSection, statusFilter, studentSearch, requiredVisits]);

    if (!activeSection) {
        return (
            <div className="flex flex-1 items-center justify-center p-12 text-center text-xs text-slate-500 dark:text-slate-400">
                Select a section from the list to view its student visits table.
            </div>
        );
    }

    const sectionParam =
        activeSection.yearLevel && activeSection.sectionName
            ? `${activeSection.yearLevel}::${activeSection.sectionName}`
            : activeSection.key;

    const printSectionUrl = `/admin/reports/visits/print?school_year_id=${reportFilters.school_year_id ?? ''}&start_date=${reportFilters.start_date ?? ''}&end_date=${reportFilters.end_date ?? ''}&visitor_type=student&sections[]=${encodeURIComponent(sectionParam)}`;

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
            {/* Active Section Header */}
            <div className="space-y-4 border-b border-[#040DBF]/10 bg-gradient-to-b from-[#f8faff] to-white p-5 dark:border-slate-800 dark:from-slate-800/80 dark:to-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="size-5 text-[#040DBF] dark:text-sky-400" />
                            <h3 className="text-lg font-bold text-[#010440] dark:text-white">{activeSection.label}</h3>
                        </div>
                        <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            {activeSection.studentCount} enrolled students • {activeSection.metRequiredCount} of {activeSection.studentCount} met
                            target ({activeSection.completionPercent}%)
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-[#040DBF]/15 bg-[#040DBF]/5 px-3 py-1.5 text-right dark:border-slate-700 dark:bg-slate-800">
                            <p className="text-[10px] font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-400">Total Visits</p>
                            <p className="mt-0.5 text-base leading-none font-bold text-[#040DBF] dark:text-sky-300">{activeSection.totalVisits}</p>
                        </div>
                        <div className="rounded-lg border border-[#040DBF]/15 bg-white px-3 py-1.5 text-right dark:border-slate-700 dark:bg-slate-800">
                            <p className="text-[10px] font-semibold tracking-wider text-slate-600 uppercase dark:text-slate-400">Avg Visits</p>
                            <p className="mt-0.5 text-base leading-none font-bold text-[#010440] dark:text-white">{activeSection.averageVisits}</p>
                        </div>
                        <a
                            href={printSectionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-[#040DBF]/20 bg-white px-3 text-xs font-semibold text-[#040DBF] shadow-xs transition hover:border-[#040DBF]/40 hover:bg-[#f6f8ff] dark:bg-slate-800 dark:border-slate-700 dark:text-sky-300 dark:hover:bg-slate-700"
                            title="Open printable roster for this section"
                        >
                            <Printer className="size-3.5" />
                            <span>Print Section</span>
                        </a>
                    </div>
                </div>

                {/* Top Performer Card */}
                {activeSection.topStudent && activeSection.topStudent.visit_count > 0 && (
                    <div className="relative overflow-hidden rounded-xl border border-[#040DBF]/15 bg-[#f8faff] p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <IconBadge icon={Trophy} className="size-10 rounded-lg bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400" />
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold text-[#030A8C] dark:text-sky-300">Top Section Visitor</span>
                                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">ID: {activeSection.topStudent.school_id || '—'}</span>
                                    </div>
                                    <h4 className="mt-0.5 truncate text-sm font-bold text-[#010440] dark:text-white">{activeSection.topStudent.name}</h4>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="flex items-baseline justify-end gap-1.5">
                                    <span className="text-xl font-black text-[#040DBF] dark:text-sky-400">{activeSection.topStudent.visit_count}</span>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">visits recorded</span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                    {activeSection.topStudent.excess_visits > 0
                                        ? `+${activeSection.topStudent.excess_visits} above target quota`
                                        : `Target: ${requiredVisits} visits`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Bar: Status Chips + Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#040DBF]/10 bg-[#f8faff] px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                {/* Status Chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                            statusFilter === 'all'
                                ? 'bg-[#040DBF] text-white shadow-xs dark:bg-blue-600'
                                : 'border border-[#040DBF]/20 bg-white text-slate-700 hover:bg-[#f6f8ff] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
                        )}
                    >
                        All ({counts.all})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('met')}
                        className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                            statusFilter === 'met'
                                ? 'bg-[#040DBF] text-white shadow-xs dark:bg-blue-600'
                                : 'border border-[#040DBF]/20 bg-white text-slate-700 hover:bg-[#f6f8ff] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
                        )}
                    >
                        Target Met ({counts.met})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('in_progress')}
                        className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                            statusFilter === 'in_progress'
                                ? 'bg-[#040DBF] text-white shadow-xs dark:bg-blue-600'
                                : 'border border-[#040DBF]/20 bg-white text-slate-700 hover:bg-[#f6f8ff] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
                        )}
                    >
                        In Progress ({counts.in_progress})
                    </button>
                    <button
                        type="button"
                        onClick={() => setStatusFilter('zero')}
                        className={cn(
                            'rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                            statusFilter === 'zero'
                                ? 'bg-[#040DBF] text-white shadow-xs dark:bg-blue-600'
                                : 'border border-[#040DBF]/20 bg-white text-slate-700 hover:bg-[#f6f8ff] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
                        )}
                    >
                        0 Visits ({counts.zero})
                    </button>
                </div>

                {/* Inner Student Search */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search in this section..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full rounded-md border border-[#040DBF]/20 bg-white py-1 pr-2.5 pl-8 text-xs text-[#010440] placeholder:text-slate-400 focus:border-[#040DBF] focus:ring-1 focus:ring-[#040DBF] focus:outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Student Table */}
            <div className="max-h-[480px] flex-1 overflow-y-auto">
                <StudentSectionTable
                    students={filteredStudents}
                    requiredVisits={requiredVisits}
                    searchQuery={studentSearch}
                    onSelectStudent={onSelectStudent}
                />
            </div>
        </div>
    );
}
