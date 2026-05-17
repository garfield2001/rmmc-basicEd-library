import { formatDisplayDate } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import type { DashboardVisit } from '@/types/dashboard';
import { CalendarClock, IdCard, type LucideIcon, UsersRound } from 'lucide-react';

interface VisitDetailsModalProps {
    visit: DashboardVisit | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VisitDetailsModal({ visit, open, onOpenChange }: VisitDetailsModalProps) {
    const visitorType = visit?.visitor.type === 'employee' ? 'Employee' : 'Student';
    const groupLabel =
        visit?.visitor.type === 'employee'
            ? visit.visitor.department || 'No department'
            : [visit?.visitor.yearLevel, visit?.visitor.section].filter(Boolean).join(' - ') || 'No year level or section';
    const visitedAt = visit?.visitedAt ? new Date(visit.visitedAt) : null;
    const validVisitedAt = visitedAt && !Number.isNaN(visitedAt.getTime()) ? visitedAt : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <div className="flex items-center gap-3 pr-8">
                        <VisitorAvatar
                            name={visit?.visitor.name ?? 'Visitor'}
                            src={visit?.visitor.photoUrl}
                            className="live-visit-avatar bg-[#eef2ff] text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
                        />
                        <div className="min-w-0">
                            <DialogTitle className="truncate text-2xl text-[#010440]">{visit?.visitor.name ?? 'Visit details'}</DialogTitle>
                            <DialogDescription>{visit?.visitor.schoolId ?? 'No school ID'}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-3">
                    <VisitDetailCard icon={UsersRound} label="Type" value={visitorType} />
                    <VisitDetailCard icon={CalendarClock} label="Date" value={validVisitedAt ? formatDisplayDate(toIsoDate(validVisitedAt)) : '-'} />
                    <VisitDetailCard
                        icon={IdCard}
                        label="Time"
                        value={
                            validVisitedAt
                                ? validVisitedAt.toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : '-'
                        }
                    />
                </div>

                <section className="overflow-hidden rounded-lg border border-[#040DBF]/10">
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="w-36 font-medium text-[#020659]/70">Name</TableCell>
                                <TableCell className="font-semibold text-[#010440]">{visit?.visitor.name ?? '-'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-[#020659]/70">School ID</TableCell>
                                <TableCell className="font-semibold text-[#010440]">{visit?.visitor.schoolId ?? '-'}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium text-[#020659]/70">
                                    {visit?.visitor.type === 'employee' ? 'Department' : 'Year / Section'}
                                </TableCell>
                                <TableCell className="font-semibold text-[#010440]">{groupLabel}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </section>
            </DialogContent>
        </Dialog>
    );
}

function VisitDetailCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <span className="admin-icon-badge inline-flex size-9 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                <Icon className="size-4" />
            </span>
            <p className="mt-3 text-xs font-semibold tracking-[0.12em] text-[#030A8C] uppercase">{label}</p>
            <p className="mt-1 text-base font-semibold text-[#010440]">{value}</p>
        </div>
    );
}

function toIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
