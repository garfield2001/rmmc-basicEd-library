import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { themeOptions } from '@/layouts/admin/admin-layout.constants';
import type { AdminSettingsForm } from '@/layouts/admin/admin-layout.types';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { useAdminThemePreference } from '@/layouts/admin/use-admin-theme-preference';
import { type SharedData } from '@/types/shared';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Save, UserRound } from 'lucide-react';
import { type FormEventHandler } from 'react';

export default function Settings() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const { themePreference, setThemePreference } = useAdminThemePreference();
    const { data, setData, patch, processing, errors, reset } = useForm<AdminSettingsForm>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitSettings: FormEventHandler = (event) => {
        event.preventDefault();

        patch('/admin/profile', {
            preserveScroll: true,
            onSuccess: () => reset('current_password', 'password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Settings" />
            <main className="min-h-screen">
                <AdminLayout active="settings">
                    <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader title="Settings" description="Manage your admin profile, password, and display preference." />

                        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-lg bg-[#040DBF] text-white">
                                    <UserRound className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Account details</h2>
                                    <p className="text-sm text-[#020659]/70">Update the account used to access the admin workspace.</p>
                                </div>
                            </div>

                            <form onSubmit={submitSettings} className="mt-6 space-y-6">
                                <section className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="admin-settings-name" className="text-sm font-medium text-[#010440]">
                                            Name
                                        </label>
                                        <input
                                            id="admin-settings-name"
                                            value={data.name}
                                            onChange={(event) => setData('name', event.target.value)}
                                            className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                                            autoComplete="name"
                                        />
                                        {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="admin-settings-email" className="text-sm font-medium text-[#010440]">
                                            Email
                                        </label>
                                        <input
                                            id="admin-settings-email"
                                            type="email"
                                            value={data.email}
                                            onChange={(event) => setData('email', event.target.value)}
                                            className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                                            autoComplete="email"
                                        />
                                        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                                    </div>
                                </section>

                                <section>
                                    <p className="text-sm font-medium text-[#010440]">Appearance</p>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                        {themeOptions.map((option) => {
                                            const Icon = option.icon;
                                            const isSelected = themePreference === option.value;

                                            return (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => setThemePreference(option.value)}
                                                    className={`rounded-lg border p-4 text-left transition ${
                                                        isSelected
                                                            ? 'border-[#040DBF] bg-[#040DBF] text-white shadow-sm shadow-[#040DBF]/25'
                                                            : 'border-[#040DBF]/10 bg-white text-[#020659] hover:border-[#040DBF]/30 hover:bg-[#f6f8ff]'
                                                    }`}
                                                >
                                                    <Icon className="size-4" />
                                                    <span className="mt-3 block text-sm font-semibold">{option.label}</span>
                                                    <span className={`mt-1 block text-xs ${isSelected ? 'text-blue-100' : 'text-[#030A8C]'}`}>
                                                        {option.description}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>

                                <section className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
                                    <p className="text-sm font-medium text-[#010440]">Change password</p>
                                    <p className="mt-1 text-sm text-[#020659]/70">Leave these fields blank to keep your current password.</p>

                                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                                        <div>
                                            <label htmlFor="admin-settings-current-password" className="text-sm font-medium text-[#010440]">
                                                Current password
                                            </label>
                                            <input
                                                id="admin-settings-current-password"
                                                type="password"
                                                value={data.current_password}
                                                onChange={(event) => setData('current_password', event.target.value)}
                                                className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                                                autoComplete="current-password"
                                            />
                                            {errors.current_password && <p className="mt-2 text-sm text-red-600">{errors.current_password}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="admin-settings-password" className="text-sm font-medium text-[#010440]">
                                                New password
                                            </label>
                                            <input
                                                id="admin-settings-password"
                                                type="password"
                                                value={data.password}
                                                onChange={(event) => setData('password', event.target.value)}
                                                className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                                                autoComplete="new-password"
                                            />
                                            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="admin-settings-password-confirmation" className="text-sm font-medium text-[#010440]">
                                                Confirm password
                                            </label>
                                            <input
                                                id="admin-settings-password-confirmation"
                                                type="password"
                                                value={data.password_confirmation}
                                                onChange={(event) => setData('password_confirmation', event.target.value)}
                                                className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing} className="bg-[#040DBF] text-white hover:bg-[#030A8C]">
                                        <Save className="size-4" />
                                        {processing ? 'Saving...' : 'Save settings'}
                                    </Button>
                                </div>
                            </form>
                        </section>
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
