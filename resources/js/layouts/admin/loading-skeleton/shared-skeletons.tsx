import type { CSSProperties } from 'react';

export function TableSkeleton({ columns, rows, withAvatar = false, withToolbar = false }: { columns: number; rows: number; withAvatar?: boolean; withToolbar?: boolean }) {
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

export function ChartPanelSkeleton({ rows }: { rows: number }) {
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

export function MetricStripSkeleton() {
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

export function FormPanelSkeleton({ rows }: { rows: number }) {
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
