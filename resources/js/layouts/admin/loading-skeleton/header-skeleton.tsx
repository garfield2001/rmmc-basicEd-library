export function HeaderSkeleton({ hasAction = false }: { hasAction?: boolean }) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
                <span className="admin-page-loading-line h-8 w-56 max-w-full" />
                <span className="admin-page-loading-line h-3 w-[min(34rem,100%)]" />
                <span className="admin-page-loading-line h-3 w-[min(24rem,86%)]" />
            </div>
            {hasAction && <span className="admin-page-loading-line h-10 w-40 max-w-full rounded-lg" />}
        </div>
    );
}
