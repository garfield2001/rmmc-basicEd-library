import { useVisitorPageForm } from '@/components/admin/registered-visitors/page-form/use-visitor-page-form';
import { VisitorDetailsCard } from '@/components/admin/registered-visitors/page-form/visitor-details-card';
import { VisitorFormActions } from '@/components/admin/registered-visitors/page-form/visitor-form-actions';
import { VisitorIdentityCard } from '@/components/admin/registered-visitors/page-form/visitor-identity-card';
import { VisitorPageHeader } from '@/components/admin/registered-visitors/page-form/visitor-page-header';
import { VisitorProfileCard } from '@/components/admin/registered-visitors/page-form/visitor-profile-card';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { type LibraryMemberRow } from '@/types/registered-visitors';
import { Head } from '@inertiajs/react';

interface VisitorFormProps {
    visitor: LibraryMemberRow | null;
}

export default function VisitorForm({ visitor }: VisitorFormProps) {
    const form = useVisitorPageForm(visitor);

    return (
        <>
            <Head title={form.isEditing ? 'Edit Visitor' : 'Add Visitor'} />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminLayout active="visitors">
                    <VisitorPageHeader isEditing={form.isEditing} />

                    <form onSubmit={form.submit} className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <VisitorIdentityCard
                            data={form.data}
                            errors={form.errors}
                            isEditing={form.isEditing}
                            scanStatus={form.scanStatus}
                            onRfidChange={form.changeRfid}
                            onRfidCapture={form.captureEnteredRfid}
                            onFieldChange={form.setData}
                            onTypeChange={form.changeVisitorType}
                        />
                        <VisitorProfileCard data={form.data} errors={form.errors} visitor={visitor} onFieldChange={form.setData} />
                        <VisitorDetailsCard data={form.data} errors={form.errors} onFieldChange={form.setData} />
                        <VisitorFormActions processing={form.processing} />
                    </form>
                </AdminLayout>
            </main>
        </>
    );
}
