import { visitFallback } from './latest-visit-card-utils';

export function LatestVisitDetailItem({ label, value, className = '' }: { label: string; value: string | null | undefined; className?: string }) {
    return (
        <div className={className}>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</p>
            <p className="mt-0.5 text-sm font-bold text-[#010440] dark:text-white">{value || visitFallback}</p>
        </div>
    );
}
