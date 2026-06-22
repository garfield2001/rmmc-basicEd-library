import { formatDisplayDate } from '@/components/ui/date-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import type { DashboardVisit } from '@/types/dashboard';
import { CalendarClock, IdCard, UsersRound } from 'lucide-react';
import type React from 'react';

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
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <DialogHeader>
                    <div className="grid gap-5 pr-8 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
                        <VisitorAvatar
                            name={visit?.visitor.name ?? 'Visitor'}
                            src={visit?.visitor.photoUrl}
                            className="live-visit-avatar size-36 rounded-xl bg-[#eef2ff] text-3xl text-[#030A8C]/70 ring-1 ring-[#040DBF]/10 sm:size-44"
                        />
                        <div className="min-w-0">
                            <DialogTitle className="truncate text-2xl text-[#010440]">{visit?.visitor.name ?? 'Visit details'}</DialogTitle>
                            <DialogDescription>{visit?.visitor.schoolId ?? 'No school ID'}</DialogDescription>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <VisitPill icon={<UsersRound className="size-3.5" />} label={visitorType} />
                                <VisitPill
                                    icon={<CalendarClock className="size-3.5" />}
                                    label={validVisitedAt ? formatDisplayDate(toIsoDate(validVisitedAt)) : '-'}
                                />
                                <VisitPill
                                    icon={<IdCard className="size-3.5" />}
                                    label={
                                        validVisitedAt
                                            ? validVisitedAt.toLocaleTimeString([], {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                              })
                                            : '-'
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <section className="divide-y divide-[#040DBF]/10 rounded-lg border border-[#040DBF]/10">
                    <VisitDetailRow label="Name" value={visit?.visitor.name ?? '-'} />
                    <VisitDetailRow label="School ID" value={visit?.visitor.schoolId ?? '-'} />
                    <VisitDetailRow label={visit?.visitor.type === 'employee' ? 'Department' : 'Year / Section'} value={groupLabel} />
                </section>
            </DialogContent>
        </Dialog>
    );
}

function VisitPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#040DBF]/15 bg-[#f6f8ff] px-3 py-1.5 text-xs font-semibold text-[#030A8C]">
            {icon}
            {label}
        </span>
    );
}

function VisitDetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1 px-4 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-5">
            <span className="text-sm font-medium text-[#020659]/70">{label}</span>
            <span className="font-semibold text-[#010440]">{value}</span>
        </div>
    );
}

function toIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
