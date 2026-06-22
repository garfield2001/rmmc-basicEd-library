import { IconBadge } from '@/components/ui/icon-badge';
import { type DashboardVisit } from '@/types/dashboard';
import { Clock3 } from 'lucide-react';
import { useId, useState } from 'react';
import { LatestVisitDetailItem } from './latest-visit-detail-item';
import { academicOrWorkDetail, formatVisitTime } from './latest-visit-formatters';

interface LatestVisitSummaryProps {
    visit: DashboardVisit | null;
    emptyMessage: string;
    onDetailsOpen: () => void;
}

export function LatestVisitSummary({ visit, emptyMessage, onDetailsOpen }: LatestVisitSummaryProps) {
    const [tooltipPosition, setTooltipPosition] = useState({ x: 16, y: 16 });
    const tooltipId = useId();

    if (!visit) {
        return (
            <div className="admin-surface rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <IconBadge icon={Clock3} className="size-11 bg-[#040DBF] text-white" />
                    <div>
                        <p className="text-sm font-medium text-zinc-500">Latest scan</p>
                        <p className="mt-1 text-2xl font-semibold">No scans yet</p>
                    </div>
                </div>
                <p className="mt-5 text-sm text-zinc-500">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={onDetailsOpen}
            onPointerMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();

                setTooltipPosition({
                    x: event.clientX - bounds.left + 16,
                    y: event.clientY - bounds.top - 12,
                });
            }}
            className="admin-surface group relative cursor-pointer rounded-xl border border-zinc-200 bg-white/90 p-5 text-left shadow-sm transition duration-200 ease-out hover:scale-[1.01] hover:border-zinc-300 hover:bg-white hover:shadow-md focus:ring-4 focus:ring-zinc-100 focus:outline-none"
            aria-label={`View full details for ${visit.visitor.name ?? 'latest scanned visitor'}`}
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
                <LatestVisitDetailItem label="Name" value={visit.visitor.name ?? 'Unknown visitor'} />
                <LatestVisitDetailItem label="ID" value={visit.visitor.schoolId ?? 'No ID'} />
                <LatestVisitDetailItem
                    label={visit.visitor.type === 'student' ? 'Year and section' : 'Department'}
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
    );
}
