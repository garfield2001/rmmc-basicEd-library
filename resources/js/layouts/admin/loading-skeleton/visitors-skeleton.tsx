import { TableSkeleton } from '@/layouts/admin/loading-skeleton/shared-skeletons';

export function VisitorsSkeleton() {
    return (
        <>
            <div className="admin-page-loading-surface p-5">
                <div className="grid gap-3 md:grid-cols-[minmax(14rem,1fr)_12rem_12rem_12rem]">
                    <span className="admin-page-loading-line h-10 w-full rounded-lg" />
                    <span className="admin-page-loading-line h-10 w-full rounded-lg" />
                    <span className="admin-page-loading-line h-10 w-full rounded-lg" />
                    <span className="admin-page-loading-line h-10 w-full rounded-lg" />
                </div>
            </div>
            <TableSkeleton columns={6} rows={8} withAvatar withToolbar />
        </>
    );
}

export function VisitorFormSkeleton() {
    return (
        <>
            <div className="border-b border-zinc-200 bg-white py-5">
                <div className="space-y-3">
                    <span className="admin-page-loading-line h-8 w-64 max-w-full" />
                    <span className="admin-page-loading-line h-3 w-80 max-w-full" />
                </div>
            </div>

            <FormSectionSkeleton columns={3} rows={3} hasIcon />
            <FormSectionSkeleton columns={3} rows={5} />
            <FormSectionSkeleton columns={2} rows={2} hasIcon />

            <div className="flex justify-end gap-2">
                <span className="admin-page-loading-line h-10 w-24 rounded-lg" />
                <span className="admin-page-loading-line h-10 w-32 rounded-lg" />
            </div>
        </>
    );
}

function FormSectionSkeleton({ columns, rows, hasIcon = false }: { columns: number; rows: number; hasIcon?: boolean }) {
    return (
        <section className="admin-page-loading-surface p-5">
            <div className="flex items-center gap-3">
                {hasIcon && <span className="admin-page-loading-icon size-10" />}
                <div className="space-y-2">
                    <span className="admin-page-loading-line h-5 w-36" />
                    {hasIcon && <span className="admin-page-loading-line h-3 w-28" />}
                </div>
            </div>
            <div className={`mt-5 grid gap-4 ${columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                {Array.from({ length: rows }).map((_, index) => (
                    <div key={index} className={index === 3 && columns === 3 ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
                        <span className="admin-page-loading-line h-3 w-24" />
                        <span className="admin-page-loading-line h-10 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        </section>
    );
}
