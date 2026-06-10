import type { RequiredProgressPoint } from '@/types/dashboard';
import { EmptyChartState } from './empty-chart-state';

export function RequiredProgressPanel({ progress, framed = true }: { progress: RequiredProgressPoint[]; framed?: boolean }) {
    const content = (
        <>
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Required Visit Progress</h2>
                    <p className="text-sm text-[#020659]/70">Progress is measured against the required visits but does not limit scanning.</p>
                </div>
            </div>

            {progress.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                    {progress.map((item) => (
                        <article key={item.label} className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-[#010440]">{item.label}</p>
                                    <p className="mt-1 text-sm text-[#020659]/70">
                                        {item.met_required.toLocaleString()} of {item.visitors.toLocaleString()} met {item.required} visits
                                    </p>
                                </div>
                                <span className="text-2xl font-semibold text-[#010440] tabular-nums">{item.percent}%</span>
                            </div>
                            <div className="admin-progress-track mt-4 h-3 overflow-hidden rounded-full bg-[#040DBF]/10">
                                <div className="admin-progress-fill h-full rounded-full" style={{ width: `${item.percent}%` }} />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-[#020659]/70">
                                <span>{item.visits.toLocaleString()} visits</span>
                                <span>{item.required_total.toLocaleString()} expected</span>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <EmptyChartState message="Configure an active school year to calculate required visit progress." />
            )}
        </>
    );

    if (!framed) {
        return <div>{content}</div>;
    }

    return <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">{content}</section>;
}
