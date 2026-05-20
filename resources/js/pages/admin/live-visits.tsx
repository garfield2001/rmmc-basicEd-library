import { LiveVisitMetrics } from '@/components/admin/live-visits/live-visit-metrics';
import { LiveVisitScanner } from '@/components/admin/live-visits/live-visit-scanner';
import { LiveVisitsTable } from '@/components/admin/live-visits/live-visits-table';
import { useLiveVisitsPage } from '@/components/admin/live-visits/use-live-visits-page';
import { VisitDetailsModal } from '@/components/admin/visits/visit-details-modal';
import { LatestVisitCard } from '@/components/visits/latest-visit-card';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminVisitMonitor } from '@/types/dashboard';
import { Head } from '@inertiajs/react';
import { Clock3 } from 'lucide-react';
import { useRef } from 'react';

interface LiveVisitsProps {
    visitMonitor: AdminVisitMonitor;
}

export default function LiveVisits({ visitMonitor }: LiveVisitsProps) {
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const page = useLiveVisitsPage(visitMonitor);
    const lastVisit = page.liveVisitMonitor.todayVisits[0];

    return (
        <>
            <Head title="Live Visits" />
            <main className="min-h-screen">
                <AdminLayout active="live-visits">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Live Visits"
                            description="Today's scanned visitors, Radio-Frequency ID visit recording, and live student or employee attendance flow."
                            actions={
                                <div className="flex items-center gap-2 text-sm text-[#030A8C]">
                                    <Clock3 className="size-4" />
                                    <span>{page.formattedManilaTime}</span>
                                </div>
                            }
                        />

                        <LiveVisitMetrics
                            visitsToday={page.liveVisitMonitor.metrics.visitsToday}
                            studentVisitsToday={page.liveVisitMonitor.metrics.studentVisitsToday}
                            employeeVisitsToday={page.liveVisitMonitor.metrics.employeeVisitsToday}
                            scanStartsAt={page.liveVisitMonitor.scanWindow.starts_at}
                        />

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

                        <LatestVisitCard visit={lastVisit ?? null} emptyMessage="Scanned students and employees will appear in the live table below." />

                        <LiveVisitsTable
                            visits={page.liveVisitMonitor.todayVisits}
                            studentCount={page.liveVisitMonitor.metrics.studentVisitsToday}
                            employeeCount={page.liveVisitMonitor.metrics.employeeVisitsToday}
                            onVisitSelect={page.setSelectedVisit}
                        />
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
