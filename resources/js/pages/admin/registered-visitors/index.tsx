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

export default function VisitorsIndex({ visitors, pagePath, filters, filterOptions, distribution }: VisitorsIndexProps) {
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
            <Head title={table.activeType === 'student' ? 'Registered Students' : 'Registered Employees'} />
            <main className="min-h-screen">
                <AdminLayout active="visitors">
                    <div className="admin-content-shell mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title={table.activeType === 'student' ? 'Registered Students' : 'Registered Employees'}
                            description={
                                table.activeType === 'student'
                                    ? 'Manage student RFID cards, school-year grade & section placements, and searchable roster records.'
                                    : 'Manage employee and faculty RFID cards, department assignments, and searchable records.'
                            }
                            actions={
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                                    <RegisteredVisitorsHeaderActions
                                        importing={importer.importing}
                                        importInputRef={importer.importInputRef}
                                        createLabel={table.activeType === 'student' ? 'Add student' : 'Add employee'}
                                        onImportFile={importer.previewImport}
                                        onCreateVisitor={openCreateVisitor}
                                    />
                                </div>
                            }
                        />

                        <VisitorsTable
                            visitors={visitors}
                            activeType={table.activeType}
                            distribution={distribution}
                            showTypeTabs={false}
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
                            onEdit={openEditVisitor}
                            onPrevious={() =>
                                table.visitUrl(visitors.prev_page_url ?? visitors.links.find((link) => link.label.includes('Previous'))?.url)
                            }
                            onNext={() => table.visitUrl(visitors.next_page_url ?? visitors.links.find((link) => link.label.includes('Next'))?.url)}
                            onPageChange={table.requestPage}
                        />
                        {importer.importError && (
                            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                                {importer.importError}
                            </p>
                        )}
                    </div>

                    <VisitorFormModal
                        visitor={selectedVisitor}
                        open={visitorFormOpen}
                        defaultType={table.activeType}
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
