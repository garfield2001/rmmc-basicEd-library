import type { CSSProperties } from 'react';

export type AdminLoadingTarget = 'dashboard' | 'live-visits' | 'visitors-index' | 'visitors-form' | 'reports' | 'settings';

export function AdminContentLoadingSkeleton({ target }: { target: AdminLoadingTarget }) {
    return (
        <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8" role="status" aria-live="polite" aria-label="Loading page">
            {target !== 'visitors-form' && <HeaderSkeleton hasAction={target === 'dashboard' || target === 'live-visits' || target === 'visitors-index'} />}
            {target === 'dashboard' && <DashboardSkeleton />}
            {target === 'live-visits' && <LiveVisitsSkeleton />}
            {target === 'visitors-index' && <VisitorsSkeleton />}
            {target === 'visitors-form' && <VisitorFormSkeleton />}
            {target === 'reports' && <ReportsSkeleton />}
            {target === 'settings' && <SettingsSkeleton />}
        </div>
    );
}

function HeaderSkeleton({ hasAction = false }: { hasAction?: boolean }) {
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

function DashboardSkeleton() {
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

function LiveVisitsSkeleton() {
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

function VisitorsSkeleton() {
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

function VisitorFormSkeleton() {
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

function ReportsSkeleton() {
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

function SettingsSkeleton() {
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

function TableSkeleton({ columns, rows, withAvatar = false, withToolbar = false }: { columns: number; rows: number; withAvatar?: boolean; withToolbar?: boolean }) {
    return (
        <div className="admin-page-loading-surface overflow-hidden">
            {withToolbar && (
                <div className="flex justify-end gap-2 border-b border-[#040DBF]/10 bg-[#f6f8ff]/70 px-5 py-3">
                    <span className="admin-page-loading-line h-9 w-24 rounded-lg" />
                    <span className="admin-page-loading-line h-9 w-28 rounded-lg" />
                </div>
            )}
            <div className="overflow-x-auto">
                <div className="min-w-[var(--loading-table-width)]" style={{ '--loading-table-width': `${columns * 8.5}rem` } as CSSProperties}>
                    <div
                        className="grid gap-4 border-b border-[#040DBF]/10 bg-[#f6f8ff]/70 px-5 py-4"
                        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: columns }).map((_, index) => (
                            <span key={index} className="admin-page-loading-line h-3 w-20 max-w-full" />
                        ))}
                    </div>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <div
                            key={rowIndex}
                            className="grid min-h-16 items-center gap-4 border-b border-[#040DBF]/10 px-5 py-3 last:border-b-0"
                            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                        >
                            {Array.from({ length: columns }).map((_, columnIndex) => (
                                <div key={columnIndex} className="min-w-0">
                                    {withAvatar && columnIndex === 0 ? (
                                        <div className="flex items-center gap-3">
                                            <span className="admin-page-loading-photo size-10" />
                                            <span className="admin-page-loading-line h-3 w-28 max-w-full" />
                                        </div>
                                    ) : (
                                        <span
                                            className={`admin-page-loading-line h-3 ${columnIndex % 3 === 0 ? 'w-24' : columnIndex % 3 === 1 ? 'w-16' : 'w-32'} max-w-full`}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ChartPanelSkeleton({ rows }: { rows: number }) {
    return (
        <div className="admin-page-loading-surface p-5">
            <span className="admin-page-loading-line h-5 w-48 max-w-full" />
            <div className="mt-5 space-y-4">
                {Array.from({ length: rows }).map((_, index) => (
                    <div key={index}>
                        <div className="flex items-center justify-between gap-4">
                            <span className="admin-page-loading-line h-3 w-32" />
                            <span className="admin-page-loading-line h-3 w-10" />
                        </div>
                        <span className={`admin-page-loading-line mt-2 h-2 ${index % 3 === 0 ? 'w-11/12' : index % 3 === 1 ? 'w-2/3' : 'w-4/5'}`} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function MetricStripSkeleton() {
    return (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-[#f6f8ff]/70 p-4">
            <div className="flex items-center gap-3">
                <span className="admin-page-loading-icon size-8" />
                <span className="admin-page-loading-line h-3 w-24" />
            </div>
            <span className="admin-page-loading-line h-5 w-12" />
        </div>
    );
}

function FormPanelSkeleton({ rows }: { rows: number }) {
    return (
        <div className="admin-page-loading-surface p-5">
            <span className="admin-page-loading-line h-5 w-40" />
            <div className="mt-6 space-y-4">
                {Array.from({ length: rows }).map((_, index) => (
                    <div key={index} className="space-y-2">
                        <span className="admin-page-loading-line h-3 w-24" />
                        <span className="admin-page-loading-line h-10 w-full rounded-lg" />
                    </div>
                ))}
                <span className="admin-page-loading-line h-10 w-32 rounded-lg" />
            </div>
        </div>
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
