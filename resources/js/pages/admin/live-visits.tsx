import { formatTime } from '@/components/admin/dashboard/dashboard-summary';
import { LiveVisitScanner } from '@/components/admin/live-visits/live-visit-scanner';
import { LiveVisitsTable } from '@/components/admin/live-visits/live-visits-table';
import { useLiveVisitsPage } from '@/components/admin/live-visits/use-live-visits-page';
import { VisitDetailsModal } from '@/components/admin/visits/visit-details-modal';
import { LatestVisitCard } from '@/components/visits/latest-visit-card';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminVisitMonitor } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import { BriefcaseBusiness, CalendarClock, Clock3, GraduationCap, Users } from 'lucide-react';
import { useRef } from 'react';

interface LiveVisitsProps {
    visitMonitor: AdminVisitMonitor;
}

export default function LiveVisits({ visitMonitor }: LiveVisitsProps) {
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const page = useLiveVisitsPage(visitMonitor);
    const lastVisit = page.liveVisitMonitor.todayVisits[0];
    const metrics = page.liveVisitMonitor.metrics;
    const scanWindow = page.liveVisitMonitor.scanWindow;

    return (
        <>
            <Head title="Live Visits" />
            <main className="min-h-screen">
                <AdminLayout active="live-visits">
                    <div className="admin-content-shell mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Live Visits"
                            description="Real-time RFID check-in terminal, instant attendee spotlight, and today's live attendance feed."
                            badge={
                                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    <span className="relative flex size-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                                    </span>
                                    <span>Scanner Active</span>
                                </div>
                            }
                            actions={
                                <div className="inline-flex items-center gap-2 rounded-lg border border-[#040DBF]/15 bg-white px-3.5 py-1.5 text-xs font-bold text-[#030A8C] shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
                                    <Clock3 className="size-3.5 text-[#040DBF] dark:text-sky-400" />
                                    <span>{page.formattedManilaTime}</span>
                                </div>
                            }
                        />

                        {/* Inline Live Statistics Bar - Clean, seamless strip without cards */}
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-slate-200/80 bg-[#f8faff] px-4 py-3 text-xs font-semibold text-slate-700 sm:px-5 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-blue-100 text-[#040DBF] dark:bg-blue-950/50 dark:text-blue-400">
                                        <Users className="size-3.5" />
                                    </span>
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Visits today:</span>
                                    <span className="text-sm font-extrabold text-[#010440] dark:text-white">
                                        {metrics.visitsToday.toLocaleString()}
                                    </span>
                                </div>

                                <div className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-slate-700" />

                                <div className="flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                                        <GraduationCap className="size-3.5" />
                                    </span>
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Students:</span>
                                    <span className="text-sm font-extrabold text-[#010440] dark:text-white">
                                        {metrics.studentVisitsToday.toLocaleString()}
                                    </span>
                                </div>

                                <div className="hidden h-3.5 w-px bg-slate-300 sm:block dark:bg-slate-700" />

                                <div className="flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                                        <BriefcaseBusiness className="size-3.5" />
                                    </span>
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Employees:</span>
                                    <span className="text-sm font-extrabold text-[#010440] dark:text-white">
                                        {metrics.employeeVisitsToday.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 font-medium text-slate-500 dark:text-slate-400">
                                <CalendarClock className="size-3.5 text-amber-600 dark:text-amber-400" />
                                <span>Scan window:</span>
                                <span className="font-bold text-[#010440] dark:text-white">
                                    {formatTime(scanWindow.starts_at)} - {formatTime(scanWindow.ends_at ?? '17:00')}
                                </span>
                            </div>
                        </div>

                        {/* Dedicated Check-in Station: RFID Scanner Terminal & Recent Scan Spotlight */}
                        <section className="grid min-w-0 items-stretch gap-5 lg:grid-cols-2">
                            <LiveVisitScanner
                                value={page.scanData.rfid_uid}
                                options={page.scanTargetOptions}
                                inputRef={scanInputRef}
                                processing={page.scanning}
                                loadingOptions={page.loadingScanTargets}
                                error={page.scanError}
                                onChange={(value) => page.setScanData('rfid_uid', value)}
                                onSubmit={page.submitScan}
                            />
                            <LatestVisitCard visit={lastVisit ?? null} emptyMessage="Scanned students and employees will appear here in real-time." />
                        </section>

                        {/* Today's Scans Table Feed */}
                        <div className="min-w-0 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <h2 className="text-base font-bold text-[#010440] dark:text-white">Today's Visits Table</h2>
                                    <span className="rounded-full bg-[#040DBF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#040DBF] dark:bg-sky-500/20 dark:text-sky-300">
                                        {page.liveVisitMonitor.todayVisits.length} recorded today
                                    </span>
                                </div>
                            </div>
                            <LiveVisitsTable
                                visits={page.liveVisitMonitor.todayVisits}
                                studentCount={page.liveVisitMonitor.metrics.studentVisitsToday}
                                employeeCount={page.liveVisitMonitor.metrics.employeeVisitsToday}
                                onVisitSelect={page.setSelectedVisit}
                            />
                        </div>
                    </div>
                    <VisitDetailsModal
                        visit={page.selectedVisit}
                        open={Boolean(page.selectedVisit)}
                        onOpenChange={(open) => {
                            if (!open) {
                                page.setSelectedVisit(null);
                            }
                        }}
                    />
                </AdminLayout>
            </main>
        </>
    );
}
