import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type AdminSection = 'dashboard' | 'live-visits' | 'visit-history' | 'visitors' | 'reports' | 'settings';

export type ThemePreference = 'system' | 'light' | 'dark';

export type AdminNavItem = {
    key: AdminSection;
    label: string;
    href?: string;
    icon: LucideIcon;
    children?: Array<{
        label: string;
        href: string;
        icon: LucideIcon;
    }>;
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
    active: AdminSection;
    resolvedTheme: 'light' | 'dark';
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
