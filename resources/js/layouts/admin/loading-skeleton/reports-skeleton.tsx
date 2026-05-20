import { TableSkeleton } from '@/layouts/admin/loading-skeleton/shared-skeletons';

export function ReportsSkeleton() {
    return (
        <>
            <div className="admin-page-loading-surface p-5">
                <div className="grid gap-4 md:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="space-y-2">
                            <span className="admin-page-loading-line h-3 w-24" />
                            <span className="admin-page-loading-line h-10 w-full rounded-lg" />
                        </div>
                    ))}
                    <div className="flex gap-2 md:col-span-2">
                        <span className="admin-page-loading-line h-10 w-24 rounded-lg" />
                        <span className="admin-page-loading-line h-10 w-20 rounded-lg" />
                        <span className="admin-page-loading-line h-10 w-20 rounded-lg" />
                    </div>
                </div>
            </div>

            <section className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="admin-page-loading-surface p-5">
                        <span className="admin-page-loading-line h-3 w-24" />
                        <span className="admin-page-loading-line mt-4 h-8 w-16" />
                    </div>
                ))}
            </section>

            <TableSkeleton columns={7} rows={7} />
        </>
    );
}
