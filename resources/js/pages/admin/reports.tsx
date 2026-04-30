import { AdminPageHeader, AdminShell } from '@/components/admin-shell';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type VisitReport } from '@/types';
import { Head, router } from '@inertiajs/react';
import { type FormEventHandler, useState } from 'react';

interface ReportsProps {
    report: VisitReport;
}

export default function Reports({ report }: ReportsProps) {
    const [startDate, setStartDate] = useState(report.filters.start_date);
    const [endDate, setEndDate] = useState(report.filters.end_date);
    const [memberType, setMemberType] = useState(report.filters.member_type ?? '');

    const query = new URLSearchParams();
    if (startDate) query.set('start_date', startDate);
    if (endDate) query.set('end_date', endDate);
    if (memberType) query.set('member_type', memberType);

    const queryString = query.toString();
    const exportUrl = `/admin/reports/visits.csv${queryString ? `?${queryString}` : ''}`;
    const printUrl = `/admin/reports/visits/print${queryString ? `?${queryString}` : ''}`;

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        router.get('/admin/reports', {
            start_date: startDate,
            end_date: endDate,
            member_type: memberType || undefined,
        });
    };

    return (
        <>
            <Head title="Visit Records" />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminShell active="reports">
                    <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Visit Records"
                            description="Filter, print, save as PDF, or export library visits for Excel."
                        />

                        <form onSubmit={submit} className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm md:grid-cols-4">
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
                            <div className="flex items-end gap-2">
                                <button type="submit" className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
                                    Apply
                                </button>
                                <a
                                    href={exportUrl}
                                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                                >
                                    CSV
                                </a>
                                <a
                                    href={printUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                                >
                                    Print/PDF
                                </a>
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

                        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
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
                                    {report.rows.map((row) => (
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
                    </div>
                </AdminShell>
            </main>
        </>
    );
}
