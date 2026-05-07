import { ProfileSettingsForm } from '@/components/admin/settings/profile-settings-form';
import { SchoolYearSettings } from '@/components/admin/settings/school-year-settings';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import type { SchoolYearRow } from '@/types/school-year';
import { Head } from '@inertiajs/react';

interface SettingsProps {
    schoolYears: SchoolYearRow[];
    schoolYearStats: {
        studentMembers: number;
        activeEnrollments: number;
    };
}

export default function Settings({ schoolYears, schoolYearStats }: SettingsProps) {
    return (
        <>
            <Head title="Settings" />
            <main className="min-h-screen">
                <AdminLayout active="settings">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader title="Settings" description="Manage admin access, appearance, and school-year enrollment setup." />
                        <SchoolYearSettings schoolYears={schoolYears} stats={schoolYearStats} />
                        <ProfileSettingsForm />
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
