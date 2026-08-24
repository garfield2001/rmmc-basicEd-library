export function ReportEmptyState({ reportCanFetch }: { reportCanFetch: boolean }) {
    return (
        <section className="admin-surface flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#040DBF]/20 bg-white/80 p-12 text-center">
            <h2 className="text-lg font-semibold text-[#010440]">{reportCanFetch ? 'No report results' : 'Complete the report filters'}</h2>
            <p className="mt-2 max-w-md text-sm text-[#020659]/70">
                {reportCanFetch
                    ? 'No visitors matched the selected school year, date range, and filters.'
                    : 'Choose the school year, date coverage, visitor type, and the required student or employee filter before results appear.'}
            </p>
        </section>
    );
}
