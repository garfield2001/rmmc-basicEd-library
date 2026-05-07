import type { LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';

export type AdminSection = 'dashboard' | 'live-visits' | 'members' | 'student-enrollments' | 'reports' | 'settings';

export type ThemePreference = 'system' | 'light' | 'dark';

export type AdminNavItem = {
    key: AdminSection;
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
};

export interface AdminLayoutProps {
    active: AdminSection;
    children: ReactNode;
}

export interface AdminSidebarProps {
    active: AdminSection;
    collapsed: boolean;
}

export interface AdminNavbarProps {
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
}

export interface AdminSettingsForm {
    [key: string]: string;
    name: string;
    email: string;
    current_password: string;
    password: string;
    password_confirmation: string;
}

export interface AdminPageHeaderProps {
    title: string;
    description: string;
    badge?: ReactNode;
    actions?: ReactNode;
}
