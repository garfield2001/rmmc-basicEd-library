import type { PublicDashboard } from '@/types';
import { BriefcaseBusiness, Clock3, GraduationCap, ScanLine, ShieldCheck } from 'lucide-react';

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
