import { TableSkeleton } from '@/layouts/admin/loading-skeleton/shared-skeletons';

export function LiveVisitsSkeleton() {
    return (
        <>
            <div className="admin-page-loading-surface p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center">
                    <div className="space-y-3">
                        <span className="admin-page-loading-line h-4 w-36" />
                        <span className="admin-page-loading-line h-12 w-full rounded-lg" />
                    </div>
                    <span className="admin-page-loading-line h-10 w-full rounded-lg" />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="admin-page-loading-surface p-5">
                    <div className="flex items-center gap-4">
                        <span className="admin-page-loading-photo size-20" />
                        <div className="min-w-0 flex-1 space-y-3">
                            <span className="admin-page-loading-line h-5 w-48 max-w-full" />
                            <span className="admin-page-loading-line h-3 w-64 max-w-full" />
                            <span className="admin-page-loading-line h-3 w-32 max-w-full" />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="admin-page-loading-surface p-4">
                            <span className="admin-page-loading-line h-3 w-16" />
                            <span className="admin-page-loading-line mt-3 h-7 w-12" />
                        </div>
                    ))}
                </div>
            </div>

            <TableSkeleton columns={5} rows={6} withAvatar />
        </>
    );
}
