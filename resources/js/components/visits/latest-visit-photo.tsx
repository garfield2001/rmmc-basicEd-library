import { FallbackImage } from '@/components/ui/fallback-image';
import { type DashboardVisit } from '@/types/dashboard';
import { UserRound } from 'lucide-react';

export function LatestVisitPhoto({ visit }: { visit: DashboardVisit }) {
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
