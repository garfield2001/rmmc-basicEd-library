import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/icon-badge';
import type { AdminSettingsForm } from '@/layouts/admin/admin-layout.types';
import type { SharedData } from '@/types/shared';
import { useForm, usePage } from '@inertiajs/react';
import { Save, UserRound } from 'lucide-react';
import type { FormEventHandler } from 'react';

export function ProfileSettingsForm() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
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
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <IconBadge icon={UserRound} className="bg-[#040DBF] text-white" />
                <div>
                    <h2 className="text-lg font-semibold tracking-normal text-[#010440]">Account details</h2>
                    <p className="text-sm text-[#020659]/70">Update the account used to access the admin workspace.</p>
                </div>
            </div>

            <form onSubmit={submitSettings} className="mt-6 space-y-6">
                <section className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-[#010440]">
                        Name
                        <input
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                            className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                            autoComplete="name"
                        />
                        {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                    </label>
                    <label className="text-sm font-medium text-[#010440]">
                        Email
                        <input
                            type="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                            autoComplete="email"
                        />
                        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                    </label>
                </section>

                <PasswordFields data={data} errors={errors} setData={setData} />

                <div className="flex justify-end">
                    <Button type="submit" disabled={processing}>
                        <Save className="size-4" />
                        {processing ? 'Saving...' : 'Save settings'}
                    </Button>
                </div>
            </form>
        </section>
    );
}

function PasswordFields({ data, errors, setData }: Pick<ReturnType<typeof useForm<AdminSettingsForm>>, 'data' | 'errors' | 'setData'>) {
    return (
        <section className="rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4">
            <p className="text-sm font-medium text-[#010440]">Change password</p>
            <p className="mt-1 text-sm text-[#020659]/70">Leave these fields blank to keep your current password.</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {(['current_password', 'password', 'password_confirmation'] as const).map((field) => (
                    <label key={field} className="text-sm font-medium text-[#010440]">
                        {field === 'current_password' ? 'Current password' : field === 'password' ? 'New password' : 'Confirm password'}
                        <input
                            type="password"
                            value={data[field]}
                            onChange={(event) => setData(field, event.target.value)}
                            className="mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                            autoComplete={field === 'current_password' ? 'current-password' : 'new-password'}
                        />
                        {errors[field] && <p className="mt-2 text-sm text-red-600">{errors[field]}</p>}
                    </label>
                ))}
            </div>
        </section>
    );
}
