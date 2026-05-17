export function ReportResultsSkeleton() {
    return (
        <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading report results">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="admin-page-loading-surface p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3">
                                <span className="admin-page-loading-line h-3 w-24" />
                                <span className="admin-page-loading-line h-9 w-16" />
                            </div>
                            <span className="admin-page-loading-icon" />
                        </div>
                        <span className="admin-page-loading-line mt-4 h-3 w-32 max-w-full" />
                    </div>
                ))}
            </section>

            <section className="admin-page-loading-surface p-5">
                <span className="admin-page-loading-line h-5 w-48 max-w-full" />
                <span className="admin-page-loading-line mt-3 h-3 w-64 max-w-full" />
                <span className="admin-page-loading-line mt-5 h-2 w-full" />
            </section>

            <section className="admin-page-loading-surface overflow-hidden">
                <div className="grid min-w-180 grid-cols-5 gap-4 border-b border-[#040DBF]/10 bg-[#f6f8ff]/70 px-5 py-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <span key={index} className="admin-page-loading-line h-3 w-20 max-w-full" />
                    ))}
                </div>
                {Array.from({ length: 7 }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid min-h-16 min-w-180 grid-cols-5 items-center gap-4 border-b border-[#040DBF]/10 px-5 py-3 last:border-b-0"
                    >
                        {Array.from({ length: 5 }).map((_, columnIndex) => (
                            <span
                                key={columnIndex}
                                className={`admin-page-loading-line h-3 ${columnIndex % 3 === 0 ? 'w-24' : columnIndex % 3 === 1 ? 'w-16' : 'w-32'} max-w-full`}
                            />
                        ))}
                    </div>
                ))}
            </section>
        </>
    );
}
