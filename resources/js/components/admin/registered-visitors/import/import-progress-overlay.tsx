export function ImportProgressOverlay({ previewOpen }: { previewOpen: boolean }) {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white/75 backdrop-blur-sm">
            <div className="w-[min(92vw,26rem)] rounded-xl border border-[#040DBF]/15 bg-white p-6 text-center shadow-xl">
                <div className="mx-auto size-10 animate-spin rounded-full border-4 border-[#040DBF]/15 border-t-[#040DBF]" />
                <p className="mt-4 text-base font-semibold text-[#010440]">
                    {previewOpen ? 'Importing members...' : 'Reading import file...'}
                </p>
                <p className="mt-1 text-sm text-[#020659]/70">Please keep this page open while the roster is processed.</p>
            </div>
        </div>
    );
}
