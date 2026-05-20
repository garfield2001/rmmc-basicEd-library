import { visitFallback } from './latest-visit-card-utils';

export function LatestVisitDetailItem({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <p className="text-[#020659]/70">{label}</p>
            <p className="mt-1 font-medium text-[#010440]">{value || visitFallback}</p>
        </div>
    );
}
