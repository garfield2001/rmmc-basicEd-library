import { ReportEmptyState } from '@/components/admin/reports/report-empty-state';
import { ReportFilterPanel } from '@/components/admin/reports/report-filter-panel';
import { type VisitorType, type VisitorTypeFilter } from '@/components/admin/reports/report-helpers';
import { ReportResults } from '@/components/admin/reports/report-results';
import { ReportResultsSkeleton } from '@/components/admin/reports/report-results-skeleton';
import { useReportPage } from '@/components/admin/reports/use-report-page';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type VisitReport, type VisitReportOptions } from '@/types/reports';
import { Head } from '@inertiajs/react';

interface ReportsProps {
    report: VisitReport | null;
    initialVisitorType: VisitorTypeFilter;
    pagePath: string;
    reportOptions: VisitReportOptions;
}

export default function Reports({ report, initialVisitorType, pagePath, reportOptions }: ReportsProps) {
    const page = useReportPage(report, reportOptions, initialVisitorType, pagePath);
    const audienceLabel = page.visitorType === 'employee' ? 'Employee' : 'Student';

    return (
        <>
            <Head title={`${audienceLabel} Reports`} />
            <main className="min-h-screen">
                <AdminLayout active="reports">
                    <div className="admin-content-shell mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title={`${audienceLabel} Reports`}
                            description={
                                page.visitorType === 'employee'
                                    ? 'Review employee visit progress by date range, department, and required school-year targets.'
                                    : 'Review student visit progress by date range, year level, section, and required school-year targets.'
                            }
                        />

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
