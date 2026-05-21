import { Activity, FileText, History, LayoutDashboard, UsersRound } from 'lucide-react';
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
        href: '/admin/visits-history',
        icon: History,
    },
    {
        key: 'visitors',
        label: 'Registered Visitors',
        href: '/admin/registered-visitors',
        icon: UsersRound,
    },
    {
        key: 'reports',
        label: 'Reports',
        href: '/admin/reports',
        icon: FileText,
    },
];
