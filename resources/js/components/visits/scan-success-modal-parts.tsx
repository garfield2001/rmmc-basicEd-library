import { FallbackImage } from '@/components/ui/fallback-image';
import { type DashboardVisit } from '@/types/dashboard';
import { type LucideIcon, UserRound } from 'lucide-react';

const fallback = '-';

export function visitSignature(visit: DashboardVisit | null | undefined) {
    return visit ? `${visit.id}:${visit.visitedAt ?? 'pending'}` : null;
}

export function formatVisitTime(visitedAt: string | null) {
    return visitedAt
        ? new Date(visitedAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Just now';
}

export function DetailItem({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: LucideIcon }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-white/90 p-4 shadow-sm shadow-[#010440]/5">
            <div className="flex items-center gap-2 text-[#030A8C]">
                {Icon && <Icon className="size-4" />}
                <p className="text-xs font-semibold tracking-[0.14em] uppercase">{label}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-normal text-[#010440]">{value || fallback}</p>
        </div>
    );
}

export function ScanVisitorPhoto({ visit }: { visit: DashboardVisit }) {
    return (
        <div className="scan-success-photo overflow-hidden rounded-xl border border-[#040DBF]/15 bg-white p-2 shadow-lg shadow-[#010440]/10">
            <FallbackImage
                src={visit.visitor.photoUrl}
                className="aspect-square size-full rounded-lg object-cover"
                fallback={
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-[#eef2ff] text-[#030A8C]/50">
                        <UserRound className="size-20" />
                    </div>
                }
            />
        </div>
    );
}
