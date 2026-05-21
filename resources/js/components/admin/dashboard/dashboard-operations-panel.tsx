import { formatTime } from '@/components/admin/dashboard/dashboard-summary';
import type { AdminDashboard } from '@/types/dashboard';
import { Link } from '@inertiajs/react';
import { AlertCircle, ClipboardList, FileText, RadioTower, UsersRound } from 'lucide-react';

interface DashboardOperationsPanelProps {
    dashboard: AdminDashboard;
    schoolYearDates: string;
}

export function DashboardOperationsPanel({ dashboard, schoolYearDates }: DashboardOperationsPanelProps) {
    const needsAttention = dashboard.charts.requiredProgress.reduce((sum, item) => sum + Math.max(0, item.visitors - item.met_required), 0);
    const schoolYearName = dashboard.schoolYear?.name ?? 'No active school year';

    return (
        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <article className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-[#030A8C]">Operations status</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-normal text-[#010440]">{schoolYearName}</h2>
                        <p className="mt-1 text-sm text-[#020659]/70">{schoolYearDates}</p>
                    </div>
                    <span className="rounded-full bg-[#040DBF]/10 px-3 py-1 text-xs font-semibold text-[#030A8C]">
                        Scan window: {formatTime(dashboard.scanWindow.starts_at)} - {formatTime(dashboard.scanWindow.ends_at)}
                    </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <StatusTile label="Visits today" value={dashboard.metrics.visitsToday} detail="Live scan volume" />
                    <StatusTile label="Need progress" value={needsAttention} detail="Below required visits" tone={needsAttention > 0 ? 'warning' : 'normal'} />
                    <StatusTile label="Roster coverage" value={dashboard.metrics.registeredVisitors} detail="Visit-eligible profiles" />
                </div>
            </article>

            <article className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <AlertCircle className="size-5 text-[#040DBF]" />
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Admin shortcuts</h2>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                    <QuickLink href="/admin/live-visits" icon={RadioTower} label="Live Visits" detail="Monitor scans now" />
                    <QuickLink href="/admin/visits-history" icon={ClipboardList} label="Visit Logs" detail="Audit visitor records" />
                    <QuickLink href="/admin/reports" icon={FileText} label="Reports" detail="Export progress files" />
                    <QuickLink href="/admin/registered-visitors" icon={UsersRound} label="Visitors" detail="Manage profiles" />
                </div>
            </article>
        </section>
    );
}

function StatusTile({ label, value, detail, tone = 'normal' }: { label: string; value: number; detail: string; tone?: 'normal' | 'warning' }) {
    const color = tone === 'warning' ? 'text-amber-700' : 'text-[#010440]';

    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#030A8C] uppercase">{label}</p>
            <p className={`mt-2 text-3xl font-semibold tracking-normal ${color}`}>{value.toLocaleString()}</p>
            <p className="mt-1 text-sm text-[#020659]/70">{detail}</p>
        </div>
    );
}

function QuickLink({ href, icon: Icon, label, detail }: { href: string; icon: typeof RadioTower; label: string; detail: string }) {
    return (
        <Link href={href} className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-3 transition hover:border-[#040DBF]/30 hover:bg-white">
            <div className="flex items-start gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                    <span className="block font-semibold text-[#010440]">{label}</span>
                    <span className="mt-1 block text-sm text-[#020659]/70">{detail}</span>
                </span>
            </div>
        </Link>
    );
}
