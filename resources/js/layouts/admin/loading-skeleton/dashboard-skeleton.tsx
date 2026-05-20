import { ChartPanelSkeleton, MetricStripSkeleton } from '@/layouts/admin/loading-skeleton/shared-skeletons';

export function DashboardSkeleton() {
    return (
        <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="admin-page-loading-surface p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3">
                                <span className="admin-page-loading-line h-3 w-28" />
                                <span className="admin-page-loading-line h-9 w-20" />
                            </div>
                            <span className="admin-page-loading-icon" />
                        </div>
                        <span className="admin-page-loading-line mt-4 h-3 w-36 max-w-full" />
                    </div>
                ))}
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <ChartPanelSkeleton rows={7} />
                <div className="grid gap-4">
                    <div className="admin-page-loading-surface p-5">
                        <span className="admin-page-loading-line h-5 w-40" />
                        <div className="mt-5 grid gap-3">
                            <MetricStripSkeleton />
                            <MetricStripSkeleton />
                        </div>
                    </div>
                    <ChartPanelSkeleton rows={2} />
                </div>
            </section>

            <ChartPanelSkeleton rows={5} />
        </>
    );
}
