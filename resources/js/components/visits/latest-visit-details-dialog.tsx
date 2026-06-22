import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import { type DashboardVisit } from '@/types/dashboard';
import { BriefcaseBusiness, CalendarClock, GraduationCap, IdCard, ScanLine } from 'lucide-react';
import { formatVisitDateTime, visitorTypeLabel } from './latest-visit-card-utils';
import { LatestVisitDetailItem } from './latest-visit-detail-item';

interface LatestVisitDetailsDialogProps {
    open: boolean;
    visit: DashboardVisit;
    onOpenChange: (open: boolean) => void;
}

export function LatestVisitDetailsDialog({ open, visit, onOpenChange }: LatestVisitDetailsDialogProps) {
    const TypeIcon = visit.visitor.type === 'employee' ? BriefcaseBusiness : GraduationCap;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-0 sm:max-w-4xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <div className="h-2 bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_52%,#010440_100%)]" />
                <DialogHeader>
                    <div className="px-6 pt-6">
                        <DialogTitle className="text-2xl text-[#010440]">Latest scanned visitor</DialogTitle>
                        <DialogDescription className="mt-1">Complete details for the most recent Radio-Frequency ID visit.</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 p-6 sm:grid-cols-[13rem_minmax(0,1fr)]">
                    <VisitPhoto visit={visit} />

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#040DBF]/15 bg-[#f6f8ff] px-3 py-1 text-xs font-medium text-[#030A8C]">
                                <TypeIcon className="size-3.5" />
                                {visitorTypeLabel(visit)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#040DBF]/15 bg-white px-3 py-1 text-xs font-medium text-[#030A8C]">
                                <CalendarClock className="size-3.5" />
                                {formatVisitDateTime(visit)}
                            </span>
                        </div>

                        <p className="mt-5 text-3xl font-semibold tracking-normal text-[#010440]">{visit.visitor.name ?? 'Unknown visitor'}</p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#030A8C]">
                            <IdCard className="size-4" />
                            {visit.visitor.schoolId ?? 'No ID'}
                        </p>

                        <div className="mt-6 divide-y divide-[#040DBF]/10 rounded-lg border border-[#040DBF]/10 text-sm">
                            <LatestVisitDetailItem
                                className="grid gap-1 px-4 py-4 sm:grid-cols-[11rem_minmax(0,1fr)]"
                                label="Visitor type"
                                value={visitorTypeLabel(visit)}
                            />
                            {visit.visitor.type === 'employee' ? (
                                <LatestVisitDetailItem
                                    className="grid gap-1 px-4 py-4 sm:grid-cols-[11rem_minmax(0,1fr)]"
                                    label="Department"
                                    value={visit.visitor.department}
                                />
                            ) : (
                                <>
                                    <LatestVisitDetailItem
                                        className="grid gap-1 px-4 py-4 sm:grid-cols-[11rem_minmax(0,1fr)]"
                                        label="Year level"
                                        value={visit.visitor.yearLevel}
                                    />
                                    <LatestVisitDetailItem
                                        className="grid gap-1 px-4 py-4 sm:grid-cols-[11rem_minmax(0,1fr)]"
                                        label="Section"
                                        value={visit.visitor.section}
                                    />
                                </>
                            )}
                        </div>

                        <div className="mt-5 flex items-start gap-3 text-sm text-[#020659]/75">
                            <ScanLine className="mt-0.5 size-4 shrink-0 text-[#040DBF]" />
                            <p className="leading-6">
                                Read-only visit record. Edit profile information from Registered Visitors when a name, photo, or department needs
                                correction.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function VisitPhoto({ visit }: { visit: DashboardVisit }) {
    return (
        <div>
            <VisitorAvatar
                name={visit.visitor.name}
                src={visit.visitor.photoUrl}
                className="live-visit-avatar aspect-square size-full min-h-48 rounded-xl bg-[#eef2ff] text-4xl text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
            />
        </div>
    );
}
