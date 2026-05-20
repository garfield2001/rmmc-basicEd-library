import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FallbackImage } from '@/components/ui/fallback-image';
import { IconBadge } from '@/components/ui/icon-badge';
import { type DashboardVisit } from '@/types/dashboard';
import { BriefcaseBusiness, CalendarClock, GraduationCap, IdCard, ScanLine, UserRound } from 'lucide-react';
import { LatestVisitDetailItem } from './latest-visit-detail-item';
import { formatVisitDateTime, visitorTypeLabel } from './latest-visit-card-utils';

interface LatestVisitDetailsDialogProps {
    open: boolean;
    visit: DashboardVisit;
    onOpenChange: (open: boolean) => void;
}

export function LatestVisitDetailsDialog({ open, visit, onOpenChange }: LatestVisitDetailsDialogProps) {
    const TypeIcon = visit.visitor.type === 'employee' ? BriefcaseBusiness : GraduationCap;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-0 sm:max-w-3xl">
                <div className="h-2 bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_52%,#010440_100%)]" />
                <DialogHeader>
                    <div className="px-6 pt-6">
                        <DialogTitle className="text-2xl text-[#010440]">Latest scanned visitor</DialogTitle>
                        <DialogDescription className="mt-1">Complete details for the most recent Radio-Frequency ID visit.</DialogDescription>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 p-6 sm:grid-cols-[176px_minmax(0,1fr)]">
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

                        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                            <LatestVisitDetailItem label="Visitor type" value={visitorTypeLabel(visit)} />
                            {visit.visitor.type === 'employee' ? (
                                <LatestVisitDetailItem label="Department" value={visit.visitor.department} />
                            ) : (
                                <>
                                    <LatestVisitDetailItem label="Year level" value={visit.visitor.yearLevel} />
                                    <LatestVisitDetailItem label="Section" value={visit.visitor.section} />
                                </>
                            )}
                        </div>

                        <div className="mt-5 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4 text-sm text-[#020659]">
                            <div className="flex items-center gap-2 font-medium text-[#010440]">
                                <IconBadge icon={ScanLine} className="size-8" iconClassName="size-4" />
                                Visit record
                            </div>
                            <p className="mt-2 leading-6">
                                This detail view is read-only. Edit visitor profile information from Registered Visitors when a name, photo, or
                                department needs correction.
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
        <div className="overflow-hidden rounded-xl border border-[#040DBF]/15 bg-[#f6f8ff] p-2 shadow-sm">
            <FallbackImage
                src={visit.visitor.photoUrl}
                className="aspect-square size-full rounded-lg object-cover"
                fallback={
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-white text-[#030A8C]/45">
                        <UserRound className="size-12" />
                    </div>
                }
            />
        </div>
    );
}
