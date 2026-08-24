import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { VisitReportRow } from '@/types/reports';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { ProgressBar } from '../report-table-parts';

interface StudentSectionTableProps {
    students: VisitReportRow[];
    requiredVisits: number;
    searchQuery: string;
    onSelectStudent?: (student: VisitReportRow) => void;
}

export function StudentSectionTable({ students, requiredVisits, searchQuery, onSelectStudent }: StudentSectionTableProps) {
    if (students.length === 0) {
        return (
            <div className="flex h-48 flex-col items-center justify-center p-6 text-center">
                <p className="text-sm font-medium text-[#010440]">No students found</p>
                <p className="mt-1 text-xs text-[#020659]/60">
                    {searchQuery ? `No students match "${searchQuery}".` : 'No students match the selected filter criteria.'}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <Table className="min-w-160">
                <TableHeader className="bg-[#f8faff] text-[11px] font-bold tracking-wider text-[#020659]/70 uppercase">
                    <TableRow className="border-b border-[#040DBF]/10">
                        <TableHead className="w-16 py-3 pl-4">Rank</TableHead>
                        <TableHead className="w-32 py-3">School ID</TableHead>
                        <TableHead className="py-3">Student Name</TableHead>
                        <TableHead className="w-24 py-3 text-center">Visits</TableHead>
                        <TableHead className="w-36 py-3 text-center">Status</TableHead>
                        <TableHead className="w-36 py-3 pr-4 text-right">Target Progress</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#040DBF]/5 text-xs">
                    {students.map((student, rankIndex) => {
                        const isTargetMet = student.visit_count >= requiredVisits;
                        const hasNoVisits = student.visit_count === 0;

                        return (
                            <TableRow key={student.id} className={cn('transition-colors hover:bg-[#f6f8ff]', hasNoVisits && 'bg-slate-50/50')}>
                                <TableCell className="py-3 pl-4 font-semibold">
                                    <span className="inline-flex size-6 items-center justify-center rounded-md bg-[#040DBF]/5 text-[11px] font-bold text-[#010440]">
                                        {rankIndex + 1}
                                    </span>
                                </TableCell>
                                <TableCell className="py-3 font-mono text-[11px] font-medium text-[#020659]/75">{student.school_id || '—'}</TableCell>
                                <TableCell className="py-3">
                                    {onSelectStudent ? (
                                        <button
                                            type="button"
                                            onClick={() => onSelectStudent(student)}
                                            className="group inline-flex items-center gap-1.5 text-left font-semibold text-[#010440] hover:text-[#040DBF]"
                                        >
                                            <span className="underline-offset-2 group-hover:underline">{student.name}</span>
                                            <ChevronRight className="size-3 text-[#020659]/30 transition group-hover:text-[#040DBF]" />
                                        </button>
                                    ) : (
                                        <span className="font-semibold text-[#010440]">{student.name}</span>
                                    )}
                                </TableCell>
                                <TableCell className="py-3 text-center">
                                    <span
                                        className={cn(
                                            'inline-flex min-w-8 items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold',
                                            hasNoVisits ? 'bg-slate-100 text-slate-500' : 'bg-[#040DBF]/10 text-[#040DBF]',
                                        )}
                                    >
                                        {student.visit_count}
                                    </span>
                                </TableCell>
                                <TableCell className="py-3 text-center">
                                    {isTargetMet ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-[#040DBF]/15 bg-[#f6f8ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#040DBF]">
                                            <CheckCircle2 className="size-3 text-[#040DBF]" />
                                            {student.excess_visits > 0 ? `Met (+${student.excess_visits})` : 'Target Met'}
                                        </span>
                                    ) : hasNoVisits ? (
                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                                            0 Visits
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#020659]/80">
                                            {student.visit_count} of {requiredVisits}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="py-3 pr-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <div className="w-20">
                                            <ProgressBar value={student.progress_percent} />
                                        </div>
                                        <span className="w-9 text-right font-mono text-[11px] font-semibold text-[#010440]">
                                            {student.progress_percent}%
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
