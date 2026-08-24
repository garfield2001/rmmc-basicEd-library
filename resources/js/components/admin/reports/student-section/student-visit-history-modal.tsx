import { formatDisplayDate } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { VisitReportRow } from '@/types/reports';
import { Clock, User } from 'lucide-react';

interface StudentVisitHistoryModalProps {
    student: VisitReportRow | null;
    startDate: string;
    endDate: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StudentVisitHistoryModal({ student, startDate, endDate, open, onOpenChange }: StudentVisitHistoryModalProps) {
    if (!student) return null;

    const visits = student.visits ?? [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="admin-contained-scroll max-h-[calc(100vh-2rem)] overflow-y-auto bg-white sm:max-w-2xl"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 pr-8">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#040DBF]/15 bg-[#040DBF]/10 text-[#040DBF]">
                            <User className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <DialogTitle className="truncate text-xl font-bold text-[#010440]">{student.name || 'Student Details'}</DialogTitle>
                            <DialogDescription className="text-xs text-[#020659]/70">
                                {student.school_id ? `ID: ${student.school_id}` : 'No School ID'}
                                {student.year_section_label ? ` • ${student.year_section_label}` : ''}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <section className="overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#040DBF]/10 bg-[#f6f8ff] px-4 py-3">
                        <div>
                            <h3 className="text-sm font-semibold text-[#010440]">Visit Log</h3>
                            <p className="text-xs text-[#020659]/70">
                                {startDate && endDate ? `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}` : 'Recorded visits'}
                            </p>
                        </div>
                        <span className="inline-flex items-center rounded-full border border-[#040DBF]/15 bg-white px-3 py-1 text-xs font-semibold text-[#040DBF]">
                            Total Visits: {visits.length.toLocaleString()}
                        </span>
                    </div>

                    {visits.length > 0 ? (
                        <div className="max-h-72 overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-[#f8faff] text-xs font-semibold text-[#020659]/70">
                                    <TableRow className="border-b border-[#040DBF]/10">
                                        <TableHead className="py-2.5 pl-4">#</TableHead>
                                        <TableHead className="py-2.5">Date</TableHead>
                                        <TableHead className="py-2.5 pr-4 text-right">Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-[#040DBF]/5 text-xs">
                                    {visits.map((visit, idx) => {
                                        const dateObj = visit.visited_at ? new Date(visit.visited_at) : null;
                                        const dateStr = dateObj
                                            ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '—';
                                        const timeStr = dateObj
                                            ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                                            : '—';

                                        return (
                                            <TableRow key={visit.id || idx} className="hover:bg-[#f6f8ff]">
                                                <TableCell className="py-2.5 pl-4 font-mono text-[11px] text-[#020659]/60">{idx + 1}</TableCell>
                                                <TableCell className="py-2.5 font-medium text-[#010440]">{dateStr}</TableCell>
                                                <TableCell className="py-2.5 pr-4 text-right font-mono text-[11px] text-[#020659]/80">
                                                    {timeStr}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="flex h-32 flex-col items-center justify-center p-4 text-center">
                            <Clock className="size-6 text-[#020659]/30" />
                            <p className="mt-2 text-xs font-medium text-[#020659]/60">No visits recorded for this student in the selected period.</p>
                        </div>
                    )}
                </section>
            </DialogContent>
        </Dialog>
    );
}
