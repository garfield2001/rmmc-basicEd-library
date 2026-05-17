import type { LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';

export type AdminSection = 'dashboard' | 'live-visits' | 'visits-history' | 'visitors' | 'reports' | 'settings';

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
    mobileOpen: boolean;
    onNavigate?: () => void;
}

export interface AdminNavbarProps {
    collapsed: boolean;
    mobileSidebarOpen: boolean;
    resolvedTheme: 'light' | 'dark';
    onCollapsedChange: (collapsed: boolean) => void;
    onMobileSidebarToggle: () => void;
    onThemeToggle: () => void;
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
