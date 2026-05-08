import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FallbackImage } from '@/components/ui/fallback-image';
import { IconBadge } from '@/components/ui/icon-badge';
import { type DashboardVisit } from '@/types/dashboard';
import { BriefcaseBusiness, CalendarClock, Clock3, GraduationCap, IdCard, ScanLine, UserRound } from 'lucide-react';
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
            <p className="text-[#020659]/70">{label}</p>
            <p className="mt-1 font-medium text-[#010440]">{value || fallback}</p>
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
                                <IconBadge icon={Clock3} className="size-11 bg-[#040DBF] text-white" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-zinc-500">Latest scan</p>
                                    <p className="mt-1 text-2xl font-semibold">{formatVisitTime(visit)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                            <DetailItem label="Name" value={visit.member.name ?? 'Unknown member'} />
                            <DetailItem label="ID" value={visit.member.schoolId ?? 'No ID'} />
                            <DetailItem
                                label={visit.member.type === 'student' ? 'Year and section' : 'Department'}
                                value={academicOrWorkDetail(visit)}
                            />
                        </div>

                        <div
                            id={tooltipId}
                            role="tooltip"
                            className="pointer-events-none absolute z-10 -translate-y-full rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity delay-150 duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 before:absolute before:bottom-[-4px] before:left-4 before:size-2 before:rotate-45 before:bg-zinc-950"
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
                            <IconBadge icon={Clock3} className="size-11 bg-[#040DBF] text-white" />
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
                    <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
                        <div className="h-2 bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_52%,#010440_100%)]" />
                        <DialogHeader>
                            <div className="px-6 pt-6">
                                <DialogTitle className="text-2xl text-[#010440]">Latest scanned member</DialogTitle>
                                <DialogDescription className="mt-1">Complete details for the most recent RFID visit.</DialogDescription>
                            </div>
                        </DialogHeader>

                        <div className="grid gap-6 p-6 sm:grid-cols-[176px_minmax(0,1fr)]">
                            <VisitPhoto visit={visit} />

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#040DBF]/15 bg-[#f6f8ff] px-3 py-1 text-xs font-medium text-[#030A8C]">
                                        <TypeIcon className="size-3.5" />
                                        {memberTypeLabel(visit)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#040DBF]/15 bg-white px-3 py-1 text-xs font-medium text-[#030A8C]">
                                        <CalendarClock className="size-3.5" />
                                        {formatVisitDateTime(visit)}
                                    </span>
                                </div>

                                <p className="mt-5 text-3xl font-semibold tracking-normal text-[#010440]">{visit.member.name ?? 'Unknown member'}</p>
                                <p className="mt-2 flex items-center gap-2 text-sm text-[#030A8C]">
                                    <IdCard className="size-4" />
                                    {visit.member.schoolId ?? 'No ID'}
                                </p>

                                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                                    <DetailItem label="Member type" value={memberTypeLabel(visit)} />
                                    <DetailItem label="Recorded at" value={formatVisitDateTime(visit)} />
                                    {visit.member.type === 'employee' ? (
                                        <DetailItem label="Department" value={visit.member.department} />
                                    ) : (
                                        <>
                                            <DetailItem label="Year level" value={visit.member.yearLevel} />
                                            <DetailItem label="Section" value={visit.member.section} />
                                        </>
                                    )}
                                </div>

                                <div className="mt-5 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4 text-sm text-[#020659]">
                                    <div className="flex items-center gap-2 font-medium text-[#010440]">
                                        <IconBadge icon={ScanLine} className="size-8" iconClassName="size-4" />
                                        Visit record
                                    </div>
                                    <p className="mt-2 leading-6">
                                        This detail view is read-only. Edit member profile information from Library Members when a name, photo, or
                                        department needs correction.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

function VisitPhoto({ visit }: { visit: DashboardVisit }) {
    return (
        <div className="overflow-hidden rounded-xl border border-[#040DBF]/15 bg-[#f6f8ff] p-2 shadow-sm">
            <FallbackImage
                src={visit.member.photoUrl}
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
