import { formatTime } from '@/components/admin/dashboard/dashboard-summary';
import { ScanSettingsForm, type ScanSettings } from '@/components/admin/settings/scan-settings-form';
import type { DashboardScanSettings } from '@/types/dashboard';
import { Clock3, Settings2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DashboardOperationsPanelProps {
    dashboard: {
        scanWindow: {
            starts_at: string;
            ends_at: string;
        };
    };
    scanSettings: DashboardScanSettings;
}

export function DashboardOperationsPanel({ dashboard, scanSettings }: DashboardOperationsPanelProps) {
    const [showDrawer, setShowDrawer] = useState(false);
    const motion = 'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';
    const drawerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!showDrawer) {
            return;
        }

        const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setShowDrawer(false);

        document.documentElement.classList.add('modal-scroll-locked');
        document.body.classList.add('modal-scroll-locked');
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('keydown', closeOnEscape);
            document.documentElement.classList.remove('modal-scroll-locked');
            document.body.classList.remove('modal-scroll-locked');
        };
    }, [showDrawer]);

    return (
        <>
            <section className="admin-surface rounded-xl border border-[#040DBF]/10 bg-white/95 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between p-5">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF] dark:bg-sky-500/20 dark:text-sky-400">
                            <Clock3 className="size-5" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-bold tracking-wide text-[#030A8C] uppercase dark:text-sky-300">Scan window</p>
                            <h2 className="mt-1 text-lg font-bold tracking-tight text-[#010440] sm:text-xl dark:text-white">
                                Opens at {formatTime(dashboard.scanWindow.starts_at)}, closes at {formatTime(dashboard.scanWindow.ends_at)}
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowDrawer(true)}
                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[#040DBF] px-4 text-xs font-bold text-white shadow-sm shadow-[#040DBF]/20 transition-all hover:bg-[#030A8C] dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        <Settings2 className="size-4" />
                        <span className="hidden sm:inline">More details</span>
                    </button>
                </div>
            </section>

            {showDrawer &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div className="admin-theme-root fixed inset-0 z-[60] h-[100dvh]" ref={drawerRef}>
                        <div
                            className="fixed inset-0 h-[100dvh] bg-[#010440]/30 backdrop-blur-[4px] transition-opacity duration-150 ease-out"
                            aria-hidden="true"
                            onClick={() => setShowDrawer(false)}
                        />
                        <div
                            className={`admin-surface fixed inset-y-0 right-0 flex h-[100dvh] w-full max-w-lg transform-gpu flex-col overflow-hidden bg-white shadow-2xl transition-transform dark:border-slate-800 dark:bg-slate-900 ${motion}`}
                        >
                            <div className="flex shrink-0 items-center justify-between border-b border-[#040DBF]/10 px-6 py-5 dark:border-slate-800">
                                <div>
                                    <h2 className="text-lg font-bold text-[#010440] dark:text-white">Scan rules</h2>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                        Edit repeat-scan interval and daily visit scanning window.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowDrawer(false)}
                                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-all hover:bg-[#040DBF]/5 hover:text-[#040DBF] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                                <ScanSettingsForm settings={scanSettings as unknown as ScanSettings} noWrapper />
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
