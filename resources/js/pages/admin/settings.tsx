import { ProfileSettingsForm } from '@/components/admin/settings/profile-settings-form';
import { ScanSettingsForm, type ScanSettings } from '@/components/admin/settings/scan-settings-form';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { Head } from '@inertiajs/react';

interface SettingsProps {
    scanSettings: ScanSettings;
}

export default function Settings({ scanSettings }: SettingsProps) {
    return (
        <>
            <Head title="Settings" />
            <main className="min-h-screen">
                <AdminLayout active="settings">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader title="Settings" description="Manage admin access and library scan rules." />
                        <ScanSettingsForm settings={scanSettings} />
                        <ProfileSettingsForm />
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
