import { DashboardSkeleton } from '@/layouts/admin/loading-skeleton/dashboard-skeleton';
import { HeaderSkeleton } from '@/layouts/admin/loading-skeleton/header-skeleton';
import { LiveVisitsSkeleton } from '@/layouts/admin/loading-skeleton/live-visits-skeleton';
import { ReportsSkeleton } from '@/layouts/admin/loading-skeleton/reports-skeleton';
import { SettingsSkeleton } from '@/layouts/admin/loading-skeleton/settings-skeleton';
import { VisitorFormSkeleton, VisitorsSkeleton } from '@/layouts/admin/loading-skeleton/visitors-skeleton';

export type AdminLoadingTarget = 'dashboard' | 'live-visits' | 'visit-history' | 'visitors-index' | 'visitors-form' | 'reports' | 'settings';

export function AdminContentLoadingSkeleton({ target }: { target: AdminLoadingTarget }) {
    return (
        <div
            className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8"
            role="status"
            aria-live="polite"
            aria-label="Loading page"
        >
            {target !== 'visitors-form' && (
                <HeaderSkeleton hasAction={target === 'dashboard' || target === 'live-visits' || target === 'visitors-index'} />
            )}
            {target === 'dashboard' && <DashboardSkeleton />}
            {target === 'live-visits' && <LiveVisitsSkeleton />}
            {target === 'visit-history' && <VisitorsSkeleton />}
            {target === 'visitors-index' && <VisitorsSkeleton />}
            {target === 'visitors-form' && <VisitorFormSkeleton />}
            {target === 'reports' && <ReportsSkeleton />}
            {target === 'settings' && <SettingsSkeleton />}
        </div>
    );
}
