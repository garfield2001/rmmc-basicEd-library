import { formatTime } from '@/components/admin/dashboard/dashboard-summary';
import type { AdminDashboard } from '@/types/dashboard';
import { Link } from '@inertiajs/react';
import { Clock3, Settings2 } from 'lucide-react';

interface DashboardOperationsPanelProps {
    dashboard: AdminDashboard;
}

export function DashboardOperationsPanel({ dashboard }: DashboardOperationsPanelProps) {
    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <span className="admin-icon-badge inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                        <Clock3 className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#030A8C]">Scan window</p>
                        <h2 className="mt-1 text-xl font-semibold tracking-normal text-[#010440]">
                            {formatTime(dashboard.scanWindow.starts_at)} to {formatTime(dashboard.scanWindow.ends_at)}
                        </h2>
                        <p className="mt-1 text-sm text-[#020659]/70">
                            Scanning opens at {formatTime(dashboard.scanWindow.starts_at)} and closes at {formatTime(dashboard.scanWindow.ends_at)}.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href="/admin/settings"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#040DBF] px-4 text-sm font-medium text-white shadow-sm shadow-[#040DBF]/20 hover:bg-[#030A8C]"
                    >
                        <Settings2 className="size-4" />
                        More details
                    </Link>
                </div>
            </div>
        </section>
    );
}
