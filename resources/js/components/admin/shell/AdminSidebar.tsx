import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type SharedData } from '@/types';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Settings, UserRound } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import { navItems, sidebarAnimationStorageKey, themeOptions } from './constants';
import { RmmcLogoMark } from './RmmcLogoMark';
import type { AdminSettingsForm, AdminSidebarProps } from './types';

export function AdminSidebar({ active, collapsed, themePreference, onThemePreferenceChange }: AdminSidebarProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const [settingsOpen, setSettingsOpen] = useState(false);
    const {
        data: settingsData,
        setData: setSettingsData,
        patch: patchSettings,
        processing: savingSettings,
        errors: settingsErrors,
        reset: resetSettings,
        clearErrors: clearSettingsErrors,
    } = useForm<AdminSettingsForm>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const sidebarMotion = 'duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';
    const sidebarColumns = collapsed ? 'grid-cols-[40px_0px]' : 'grid-cols-[40px_minmax(0,1fr)]';
    const sidebarRowWidth = collapsed ? 'w-10' : 'w-full';
    const sidebarRow = `grid h-10 ${sidebarRowWidth} items-center overflow-hidden transition-[width,grid-template-columns,background-color,color,border-color,box-shadow] ${sidebarMotion} ${sidebarColumns}`;
    const sidebarLabel = `min-w-0 overflow-hidden transition-[opacity,transform] ${sidebarMotion} ${
        collapsed ? '-translate-x-2 opacity-0' : 'translate-x-0 opacity-100'
    }`;
    const [shouldAnimate] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        if (window.sessionStorage.getItem(sidebarAnimationStorageKey) === 'true') {
            return false;
        }

        window.sessionStorage.setItem(sidebarAnimationStorageKey, 'true');

        return true;
    });

    useEffect(() => {
        if (!settingsOpen || !user) {
            return;
        }

        setSettingsData({
            name: user.name,
            email: user.email,
            current_password: '',
            password: '',
            password_confirmation: '',
        });
        clearSettingsErrors();
    }, [clearSettingsErrors, setSettingsData, settingsOpen, user]);

    const submitSettings = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        patchSettings('/admin/profile', {
            preserveScroll: true,
            onSuccess: () => resetSettings('current_password', 'password', 'password_confirmation'),
        });
    };

    return (
        <>
            <aside
                className={`${shouldAnimate ? 'admin-sidebar-enter' : ''}border-zinc-200 bg-white/95 p-4 shadow-sm transition-[width] ${sidebarMotion} lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-full lg:flex-col lg:self-start lg:overflow-y-auto lg:border-r`}
            >
                <div className="border-b border-zinc-100 pb-4">
                    <div className={sidebarRow}>
                        <div className="flex min-w-0 items-center justify-center">
                            <RmmcLogoMark className="size-10" />
                        </div>
                        <div className={`${sidebarLabel} pl-3`}>
                            <p className="truncate text-sm font-semibold">Admin workspace</p>
                            <p className="truncate text-xs text-zinc-500">{user?.email}</p>
                        </div>
                    </div>
                </div>

                <nav className="mt-4 flex-1 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = active === item.key;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={collapsed ? item.label : undefined}
                                className={`${sidebarRow} rounded-lg border text-sm font-medium ${
                                    isActive
                                        ? 'border-zinc-800 bg-zinc-950 text-white shadow-sm ring-1 ring-zinc-950/10'
                                        : 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className="flex min-w-0 items-center justify-center">
                                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                                </span>
                                <span className={`${sidebarLabel} pl-3 whitespace-nowrap`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-4 border-t border-zinc-100 pt-4">
                    <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        title={collapsed ? 'Admin settings' : undefined}
                        className={`${sidebarRow} rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950`}
                    >
                        <span className="flex min-w-0 items-center justify-center">
                            <Settings className="size-4 shrink-0" aria-hidden="true" />
                        </span>
                        <span className={`${sidebarLabel} pl-3 whitespace-nowrap`}>Settings</span>
                    </button>

                    <div className={`${collapsed ? 'hidden' : 'mt-3'} text-xs leading-5 text-zinc-500`}>
                        <p className="truncate font-medium text-zinc-700">{user?.name}</p>
                        <p className="truncate">{user?.role}</p>
                    </div>
                </div>
            </aside>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                            <UserRound className="size-5" />
                        </div>
                        <DialogTitle>Admin settings</DialogTitle>
                        <DialogDescription>Update your account details, password, and display preference.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitSettings} className="space-y-6">
                        <section className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="admin-settings-name" className="text-sm font-medium">
                                    Name
                                </label>
                                <input
                                    id="admin-settings-name"
                                    value={settingsData.name}
                                    onChange={(event) => setSettingsData('name', event.target.value)}
                                    className="mt-2 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                    autoComplete="name"
                                />
                                {settingsErrors.name && <p className="mt-2 text-sm text-red-600">{settingsErrors.name}</p>}
                            </div>

                            <div>
                                <label htmlFor="admin-settings-email" className="text-sm font-medium">
                                    Email
                                </label>
                                <input
                                    id="admin-settings-email"
                                    type="email"
                                    value={settingsData.email}
                                    onChange={(event) => setSettingsData('email', event.target.value)}
                                    className="mt-2 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                    autoComplete="email"
                                />
                                {settingsErrors.email && <p className="mt-2 text-sm text-red-600">{settingsErrors.email}</p>}
                            </div>
                        </section>

                        <section>
                            <p className="text-sm font-medium">Appearance</p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                {themeOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = themePreference === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => onThemePreferenceChange(option.value)}
                                            className={`rounded-lg border p-3 text-left transition ${
                                                isSelected
                                                    ? 'border-zinc-950 bg-zinc-950 text-white shadow-sm'
                                                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                                            }`}
                                        >
                                            <Icon className="size-4" />
                                            <span className="mt-2 block text-sm font-semibold">{option.label}</span>
                                            <span className={`mt-1 block text-xs ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                                {option.description}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                            <p className="text-sm font-medium">Change password</p>
                            <p className="mt-1 text-sm text-zinc-500">Leave these fields blank to keep your current password.</p>

                            <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label htmlFor="admin-settings-current-password" className="text-sm font-medium">
                                        Current password
                                    </label>
                                    <input
                                        id="admin-settings-current-password"
                                        type="password"
                                        value={settingsData.current_password}
                                        onChange={(event) => setSettingsData('current_password', event.target.value)}
                                        className="mt-2 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                        autoComplete="current-password"
                                    />
                                    {settingsErrors.current_password && (
                                        <p className="mt-2 text-sm text-red-600">{settingsErrors.current_password}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="admin-settings-password" className="text-sm font-medium">
                                        New password
                                    </label>
                                    <input
                                        id="admin-settings-password"
                                        type="password"
                                        value={settingsData.password}
                                        onChange={(event) => setSettingsData('password', event.target.value)}
                                        className="mt-2 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                        autoComplete="new-password"
                                    />
                                    {settingsErrors.password && <p className="mt-2 text-sm text-red-600">{settingsErrors.password}</p>}
                                </div>

                                <div>
                                    <label htmlFor="admin-settings-password-confirmation" className="text-sm font-medium">
                                        Confirm password
                                    </label>
                                    <input
                                        id="admin-settings-password-confirmation"
                                        type="password"
                                        value={settingsData.password_confirmation}
                                        onChange={(event) => setSettingsData('password_confirmation', event.target.value)}
                                        className="mt-2 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm transition outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100"
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </section>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setSettingsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={savingSettings}>
                                {savingSettings ? 'Saving...' : 'Save settings'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
