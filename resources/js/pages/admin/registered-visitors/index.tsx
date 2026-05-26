import { VisitorFormModal } from '@/components/admin/registered-visitors/form/visitor-form-modal';
import { RegisteredVisitorsHeaderActions } from '@/components/admin/registered-visitors/import/header-actions';
import { ImportPreviewDialog } from '@/components/admin/registered-visitors/import/import-preview-dialog';
import { ImportProgressOverlay } from '@/components/admin/registered-visitors/import/import-progress-overlay';
import { useVisitorImport } from '@/components/admin/registered-visitors/import/use-visitor-import';
import { useVisitorsTableControls } from '@/components/admin/registered-visitors/table/use-visitors-table-controls';
import type { VisitorsIndexProps } from '@/components/admin/registered-visitors/table/visitors-index-types';
import { VisitorsTable } from '@/components/admin/registered-visitors/table/visitors-table';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type LibraryMemberRow } from '@/types/registered-visitors';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function VisitorsIndex({ visitors, audienceType, pagePath, filters, filterOptions }: VisitorsIndexProps) {
    const table = useVisitorsTableControls(filters, filterOptions, pagePath);
    const importer = useVisitorImport();
    const [visitorFormOpen, setVisitorFormOpen] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<LibraryMemberRow | null>(null);
    const { search, yearLevel, section, department, sort, direction, perPage } = table.fields;

    const openCreateVisitor = () => {
        setSelectedVisitor(null);
        setVisitorFormOpen(true);
    };

    const openEditVisitor = (visitor: LibraryMemberRow) => {
        setSelectedVisitor(visitor);
        setVisitorFormOpen(true);
    };

    return (
        <>
            <Head title={audienceType === 'student' ? 'Registered Students' : 'Registered Employees'} />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminLayout active="visitors">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title={audienceType === 'student' ? 'Registered Students' : 'Registered Employees'}
                            description={
                                audienceType === 'student'
                                    ? 'Manage student RFID identities, year levels, and active school-year sections.'
                                    : 'Manage employee RFID identities, departments, and active school-year details.'
                            }
                            actions={
                                <RegisteredVisitorsHeaderActions
                                    importing={importer.importing}
                                    importInputRef={importer.importInputRef}
                                    createLabel={audienceType === 'student' ? 'Add student' : 'Add employee'}
                                    onImportFile={importer.previewImport}
                                    onCreateVisitor={openCreateVisitor}
                                />
                            }
                        />

                        <VisitorsTable
                            visitors={visitors}
                            activeType={table.activeType}
                            search={search}
                            yearLevel={yearLevel}
                            section={section}
                            department={department}
                            yearLevels={filterOptions.yearLevels}
                            sections={table.availableSections}
                            departments={filterOptions.departments}
                            rowsPerPage={perPage}
                            sort={sort}
                            direction={direction}
                            isLoading={table.tableLoading}
                            onSearchChange={table.setters.setSearch}
                            onTypeChange={table.changeType}
                            onYearLevelChange={table.changeYearLevel}
                            onSectionChange={table.changeSection}
                            onDepartmentChange={table.changeDepartment}
                            onRowsPerPageChange={table.setters.setPerPage}
                            onSortChange={table.changeSort}
                            onSortClear={table.clearSort}
                            showTypeTabs={false}
                            onEdit={openEditVisitor}
                            onPrevious={() =>
                                table.visitUrl(visitors.prev_page_url ?? visitors.links.find((link) => link.label.includes('Previous'))?.url)
                            }
                            onNext={() => table.visitUrl(visitors.next_page_url ?? visitors.links.find((link) => link.label.includes('Next'))?.url)}
                            onPageChange={table.requestPage}
                        />
                        {importer.importError && (
                            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                                {importer.importError}
                            </p>
                        )}
                    </div>

                    <VisitorFormModal
                        visitor={selectedVisitor}
                        open={visitorFormOpen}
                        defaultType={audienceType}
                        sectionsByYearLevel={filterOptions.sectionsByYearLevel}
                        onOpenChange={setVisitorFormOpen}
                    />
                    <ImportPreviewDialog
                        open={importer.importPreviewOpen}
                        preview={importer.importPreview}
                        processing={importer.importing}
                        onCancel={importer.cancelImport}
                        onConfirm={importer.confirmImport}
                    />
                    {importer.importing && <ImportProgressOverlay previewOpen={importer.importPreviewOpen} />}
                </AdminLayout>
            </main>
        </>
    );
}
