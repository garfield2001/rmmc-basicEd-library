import type { LayoutDashboard } from 'lucide-react';
import type { ReactNode } from 'react';

export type AdminSection = 'monitor' | 'members' | 'reports';

export type ThemePreference = 'system' | 'light' | 'dark';

export type AdminNavItem = {
    key: AdminSection;
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
};

export interface AdminShellProps {
    active: AdminSection;
    children: ReactNode;
}

export interface AdminSidebarProps {
    active: AdminSection;
    collapsed: boolean;
    themePreference: ThemePreference;
    onThemePreferenceChange: (preference: ThemePreference) => void;
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

export interface AdminSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    themePreference: ThemePreference;
    onThemePreferenceChange: (preference: ThemePreference) => void;
}

export interface AdminPageHeaderProps {
    title: string;
    description: string;
    badge?: ReactNode;
    actions?: ReactNode;
}
