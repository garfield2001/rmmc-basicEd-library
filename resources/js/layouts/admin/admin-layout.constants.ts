import { Activity, BriefcaseBusiness, ChartColumn, ClipboardList, FileText, GraduationCap, LayoutDashboard, UsersRound } from 'lucide-react';
import type { AdminNavItem } from './admin-layout.types';

export const sidebarCollapsedStorageKey = 'rmmc-admin-sidebar-collapsed-v1';

export const adminThemePreferenceStorageKey = 'rmmc-admin-theme-preference-v2';

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
        key: 'visits-history',
        label: 'Visit Logs',
        icon: ClipboardList,
        children: [
            { label: 'Students', href: '/admin/visit-logs/students', icon: GraduationCap },
            { label: 'Employees', href: '/admin/visit-logs/employees', icon: BriefcaseBusiness },
        ],
    },
    {
        key: 'visit-progress',
        label: 'Visit Progress',
        icon: ChartColumn,
        children: [
            { label: 'Students', href: '/admin/visit-progress/students', icon: GraduationCap },
            { label: 'Employees', href: '/admin/visit-progress/employees', icon: BriefcaseBusiness },
        ],
    },
    {
        key: 'visitors',
        label: 'Registered Visitors',
        icon: UsersRound,
        children: [
            { label: 'Students', href: '/admin/registered-visitors/students', icon: GraduationCap },
            { label: 'Employees', href: '/admin/registered-visitors/employees', icon: BriefcaseBusiness },
        ],
    },
    {
        key: 'reports',
        label: 'Reports',
        icon: FileText,
        children: [
            { label: 'Students', href: '/admin/reports/students', icon: GraduationCap },
            { label: 'Employees', href: '/admin/reports/employees', icon: BriefcaseBusiness },
        ],
    },
];
