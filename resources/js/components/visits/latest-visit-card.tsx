import { IconBadge } from '@/components/ui/icon-badge';
import { type DashboardVisit } from '@/types/dashboard';
import { Clock3 } from 'lucide-react';
import { useId, useState } from 'react';
import { academicOrWorkDetail, formatVisitTime } from './latest-visit-card-utils';
import { LatestVisitDetailItem } from './latest-visit-detail-item';
import { LatestVisitDetailsDialog } from './latest-visit-details-dialog';

interface LatestVisitCardProps {
    visit: DashboardVisit | null;
    emptyMessage: string;
}

export function LatestVisitCard({ visit, emptyMessage }: LatestVisitCardProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 16, y: 16 });
    const tooltipId = useId();

    return (
        <>
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
                    className="admin-surface group relative flex h-full w-full cursor-pointer flex-col justify-between rounded-xl border border-[#040DBF]/10 bg-white/95 p-5 text-left shadow-sm transition duration-200 ease-out hover:scale-[1.01] hover:border-[#040DBF]/25 hover:bg-white hover:shadow-md focus:ring-4 focus:ring-[#040DBF]/10 focus:outline-none dark:border-slate-800 dark:bg-slate-900"
                    aria-label={`View full details for ${visit.visitor.name ?? 'latest scanned visitor'}`}
                    aria-describedby={tooltipId}
                >
                    <div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <IconBadge icon={Clock3} className="size-11 bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/25 dark:bg-blue-600" />
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-wide text-[#030A8C] uppercase dark:text-sky-300">Latest scan</p>
                                    <p className="mt-0.5 text-xl font-extrabold text-[#010440] sm:text-2xl dark:text-white">
                                        {formatVisitTime(visit)}
                                    </p>
                                </div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                                Verified
                            </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                            <LatestVisitDetailItem label="Name" value={visit.visitor.name ?? 'Unknown visitor'} />
                            <LatestVisitDetailItem label="ID" value={visit.visitor.schoolId ?? 'No ID'} />
                            <LatestVisitDetailItem
                                label={visit.visitor.type === 'student' ? 'Year and section' : 'Department'}
                                value={academicOrWorkDetail(visit)}
                            />
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
                        <span>Click card for complete visitor profile</span>
                        <span className="font-semibold text-[#040DBF] dark:text-sky-400">View details &rarr;</span>
                    </div>

                    <div
                        id={tooltipId}
                        role="tooltip"
                        className="pointer-events-none absolute z-10 -translate-y-full rounded-md bg-zinc-950 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-sm transition-opacity delay-150 duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 before:absolute before:bottom-[-4px] before:left-4 before:size-2 before:rotate-45 before:bg-zinc-950"
                        style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
                    >
                        Click for more details
                    </div>
                </button>
            ) : (
                <div className="admin-surface flex h-full flex-col justify-between rounded-xl border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div>
                        <div className="flex items-center gap-3">
                            <IconBadge icon={Clock3} className="size-11 bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500" />
                            <div>
                                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase dark:text-slate-500">Latest scan</p>
                                <p className="mt-0.5 text-xl font-extrabold text-slate-400 sm:text-2xl dark:text-slate-500">Awaiting scan</p>
                            </div>
                        </div>
                        <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">{emptyMessage}</p>
                    </div>
                    <div className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-600">
                        Visitor credentials and profile details will spotlight here immediately upon scan.
                    </div>
                </div>
            )}

            {visit && <LatestVisitDetailsDialog visit={visit} open={showDetails} onOpenChange={setShowDetails} />}
        </>
    );
}
