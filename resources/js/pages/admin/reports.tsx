import { ReportEmptyState } from '@/components/admin/reports/report-empty-state';
import { ReportFilterPanel } from '@/components/admin/reports/report-filter-panel';
import { ReportResults } from '@/components/admin/reports/report-results';
import { ReportResultsSkeleton } from '@/components/admin/reports/report-results-skeleton';
import { type VisitorType } from '@/components/admin/reports/report-helpers';
import { useReportPage } from '@/components/admin/reports/use-report-page';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type VisitReport, type VisitReportOptions } from '@/types/reports';
import { Head } from '@inertiajs/react';

interface ReportsProps {
    report: VisitReport | null;
    reportOptions: VisitReportOptions;
}

export default function Reports({ report, reportOptions }: ReportsProps) {
    const page = useReportPage(report, reportOptions);

    return (
        <>
            <Head title="Reports" />
            <main className="min-h-screen">
                <AdminLayout active="reports">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader title="Reports" description="School-year progress by selected visitors, date range, and filters." />

                        <ReportFilterPanel {...page.filterPanel} />

                        {page.showResultsSkeleton ? (
                            <ReportResultsSkeleton />
                        ) : page.hasReportResults && report && page.visitorType ? (
                            <ReportResults report={report} visitorType={page.visitorType as VisitorType} {...page.results} />
                        ) : (
                            <ReportEmptyState reportCanFetch={page.reportCanFetch} />
                        )}
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
