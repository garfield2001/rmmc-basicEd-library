import { PaginationControls } from '@/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type VisitReport, type VisitReportOptions } from '@/types/reports';
import { Head, router } from '@inertiajs/react';
import { type FormEventHandler, useState } from 'react';

interface ReportsProps {
    report: VisitReport;
    reportOptions: VisitReportOptions;
}

export default function Reports({ report, reportOptions }: ReportsProps) {
    const [schoolYearId, setSchoolYearId] = useState(report.filters.school_year_id ? String(report.filters.school_year_id) : '');
    const [startDate, setStartDate] = useState(report.filters.start_date);
    const [endDate, setEndDate] = useState(report.filters.end_date);
    const [memberType, setMemberType] = useState(report.filters.member_type ?? '');
    const [memberStatus, setMemberStatus] = useState(report.filters.member_status ?? '');
    const [yearLevel, setYearLevel] = useState(report.filters.year_level ?? '');
    const [section, setSection] = useState(report.filters.section ?? '');
    const [department, setDepartment] = useState(report.filters.department ?? '');
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 5;
    const totalPages = Math.max(1, Math.ceil(report.rows.length / rowsPerPage));
    const visibleRows = report.rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const sectionSource = schoolYearId ? (reportOptions.sectionsBySchoolYear[schoolYearId] ?? {}) : reportOptions.sectionsByYearLevel;
    const availableSections = yearLevel ? (sectionSource[yearLevel] ?? []) : [];

    const query = new URLSearchParams();
    if (schoolYearId) query.set('school_year_id', schoolYearId);
    if (startDate) query.set('start_date', startDate);
    if (endDate) query.set('end_date', endDate);
    if (memberType) query.set('member_type', memberType);
    if (memberStatus) query.set('member_status', memberStatus);
    if (yearLevel) query.set('year_level', yearLevel);
    if (section) query.set('section', section);
    if (department) query.set('department', department);

    const queryString = query.toString();
    const exportUrl = `/admin/reports/visits.csv${queryString ? `?${queryString}` : ''}`;
    const excelUrl = `/admin/reports/visits.xls${queryString ? `?${queryString}` : ''}`;
    const wordUrl = `/admin/reports/visits.doc${queryString ? `?${queryString}` : ''}`;
    const printUrl = `/admin/reports/visits/print${queryString ? `?${queryString}` : ''}`;

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        router.get('/admin/reports', {
            school_year_id: schoolYearId || undefined,
            start_date: startDate,
            end_date: endDate,
            member_type: memberType || undefined,
            member_status: memberStatus || undefined,
            year_level: yearLevel || undefined,
            section: yearLevel ? section || undefined : undefined,
            department: department || undefined,
        });
    };

    return (
        <>
            <Head title="Reports" />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminLayout active="reports">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Reports"
                            description="Generate visit reports by school year, date range, member group, department, year level, or section."
                        />

                        <form onSubmit={submit} className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-4">
                            <label className="text-sm font-medium">
                                School year
                                <select
                                    value={schoolYearId}
                                    onChange={(event) => setSchoolYearId(event.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                >
                                    <option value="">All school years</option>
                                    {reportOptions.schoolYears.map((schoolYear) => (
                                        <option key={schoolYear.id} value={schoolYear.id}>
                                            {schoolYear.name}
                                            {schoolYear.is_active ? ' (active)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sm font-medium">
                                Start date
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(event) => setStartDate(event.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm font-medium">
                                End date
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(event) => setEndDate(event.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-sm font-medium">
                                Type
                                <select
                                    value={memberType}
                                    onChange={(event) => setMemberType(event.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                >
                                    <option value="">All</option>
                                    <option value="student">Students</option>
                                    <option value="employee">Employees</option>
                                </select>
                            </label>
                            <label className="text-sm font-medium">
                                Member status
                                <select
                                    value={memberStatus}
                                    onChange={(event) => setMemberStatus(event.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                >
                                    <option value="">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </label>
                            <label className="text-sm font-medium">
                                Year level
                                <select
                                    value={yearLevel}
                                    onChange={(event) => {
                                        setYearLevel(event.target.value);
                                        setSection('');
                                    }}
                                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                >
                                    <option value="">All year levels</option>
                                    {reportOptions.yearLevels.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sm font-medium">
                                Section
                                <select
                                    value={section}
                                    onChange={(event) => setSection(event.target.value)}
                                    disabled={!yearLevel}
                                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <option value="">{yearLevel ? 'All sections' : 'Choose year level first'}</option>
                                    {availableSections.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="text-sm font-medium">
                                Department
                                <select
                                    value={department}
                                    onChange={(event) => setDepartment(event.target.value)}
                                    className="mt-2 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                >
                                    <option value="">All departments</option>
                                    {reportOptions.departments.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex items-end gap-2 md:col-span-2">
                                <button type="submit" className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                                    Apply
                                </button>
                                <ExportLink href={excelUrl} label="Excel" />
                                <ExportLink href={wordUrl} label="Word" />
                                <ExportLink href={exportUrl} label="CSV" />
                                <ExportLink href={printUrl} label="Print/PDF" external />
                            </div>
                        </form>

                        <section className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <p className="text-sm text-zinc-500">Total visits</p>
                                <p className="mt-2 text-3xl font-semibold">{report.summary.total}</p>
                            </div>
                            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <p className="text-sm text-zinc-500">Students</p>
                                <p className="mt-2 text-3xl font-semibold">{report.summary.students}</p>
                            </div>
                            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <p className="text-sm text-zinc-500">Employees</p>
                                <p className="mt-2 text-3xl font-semibold">{report.summary.employees}</p>
                            </div>
                        </section>

                        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <Table className="min-w-225">
                                    <TableHeader className="bg-zinc-50">
                                        <TableRow>
                                            <TableHead>Visited at</TableHead>
                                            <TableHead>School ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Year level</TableHead>
                                            <TableHead>Section</TableHead>
                                            <TableHead>Department</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {visibleRows.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>{row.visited_at}</TableCell>
                                                <TableCell className="font-medium">{row.school_id}</TableCell>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell className="capitalize">{row.type}</TableCell>
                                                <TableCell>{row.year_level || '-'}</TableCell>
                                                <TableCell>{row.section || '-'}</TableCell>
                                                <TableCell>{row.department || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                from={(currentPage - 1) * rowsPerPage + 1}
                                to={Math.min(currentPage * rowsPerPage, report.rows.length)}
                                total={report.rows.length}
                                onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            />
                        </div>
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}

function ExportLink({ href, label, external = false }: { href: string; label: string; external?: boolean }) {
    return (
        <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        >
            {label}
        </a>
    );
}
