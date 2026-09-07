import { navItems } from '@/layouts/admin/admin-layout.constants';
import { AdminLogoMark } from '@/layouts/admin/admin-logo-mark';
import { type SharedData } from '@/types/shared';
import { Link, router, usePage } from '@inertiajs/react';
import { CalendarClock, ChevronDown, LogOut, Menu, Moon, Settings, Sun, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AdminNavbarProps } from './admin-layout.types';
import { SchoolYearDetailsDialog } from './school-year-navbar/details-dialog';

export function AdminNavbar({ active, resolvedTheme, onThemeToggle }: AdminNavbarProps) {
    const { auth, schoolYear, schoolYears } = usePage<SharedData>().props;
    const currentUrl = usePage().url;
    const user = auth.user;
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [schoolYearDetailsOpen, setSchoolYearDetailsOpen] = useState(!schoolYear);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const ThemeIcon = resolvedTheme === 'dark' ? Sun : Moon;

    useEffect(() => {
        if (!schoolYear) {
            setSchoolYearDetailsOpen(true);
        }
    }, [schoolYear]);

    useEffect(() => {
        const handleOpen = () => setSchoolYearDetailsOpen(true);
        window.addEventListener('open-school-year-details', handleOpen);
        return () => window.removeEventListener('open-school-year-details', handleOpen);
    }, []);

    useEffect(() => {
        if (!userMenuOpen) return;
        const closeMenu = (event: PointerEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setUserMenuOpen(false);

        document.addEventListener('pointerdown', closeMenu);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeMenu);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [userMenuOpen]);

    const handleLogout = () => {
        setUserMenuOpen(false);
        router.post('/logout');
    };

    return (
        <header className="admin-surface sticky top-0 z-40 border-b border-[#040DBF]/10 bg-white/90 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Brand / Logo */}
                <div className="flex items-center gap-3">
                    <Link href="/admin" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
                        <AdminLogoMark className="size-9" />
                        <div className="hidden min-w-0 sm:block">
                            <p className="truncate text-sm leading-tight font-bold text-[#010440] dark:text-white">RMMC Library</p>
                            <p className="truncate text-[11px] font-medium text-[#030A8C] dark:text-sky-400">Attendance & Management</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="ml-6 hidden items-center gap-1 md:flex">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = active === item.key;
                            const hasChildren = Boolean(item.children && item.children.length > 0);

                            if (hasChildren && item.children) {
                                return (
                                    <div key={item.key} className="group relative">
                                        <button
                                            type="button"
                                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/25 dark:bg-blue-600'
                                                    : 'text-[#020659] hover:bg-[#040DBF]/5 hover:text-[#040DBF] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                                            }`}
                                        >
                                            <Icon className="size-4 shrink-0" />
                                            <span>{item.label}</span>
                                            <ChevronDown className="size-3.5 opacity-70 transition-transform duration-200 group-hover:rotate-180" />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <div className="invisible absolute top-full left-0 z-50 w-44 translate-y-1 pt-1.5 opacity-0 transition-all duration-150 ease-out group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                                            <div className="rounded-xl border border-[#040DBF]/15 bg-white p-1.5 shadow-xl backdrop-blur-lg dark:border-slate-700 dark:bg-slate-800">
                                                {item.children.map((child) => {
                                                    const ChildIcon = child.icon;
                                                    const isChildActive = currentUrl.startsWith(child.href);
                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                                                isChildActive
                                                                    ? 'bg-[#040DBF]/10 font-bold text-[#040DBF] dark:bg-blue-600/20 dark:text-sky-300'
                                                                    : 'text-[#020659] hover:bg-[#f6f8ff] hover:text-[#040DBF] dark:text-slate-200 dark:hover:bg-slate-700'
                                                            }`}
                                                        >
                                                            {ChildIcon && <ChildIcon className="size-3.5 shrink-0" />}
                                                            <span>{child.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href ?? '#'}
                                    className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/25 dark:bg-blue-600'
                                            : 'text-[#020659] hover:bg-[#040DBF]/5 hover:text-[#040DBF] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right Utility Bar */}
                <div className="flex items-center gap-2.5">
                    {/* Theme Toggle Button */}
                    <button
                        type="button"
                        onClick={onThemeToggle}
                        className="flex size-9 items-center justify-center rounded-full border border-[#040DBF]/10 bg-white text-[#020659] shadow-sm transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#030A8C] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                        <ThemeIcon className="size-4" />
                    </button>

                    {/* Settings Button */}
                    <Link
                        href="/admin/settings"
                        className={`hidden size-9 items-center justify-center rounded-full border border-[#040DBF]/10 bg-white text-[#020659] shadow-sm transition hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#030A8C] sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${
                            active === 'settings' ? 'text-[#040DBF] ring-2 ring-[#040DBF]' : ''
                        }`}
                        title="Settings"
                    >
                        <Settings className="size-4" />
                    </Link>

                    {/* User Profile Dropdown Menu */}
                    <div ref={menuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setUserMenuOpen((prev) => !prev)}
                            className="flex items-center gap-2 rounded-full border border-[#040DBF]/15 bg-[#f6f8ff] py-1 pr-2.5 pl-1 text-left text-xs font-semibold text-[#010440] transition hover:border-[#040DBF]/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            <span className="flex size-7 items-center justify-center rounded-full bg-[#040DBF] text-xs font-bold text-white shadow-sm">
                                {(user?.name ?? 'A').trim().charAt(0).toUpperCase()}
                            </span>
                            <span className="hidden max-w-[100px] truncate sm:inline-block">{user?.name}</span>
                            <ChevronDown className={`size-3.5 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#040DBF]/15 bg-white p-1.5 text-xs shadow-xl backdrop-blur-lg dark:border-slate-700 dark:bg-slate-800">
                                <div className="border-b border-[#040DBF]/10 px-3 py-2.5 dark:border-slate-700">
                                    <p className="truncate font-semibold text-[#010440] dark:text-white">{user?.name}</p>
                                    <p className="text-[11px] text-[#030A8C] capitalize dark:text-slate-400">{user?.role ?? 'Administrator'}</p>
                                </div>

                                <div className="py-1">
                                    {/* School Year item inside Admin Dropdown */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUserMenuOpen(false);
                                            setSchoolYearDetailsOpen(true);
                                        }}
                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 font-medium text-[#020659] transition hover:bg-[#f6f8ff] hover:text-[#040DBF] dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <CalendarClock className="size-4 shrink-0 text-[#040DBF] dark:text-sky-400" />
                                            <div className="min-w-0 text-left">
                                                <p className="truncate leading-tight font-semibold text-[#010440] dark:text-white">
                                                    School year
                                                </p>
                                                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                                                    {schoolYear ? `Active: ${schoolYear.name}` : 'No active year'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="shrink-0 rounded bg-[#040DBF]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#040DBF] dark:bg-sky-500/20 dark:text-sky-300">
                                            Manage
                                        </span>
                                    </button>

                                    <Link
                                        href="/admin/settings"
                                        onClick={() => setUserMenuOpen(false)}
                                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-[#020659] transition hover:bg-[#f6f8ff] hover:text-[#040DBF] dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <Settings className="size-4 shrink-0" />
                                        <span>Settings</span>
                                    </Link>
                                </div>

                                <div className="border-t border-[#040DBF]/10 pt-1 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                    >
                                        <LogOut className="size-4 shrink-0" />
                                        <span>Log out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className="flex size-9 items-center justify-center rounded-lg border border-[#040DBF]/15 bg-white text-[#020659] md:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        aria-label="Toggle Navigation Menu"
                    >
                        {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <nav className="border-t border-[#040DBF]/10 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = active === item.key;
                            const hasChildren = Boolean(item.children && item.children.length > 0);

                            if (hasChildren && item.children) {
                                return (
                                    <div key={item.key} className="space-y-1">
                                        <div
                                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                                                isActive
                                                    ? 'bg-[#040DBF]/10 text-[#040DBF] dark:bg-blue-600/20 dark:text-sky-300'
                                                    : 'text-[#020659] dark:text-slate-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="size-4 shrink-0" />
                                                <span>{item.label}</span>
                                            </div>
                                        </div>
                                        <div className="ml-5 flex flex-col gap-1 border-l-2 border-[#040DBF]/15 pl-2 dark:border-slate-700">
                                            {item.children.map((child) => {
                                                const ChildIcon = child.icon;
                                                const isChildActive = currentUrl.startsWith(child.href);
                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                                                            isChildActive
                                                                ? 'bg-[#040DBF] font-bold text-white dark:bg-blue-600'
                                                                : 'text-slate-600 hover:bg-[#f6f8ff] hover:text-[#040DBF] dark:text-slate-300 dark:hover:bg-slate-800'
                                                        }`}
                                                    >
                                                        {ChildIcon && <ChildIcon className="size-3.5 shrink-0" />}
                                                        <span>{child.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <Link
                                    key={item.key}
                                    href={item.href ?? '#'}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold ${
                                        isActive
                                            ? 'bg-[#040DBF] text-white'
                                            : 'text-[#020659] hover:bg-[#f6f8ff] dark:text-slate-200 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                setSchoolYearDetailsOpen(true);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-[#020659] hover:bg-[#f6f8ff] dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <div className="flex items-center gap-2.5">
                                <CalendarClock className="size-4 shrink-0 text-[#040DBF] dark:text-sky-400" />
                                <span>School year</span>
                            </div>
                            <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                                {schoolYear ? schoolYear.name : 'None'}
                            </span>
                        </button>
                        <Link
                            href="/admin/settings"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#020659] hover:bg-[#f6f8ff] dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <Settings className="size-4 shrink-0" />
                            <span>Settings</span>
                        </Link>
                    </div>
                </nav>
            )}

            <SchoolYearDetailsDialog
                open={schoolYearDetailsOpen}
                schoolYears={schoolYears}
                onOpenChange={setSchoolYearDetailsOpen}
                requireActiveSchoolYear={!schoolYear}
            />
        </header>
    );
}
