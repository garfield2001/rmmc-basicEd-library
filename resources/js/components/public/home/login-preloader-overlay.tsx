export function LoginPreloaderOverlay({ visible }: { visible: boolean }) {
    if (!visible) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-white text-[#010440]" role="status" aria-live="polite">
            <div className="w-[min(88vw,440px)] text-center">
                <p className="text-xs font-semibold tracking-[0.24em] text-[#030A8C] uppercase">RMMC Library Admin</p>
                <p className="mt-3 text-2xl font-semibold tracking-normal text-[#010440]">Preparing workspace</p>
                <div className="mt-6 overflow-hidden rounded-full border border-[#040DBF]/15 bg-[#f6f8ff] p-1 shadow-sm shadow-[#010440]/5">
                    <div className="route-preloader h-2 w-1/2 rounded-full bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_55%,#010440_100%)]" />
                </div>
                <p className="mt-3 text-sm text-[#030A8C]">Credentials verified. Loading the admin workspace.</p>
            </div>
        </div>
    );
}
