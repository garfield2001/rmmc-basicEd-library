import { visitFallback } from './latest-visit-card-utils';

export function LatestVisitDetailItem({ label, value, className = '' }: { label: string; value: string | null | undefined; className?: string }) {
    return (
        <div className={className}>
            <p className="text-[#020659]/70">{label}</p>
            <p className="mt-1 font-medium text-[#010440]">{value || visitFallback}</p>
        </div>
    );
}
