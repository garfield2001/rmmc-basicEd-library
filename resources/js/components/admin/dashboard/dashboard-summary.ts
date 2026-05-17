import { formatDisplayDate } from '@/components/ui/date-input';
import type { AdminDashboard } from '@/types/dashboard';
import { Activity, BriefcaseBusiness, GraduationCap, UsersRound } from 'lucide-react';

export function getSchoolYearDateRange(dashboard: AdminDashboard) {
    if (dashboard.schoolYear?.starts_at && dashboard.schoolYear?.ends_at) {
        return `${formatDisplayDate(dashboard.schoolYear.starts_at)} to ${formatDisplayDate(dashboard.schoolYear.ends_at)}`;
    }

    return 'Set up a school year to start tracking';
}

export function getOverviewMetrics(dashboard: AdminDashboard, schoolYearLabel: string) {
    return [
        {
            label: 'Registered visitors',
            value: dashboard.metrics.registeredVisitors,
            detail: 'School Year: ' + schoolYearLabel,
            icon: UsersRound,
        },
        {
            label: 'Visits today',
            value: dashboard.metrics.visitsToday,
            detail: 'Recorded since midnight',
            icon: Activity,
        },
        {
            label: 'Student profiles',
            value: dashboard.metrics.studentSchoolYearRecords,
            detail: `${dashboard.schoolYear?.student_required_visits ?? 0} required visits`,
            icon: GraduationCap,
        },
        {
            label: 'Employee profiles',
            value: dashboard.metrics.employeeVisitors,
            detail: `${dashboard.schoolYear?.employee_required_visits ?? 0} required visits`,
            icon: BriefcaseBusiness,
        },
    ];
}
