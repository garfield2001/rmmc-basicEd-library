import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type DashboardVisit } from '@/types';
import { BriefcaseBusiness, Clock3, GraduationCap, IdCard, ScanLine, UserRound } from 'lucide-react';
import { useId, useState } from 'react';

interface LatestVisitCardProps {
    visit: DashboardVisit | null;
    emptyMessage: string;
}

const fallback = '-';

function formatVisitTime(visit: DashboardVisit) {
    return visit.visitedAt
        ? new Date(visit.visitedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Pending';
}

function formatVisitDateTime(visit: DashboardVisit) {
    return visit.visitedAt
        ? new Date(visit.visitedAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Pending';
}

function memberTypeLabel(visit: DashboardVisit) {
    if (visit.member.type === 'student') {
        return 'Student';
    }

    if (visit.member.type === 'employee') {
        return 'Employee';
    }

    return 'Unknown member type';
}

function academicOrWorkDetail(visit: DashboardVisit) {
    if (visit.member.type === 'student') {
        return [visit.member.yearLevel, visit.member.section].filter(Boolean).join(' - ') || fallback;
    }

    return visit.member.department || fallback;
}

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-zinc-500">{label}</p>
            <p className="mt-1 font-medium text-zinc-950">{value || fallback}</p>
        </div>
    );
}

export function LatestVisitCard({ visit, emptyMessage }: LatestVisitCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 16, y: 16 });
    const tooltipId = useId();
    const TypeIcon = visit?.member.type === 'employee' ? BriefcaseBusiness : GraduationCap;

    return (
        <>
            <section className="grid gap-4">
                {visit ? (
                    <button
                        type="button"
                        onClick={() => setShowDetails(true)}
                        onPointerMove={(event) => {
                            const bounds = event.currentTarget.getBoundingClientRect();

                            setTooltipPosition({
                                x: event.clientX - bounds.left + 16,
                                y: event.clientY - bounds.top - 12,
                            });
                        }}
                        className="group relative cursor-pointer rounded-xl border border-zinc-200 bg-white/90 p-5 text-left shadow-sm transition duration-200 ease-out hover:scale-[1.01] hover:border-zinc-300 hover:bg-white hover:shadow-md focus:ring-4 focus:ring-zinc-100 focus:outline-none"
                        aria-label={`View full details for ${visit.member.name ?? 'latest scanned member'}`}
                        aria-describedby={tooltipId}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                    <Clock3 className="size-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-zinc-500">Latest scan</p>
                                    <p className="mt-1 text-2xl font-semibold">{formatVisitTime(visit)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                            <DetailItem label="Name" value={visit.member.name ?? 'Unknown member'} />
                            <DetailItem label="ID" value={visit.member.schoolId ?? 'No ID'} />
                            <DetailItem label={visit.member.type === 'student' ? 'Year and section' : 'Department'} value={academicOrWorkDetail(visit)} />
                        </div>

                        <div
                            id={tooltipId}
                            role="tooltip"
                            className="pointer-events-none absolute z-10 -translate-y-full rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity duration-150 delay-150 before:absolute before:bottom-[-4px] before:left-4 before:size-2 before:rotate-45 before:bg-zinc-950 group-hover:opacity-100 group-focus-visible:opacity-100"
                            style={{
                                left: tooltipPosition.x,
                                top: tooltipPosition.y,
                            }}
                        >
                            Click for more details
                        </div>
                    </button>
                ) : (
                    <div className="rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                <Clock3 className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Latest scan</p>
                                <p className="mt-1 text-2xl font-semibold">No scans yet</p>
                            </div>
                        </div>
                        <p className="mt-5 text-sm text-zinc-500">{emptyMessage}</p>
                    </div>
                )}
            </section>

            {visit && (
                <Dialog open={showDetails} onOpenChange={setShowDetails}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Latest scanned member</DialogTitle>
                            <DialogDescription>Complete details for the most recent RFID visit.</DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-5 sm:grid-cols-[132px_minmax(0,1fr)]">
                            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                                {visit.member.photoUrl ? (
                                    <img src={visit.member.photoUrl} alt="" className="aspect-square size-full object-cover" />
                                ) : (
                                    <div className="flex aspect-square items-center justify-center text-zinc-400">
                                        <UserRound className="size-12" />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
                                        <TypeIcon className="size-3.5" />
                                        {memberTypeLabel(visit)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
                                        <ScanLine className="size-3.5" />
                                        {formatVisitDateTime(visit)}
                                    </span>
                                </div>

                                <p className="mt-4 text-2xl font-semibold text-zinc-950">{visit.member.name ?? 'Unknown member'}</p>
                                <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
                                    <IdCard className="size-4" />
                                    {visit.member.schoolId ?? 'No ID'}
                                </p>

                                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                                    <DetailItem label="Member type" value={memberTypeLabel(visit)} />
                                    <DetailItem label="Group" value={visit.member.group} />
                                    <DetailItem label="Year level" value={visit.member.yearLevel} />
                                    <DetailItem label="Section" value={visit.member.section} />
                                    <DetailItem label="Department" value={visit.member.department} />
                                    <DetailItem label="Photo file" value={visit.member.photo} />
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
