import { FormPanelSkeleton, MetricStripSkeleton } from '@/layouts/admin/loading-skeleton/shared-skeletons';

export function SettingsSkeleton() {
    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
            <div className="admin-page-loading-surface p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <span className="admin-page-loading-line h-5 w-44" />
                        <span className="admin-page-loading-line h-3 w-64 max-w-full" />
                    </div>
                    <span className="admin-page-loading-line h-10 w-32 rounded-lg" />
                </div>
                <div className="mt-6 space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <MetricStripSkeleton key={index} />
                    ))}
                </div>
            </div>
            <FormPanelSkeleton rows={5} />
        </div>
    );
}
