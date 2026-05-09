import { Activity, FileText, LayoutDashboard, UsersRound } from 'lucide-react';
import type { AdminNavItem } from './admin-layout.types';

export const sidebarAnimationStorageKey = 'rmmc-admin-sidebar-entered-v1';

export const sidebarCollapsedStorageKey = 'rmmc-admin-sidebar-collapsed-v1';

export const adminThemePreferenceStorageKey = 'rmmc-admin-theme-preference-v1';

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
        key: 'members',
        label: 'Library Members',
        href: '/admin/members',
        icon: UsersRound,
    },
    {
        key: 'reports',
        label: 'Reports',
        href: '/admin/reports',
        icon: FileText,
    },
];
