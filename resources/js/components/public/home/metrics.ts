import { BriefcaseBusiness, Clock3, GraduationCap, ScanLine, ShieldCheck } from 'lucide-react';

import type { HomePageData } from '@/types';

export function getAdministrationStats(home: HomePageData) {
    return [
        {
            label: 'Visits today',
            value: home.metrics.visitsToday.toLocaleString(),
            detail: 'Successful RFID visits recorded since midnight.',
            icon: ScanLine,
        },
        {
            label: 'Student visits',
            value: home.metrics.studentVisitsToday.toLocaleString(),
            detail: "Student entries included in today's activity.",
            icon: GraduationCap,
        },
        {
            label: 'Employee visits',
            value: home.metrics.employeeVisitsToday.toLocaleString(),
            detail: "Employee entries included in today's activity.",
            icon: BriefcaseBusiness,
        },
    ];
}

export function getAdministrationStatus(home: HomePageData) {
    return [
        {
            label: 'Scan window',
            value: '24 hours',
            detail: 'Temporary scanner access window.',
            icon: Clock3,
        },
        {
            label: 'School year',
            value: home.schoolYear?.name ?? 'Not configured',
            detail: 'Active visit records are attached here.',
            icon: ShieldCheck,
        },
    ];
}
