import { Activity, BriefcaseBusiness, ClipboardList, FileText, GraduationCap, LayoutDashboard, UsersRound } from 'lucide-react';
import type { AdminNavItem } from './admin-layout.types';

export const adminThemePreferenceStorageKey = 'rmmc-admin-theme-preference-v3';

export const RMMC_LOGO_PATH = '/images/rmmc_logo.svg';

export const navItems: AdminNavItem[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        key: 'live-visits',
        label: 'Live Visits',
        href: '/admin/live-visits',
        icon: Activity,
    },
    {
        key: 'visit-history',
        label: 'Visit History',
        href: '/admin/visit-history/students',
        icon: ClipboardList,
        children: [
            { label: 'Students', href: '/admin/visit-history/students', icon: GraduationCap },
            { label: 'Employees', href: '/admin/visit-history/employees', icon: BriefcaseBusiness },
        ],
    },
    {
        key: 'visitors',
        label: 'Registered Visitors',
        href: '/admin/registered-visitors/students',
        icon: UsersRound,
        children: [
            { label: 'Students', href: '/admin/registered-visitors/students', icon: GraduationCap },
            { label: 'Employees', href: '/admin/registered-visitors/employees', icon: BriefcaseBusiness },
        ],
    },
    {
        key: 'reports',
        label: 'Reports',
        href: '/admin/reports/students',
        icon: FileText,
        children: [
            { label: 'Students', href: '/admin/reports/students', icon: GraduationCap },
            { label: 'Employees', href: '/admin/reports/employees', icon: BriefcaseBusiness },
        ],
    },
];
