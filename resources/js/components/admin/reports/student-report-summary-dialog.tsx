import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { VisitReport, VisitReportRow } from '@/types/reports';
import {
    CheckCircle2,
    Clock,
    Flame,
    GraduationCap,
    Search,
    Sparkles,
    Trophy,
} from 'lucide-react';
import * as React from 'react';

interface StudentReportSummaryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: VisitReport;
    dateRangeSummary: string;
}

interface SectionAggregate {
    key: string;
    label: string;
    yearLevel: string;
    sectionName: string;
    totalVisits: number;
    studentCount: number;
    averageVisits: number;
    metRequiredCount: number;
    completionPercent: number;
    students: VisitReportRow[];
    topStudent: VisitReportRow | null;
}

export function StudentReportSummaryDialog({
    open,
    onOpenChange,
    report,
    dateRangeSummary,
}: StudentReportSummaryDialogProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [studentSearchQuery, setStudentSearchQuery] = React.useState('');
    const [selectedSectionKey, setSelectedSectionKey] = React.useState<string | null>(null);

    // Group and analyze rows by section
    const sectionAggregates = React.useMemo<SectionAggregate[]>(() => {
        const groups = new Map<string, VisitReportRow[]>();

        for (const row of report.rows) {
            const key = row.year_section_label || [row.year_level, row.section].filter(Boolean).join(' - ') || 'Unassigned';
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(row);
        }

        const aggregates: SectionAggregate[] = [];
        const requiredVisits = report.summary.required_visits || 4;

        for (const [key, rows] of groups.entries()) {
            // Sort students in this section by visit_count descending
            const sortedStudents = [...rows].sort((a, b) => b.visit_count - a.visit_count || (a.name || '').localeCompare(b.name || ''));
            const totalVisits = rows.reduce((sum, r) => sum + r.visit_count, 0);
            const studentCount = rows.length;
            const averageVisits = studentCount > 0 ? Math.round((totalVisits / studentCount) * 10) / 10 : 0;
            const metRequiredCount = rows.filter((r) => r.visit_count >= requiredVisits).length;
            const completionPercent = studentCount > 0 ? Math.round((metRequiredCount / studentCount) * 100) : 0;
            const firstRow = rows[0];

            aggregates.push({
                key,
                label: key,
                yearLevel: firstRow?.year_level || 'Unknown',
                sectionName: firstRow?.section || key,
                totalVisits,
                studentCount,
                averageVisits,
                metRequiredCount,
                completionPercent,
                students: sortedStudents,
                topStudent: sortedStudents[0] && sortedStudents[0].visit_count > 0 ? sortedStudents[0] : (sortedStudents[0] ?? null),
            });
        }

        // Sort sections by total visits descending
        return aggregates.sort((a, b) => b.totalVisits - a.totalVisits || a.label.localeCompare(b.label));
    }, [report.rows, report.summary.required_visits]);

    // Auto-select the top section on open
    React.useEffect(() => {
        if (open && sectionAggregates.length > 0) {
            if (!selectedSectionKey || !sectionAggregates.some((s) => s.key === selectedSectionKey)) {
                setSelectedSectionKey(sectionAggregates[0].key);
            }
        }
    }, [open, sectionAggregates, selectedSectionKey]);

    // Filtered sections based on search
    const filteredSections = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return sectionAggregates;
        }
        const q = searchQuery.toLowerCase();
        return sectionAggregates.filter(
            (sec) =>
                sec.label.toLowerCase().includes(q) ||
                sec.yearLevel.toLowerCase().includes(q) ||
                sec.sectionName.toLowerCase().includes(q) ||
                sec.students.some((st) => (st.name || '').toLowerCase().includes(q)),
        );
    }, [sectionAggregates, searchQuery]);

    const activeSection = React.useMemo(() => {
        return sectionAggregates.find((s) => s.key === selectedSectionKey) || sectionAggregates[0] || null;
    }, [sectionAggregates, selectedSectionKey]);

    // Students in active section filtered by inner search
    const filteredSectionStudents = React.useMemo(() => {
        if (!activeSection) {
            return [];
        }
        if (!studentSearchQuery.trim()) {
            return activeSection.students;
        }
        const q = studentSearchQuery.toLowerCase();
        return activeSection.students.filter(
            (st) =>
                (st.name || '').toLowerCase().includes(q) ||
                (st.school_id || '').toLowerCase().includes(q),
        );
    }, [activeSection, studentSearchQuery]);

    const requiredVisits = report.summary.required_visits || 4;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl p-0 overflow-hidden flex flex-col max-h-[90vh] bg-white">
                {/* Header */}
                <div className="border-b border-[#040DBF]/10 bg-gradient-to-r from-[#010440] via-[#020659] to-[#040DBF] p-6 text-white">
                    <DialogHeader className="gap-1">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-amber-300">
                                <Sparkles className="size-4" />
                            </span>
                            <DialogTitle className="text-xl font-bold text-white tracking-tight">
                                Student Visit Performance Summary
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-xs text-white/75 mt-0.5">
                            School Year: <span className="font-semibold text-white">{report.school_year?.name ?? 'Selected'}</span> • Period: {dateRangeSummary}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Quick Highlights Strip */}
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-md">
                            <p className="text-xs font-medium text-white/70">Total Students</p>
                            <p className="mt-1 text-2xl font-bold text-white">{report.summary.visitors.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-md">
                            <p className="text-xs font-medium text-white/70">Total Visits</p>
                            <p className="mt-1 text-2xl font-bold text-amber-300">{report.summary.total_visits.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-md">
                            <p className="text-xs font-medium text-white/70">Avg Visits / Student</p>
                            <p className="mt-1 text-2xl font-bold text-white">{report.summary.average_visits}</p>
                        </div>
                        <div className="rounded-lg bg-white/10 p-3 backdrop-blur-md">
                            <p className="text-xs font-medium text-white/70">Overall Target Met</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-300">{report.summary.progress_percent}%</p>
                        </div>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#040DBF]/10">
                    {/* Left Pane: Interactive Section Selector */}
                    <div className="w-full md:w-80 lg:w-96 flex flex-col bg-[#f8faff] border-r border-[#040DBF]/10">
                        <div className="p-3.5 border-b border-[#040DBF]/10 bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#020659]/50" />
                                <input
                                    type="text"
                                    placeholder="Search sections or grades..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-[#040DBF]/15 bg-[#f8faff] py-1.5 pl-9 pr-3 text-xs text-[#010440] placeholder:text-[#020659]/40 focus:border-[#040DBF] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#040DBF]"
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-[#020659]/60 font-medium px-1">
                                <span>Sections ({filteredSections.length})</span>
                                <span>Click to inspect</span>
                            </div>
                        </div>

                        {/* Section List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[50vh] md:max-h-[520px]">
                            {filteredSections.length === 0 ? (
                                <div className="py-8 text-center text-xs text-[#020659]/50">
                                    No sections match "{searchQuery}"
                                </div>
                            ) : (
                                filteredSections.map((sec, idx) => {
                                    const isSelected = activeSection?.key === sec.key;
                                    return (
                                        <button
                                            key={sec.key}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSectionKey(sec.key);
                                                setStudentSearchQuery('');
                                            }}
                                            className={cn(
                                                'w-full text-left rounded-xl p-3 transition-all duration-150 relative border',
                                                isSelected
                                                    ? 'bg-white border-[#040DBF] shadow-md shadow-[#040DBF]/10 ring-1 ring-[#040DBF]'
                                                    : 'bg-white/70 hover:bg-white border-[#040DBF]/10 hover:border-[#040DBF]/25 shadow-sm',
                                            )}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className={cn(
                                                            'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                                                            idx === 0
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : idx === 1
                                                                  ? 'bg-slate-200 text-slate-700'
                                                                  : idx === 2
                                                                    ? 'bg-amber-800/10 text-amber-900'
                                                                    : 'bg-[#040DBF]/5 text-[#020659]/70',
                                                        )}
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-[#010440] truncate">
                                                            {sec.label}
                                                        </p>
                                                        <p className="text-[11px] text-[#020659]/60">
                                                            {sec.studentCount} students • {sec.averageVisits} avg
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span className="inline-block rounded-md bg-[#040DBF]/10 px-2 py-0.5 text-xs font-bold text-[#040DBF]">
                                                        {sec.totalVisits} visits
                                                    </span>
                                                    <p className="text-[10px] font-medium text-emerald-600 mt-0.5">
                                                        {sec.completionPercent}% met quota
                                                    </p>
                                                </div>
                                            </div>

                                            {sec.topStudent && (
                                                <div className="mt-2 flex items-center gap-1.5 rounded-md bg-[#f6f8ff] px-2 py-1 text-[11px] text-[#020659]/80 border border-[#040DBF]/5">
                                                    <Trophy className="size-3 text-amber-500 shrink-0" />
                                                    <span className="truncate">
                                                        <span className="font-semibold text-[#010440]">Top:</span> {sec.topStudent.name} ({sec.topStudent.visit_count} visits)
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Pane: Selected Section Breakdown & Highest Visit Student */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                        {activeSection ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Active Section Header & Highest Performer Hero */}
                                <div className="p-5 border-b border-[#040DBF]/10 bg-gradient-to-b from-[#f8faff] to-white space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="size-5 text-[#040DBF]" />
                                                <h3 className="text-lg font-bold text-[#010440]">
                                                    {activeSection.label}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-[#020659]/60 mt-0.5">
                                                {activeSection.studentCount} enrolled students • {activeSection.metRequiredCount} of {activeSection.studentCount} met target ({activeSection.completionPercent}%)
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg bg-[#040DBF]/5 px-3 py-1.5 border border-[#040DBF]/10 text-right">
                                                <p className="text-[10px] text-[#020659]/60 font-medium uppercase tracking-wider">Total Visits</p>
                                                <p className="text-base font-bold text-[#040DBF] leading-none mt-0.5">{activeSection.totalVisits}</p>
                                            </div>
                                            <div className="rounded-lg bg-emerald-50 px-3 py-1.5 border border-emerald-200/50 text-right">
                                                <p className="text-[10px] text-emerald-700/75 font-medium uppercase tracking-wider">Avg Visits</p>
                                                <p className="text-base font-bold text-emerald-700 leading-none mt-0.5">{activeSection.averageVisits}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 🏆 HIGHEST VISITS STUDENT HERO CARD */}
                                    {activeSection.topStudent && (
                                        <div className="relative overflow-hidden rounded-xl border border-amber-300/60 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 p-4 shadow-sm">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/20">
                                                        <Trophy className="size-6" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-400/30">
                                                                <Flame className="size-3 text-amber-600" />
                                                                #1 Top Visitor in {activeSection.sectionName}
                                                            </span>
                                                            <span className="text-xs font-mono text-[#020659]/60">
                                                                ID: {activeSection.topStudent.school_id}
                                                            </span>
                                                        </div>
                                                        <h4 className="mt-1 text-base font-bold text-[#010440] truncate">
                                                            {activeSection.topStudent.name}
                                                        </h4>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="flex items-baseline justify-end gap-1.5">
                                                        <span className="text-2xl font-black text-[#040DBF]">
                                                            {activeSection.topStudent.visit_count}
                                                        </span>
                                                        <span className="text-xs font-medium text-[#020659]/60">
                                                            visits recorded
                                                        </span>
                                                    </div>
                                                    {activeSection.topStudent.excess_visits > 0 ? (
                                                        <p className="text-[11px] font-semibold text-emerald-600">
                                                            +{activeSection.topStudent.excess_visits} above target quota
                                                        </p>
                                                    ) : (
                                                        <p className="text-[11px] font-medium text-[#020659]/60">
                                                            Target: {requiredVisits} visits
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Student Ranking Table for the Section */}
                                <div className="p-3 border-b border-[#040DBF]/10 bg-[#f8faff] flex items-center justify-between gap-3">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#020659]/50" />
                                        <input
                                            type="text"
                                            placeholder="Search student in this section..."
                                            value={studentSearchQuery}
                                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                                            className="w-full rounded-md border border-[#040DBF]/15 bg-white py-1 pl-8 pr-2.5 text-xs text-[#010440] placeholder:text-[#020659]/40 focus:border-[#040DBF] focus:outline-none focus:ring-1 focus:ring-[#040DBF]"
                                        />
                                    </div>
                                    <span className="text-xs text-[#020659]/60 font-medium">
                                        {filteredSectionStudents.length} of {activeSection.studentCount} students
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[380px]">
                                    {filteredSectionStudents.map((st, rankIndex) => {
                                        const isTop = rankIndex === 0;
                                        const isTargetMet = st.visit_count >= requiredVisits;

                                        return (
                                            <div
                                                key={st.id}
                                                className={cn(
                                                    'flex items-center justify-between gap-3 rounded-lg p-2.5 border transition-colors',
                                                    isTop
                                                        ? 'bg-amber-50/50 border-amber-200/80 shadow-xs'
                                                        : 'bg-white border-[#040DBF]/10 hover:bg-[#f8faff]',
                                                )}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span
                                                        className={cn(
                                                            'flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                                                            rankIndex === 0
                                                                ? 'bg-amber-400 text-white shadow-xs'
                                                                : rankIndex === 1
                                                                  ? 'bg-slate-300 text-slate-800'
                                                                  : rankIndex === 2
                                                                    ? 'bg-amber-700 text-white'
                                                                    : 'bg-[#040DBF]/5 text-[#020659]/60 font-medium',
                                                        )}
                                                    >
                                                        {rankIndex + 1}
                                                    </span>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-bold text-[#010440] truncate">
                                                                {st.name}
                                                            </p>
                                                            {isTop && (
                                                                <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800">
                                                                    Top
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] font-mono text-[#020659]/60">
                                                            ID: {st.school_id}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0">
                                                    <div className="w-24 hidden sm:block">
                                                        <div className="flex items-center justify-between text-[10px] text-[#020659]/60 mb-0.5">
                                                            <span>Quota</span>
                                                            <span className="font-semibold text-[#010440]">{st.progress_percent}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#040DBF]/10">
                                                            <div
                                                                className={cn(
                                                                    'h-full rounded-full transition-all duration-300',
                                                                    isTargetMet ? 'bg-emerald-500' : 'bg-[#040DBF]',
                                                                )}
                                                                style={{ width: `${Math.min(100, st.progress_percent)}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="text-right min-w-16">
                                                        <span className="text-sm font-bold text-[#010440]">
                                                            {st.visit_count}
                                                        </span>
                                                        <span className="text-xs text-[#020659]/50 font-normal">
                                                            /{requiredVisits}
                                                        </span>
                                                        {st.excess_visits > 0 && (
                                                            <span className="ml-1 text-[10px] font-bold text-emerald-600">
                                                                +{st.excess_visits}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        {isTargetMet ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                                <CheckCircle2 className="size-3" />
                                                                Met
                                                            </span>
                                                        ) : st.visit_count > 0 ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                                                <Clock className="size-3" />
                                                                In Progress
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                                                0 Visits
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-sm text-[#020659]/60 flex-1 flex items-center justify-center">
                                No section data available in this report.
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}