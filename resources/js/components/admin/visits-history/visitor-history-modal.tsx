import { formatDisplayDate } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import type { VisitHistoryVisit, VisitHistoryVisitor } from '@/types/dashboard';
import { groupLabel, parseVisitDate, summarizeDateRange, toLocalIsoDate } from './visit-history-helpers';

interface VisitorHistoryModalProps {
    visitor: VisitHistoryVisitor | null;
    visits: VisitHistoryVisit[];
    startDate: string;
    endDate: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VisitorHistoryModal({ visitor, visits, startDate, endDate, open, onOpenChange }: VisitorHistoryModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-3 pr-8">
                        <VisitorAvatar
                            name={visitor?.name ?? 'Visitor'}
                            src={visitor?.photoUrl}
                            className="live-visit-avatar bg-[#eef2ff] text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
                        />
                        <div className="min-w-0">
                            <DialogTitle className="truncate text-2xl text-[#010440]">{visitor?.name ?? 'Visitor details'}</DialogTitle>
                            <DialogDescription>
                                {visitor?.schoolId ?? 'No school ID'}
                                {visitor ? ` - ${groupLabel(visitor)}` : ''}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <section className="overflow-hidden rounded-lg border border-[#040DBF]/10">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#040DBF]/10 bg-[#f6f8ff] px-4 py-3">
                        <div>
                            <h3 className="font-semibold text-[#010440]">Visit log</h3>
                            <p className="mt-1 text-sm text-[#020659]/70">{summarizeDateRange(startDate, endDate)}</p>
                        </div>
                        <span className="rounded-full bg-[#040DBF]/10 px-3 py-1.5 text-xs font-semibold text-[#030A8C]">
                            Total visits: {visits.length.toLocaleString()}
                        </span>
                    </div>

                    {visits.length > 0 ? (
                        <div className="max-h-[24rem] overflow-y-auto overscroll-contain">
                            <Table>
                                <TableHeader className="sticky top-0 z-10 bg-white">
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {visits.map((visit) => {
                                        const visitedAt = parseVisitDate(visit.visitedAt);

                                        return (
                                            <TableRow key={visit.id}>
                                                <TableCell className="font-medium text-[#010440]">
                                                    {visitedAt ? formatDisplayDate(toLocalIsoDate(visitedAt)) : '-'}
                                                </TableCell>
                                                <TableCell className="text-[#020659]/70">
                                                    {visitedAt
                                                        ? visitedAt.toLocaleTimeString([], {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          })
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="px-4 py-10 text-center text-sm text-[#020659]/70">No visits recorded in the selected date coverage.</div>
                    )}
                </section>
            </DialogContent>
        </Dialog>
    );
}
