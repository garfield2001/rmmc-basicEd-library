import type { AdminDashboard, PublicDashboard } from '@/types';
import { BarChart3, BriefcaseBusiness, Clock3, GraduationCap, ScanLine, ShieldCheck, UsersRound } from 'lucide-react';

export function getTodayMetrics(dashboard: PublicDashboard) {
    return [
        {
            label: 'Visits today',
            value: dashboard.metrics.visitsToday,
            detail: 'RFID scans since midnight',
            icon: ScanLine,
        },
        {
            label: 'Students',
            value: dashboard.metrics.studentVisitsToday,
            detail: 'Student entries logged',
            icon: GraduationCap,
        },
        {
            label: 'Employees',
            value: dashboard.metrics.employeeVisitsToday,
            detail: 'Employee entries logged',
            icon: BriefcaseBusiness,
        },
    ];
}

export function getAdminMetrics(adminDashboard: AdminDashboard | null) {
    if (!adminDashboard) {
        return null;
    }

    return [
        {
            label: 'Active members',
            value: adminDashboard.metrics.activeMembers,
            detail: 'Can record RFID visits',
            icon: UsersRound,
        },
        {
            label: 'Inactive members',
            value: adminDashboard.metrics.inactiveMembers,
            detail: 'Retained for records',
            icon: ShieldCheck,
        },
        {
            label: 'School year visits',
            value: adminDashboard.metrics.visitsThisSchoolYear,
            detail: 'Total logs this school year',
            icon: BarChart3,
        },
    ];
}

export function getAdministrationStats(dashboard: PublicDashboard) {
    return [
        {
            label: 'Visits today',
            value: dashboard.metrics.visitsToday.toLocaleString(),
            detail: 'Successful RFID visits recorded since midnight.',
            icon: ScanLine,
        },
        {
            label: 'Student visits',
            value: dashboard.metrics.studentVisitsToday.toLocaleString(),
            detail: "Student entries included in today's activity.",
            icon: GraduationCap,
        },
        {
            label: 'Employee visits',
            value: dashboard.metrics.employeeVisitsToday.toLocaleString(),
            detail: "Employee entries included in today's activity.",
            icon: BriefcaseBusiness,
        },
    ];
}

export function getAdministrationStatus(dashboard: PublicDashboard) {
    return [
        {
            label: 'Scan window',
            value: '24 hours',
            detail: 'Temporary scanner access window.',
            icon: Clock3,
        },
        {
            label: 'School year',
            value: dashboard.schoolYear?.name ?? 'Not configured',
            detail: 'Active visit records are attached here.',
            icon: ShieldCheck,
        },
    ];
}
