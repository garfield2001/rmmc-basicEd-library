import { CustomDateRangePicker } from '@/components/admin/reports/custom-date-range-picker';
import { ReportExportActions } from '@/components/admin/reports/report-export-actions';
import {
    allFilterValue,
    cleanQuery,
    getSchoolYearBounds,
    inferDateRangeMode,
    rowsPerPage,
    sortReportRows,
    summarizeDateRange,
    toSearchParams,
    type DateRangeMode,
    type ReportSortColumn,
    type SortDirection,
    type VisitorType,
    type VisitorTypeFilter,
} from '@/components/admin/reports/report-helpers';
import { ReportMetricCard } from '@/components/admin/reports/report-metric-card';
import { ReportResultsSkeleton } from '@/components/admin/reports/report-results-skeleton';
import { ProgressBar, ReportRow, ReportSortableHead } from '@/components/admin/reports/report-table-parts';
import { Button } from '@/components/ui/button';
import { formatDisplayDate } from '@/components/ui/date-input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SelectInput } from '@/components/ui/select-input';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type VisitReport, type VisitReportOptions } from '@/types/reports';
import { Head, router } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { Activity, RotateCcw, Target, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ReportsProps {
    report: VisitReport | null;
    reportOptions: VisitReportOptions;
}

interface ReportQuery {
    [key: string]: string;
    school_year_id: string;
    start_date: string;
    end_date: string;
    visitor_type: VisitorTypeFilter;
    year_level: string;
    section: string;
    department: string;
}

export default function Reports({ report, reportOptions }: ReportsProps) {
    const activeSchoolYear = reportOptions.schoolYears.find((schoolYear) => schoolYear.is_active) ?? reportOptions.schoolYears[0] ?? null;
    const initialSchoolYearId = report?.filters.school_year_id ? String(report.filters.school_year_id) : '';
    const initialSchoolYear = reportOptions.schoolYears.find((schoolYear) => String(schoolYear.id) === initialSchoolYearId) ?? activeSchoolYear;
    const initialVisitorType: VisitorTypeFilter =
        report?.filters.visitor_type === 'employee' || report?.filters.visitor_type === 'student' ? report.filters.visitor_type : '';

    const [schoolYearId, setSchoolYearId] = useState(initialSchoolYearId);
    const [startDate, setStartDate] = useState(report?.filters.start_date ?? '');
    const [endDate, setEndDate] = useState(report?.filters.end_date ?? '');
    const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>(() =>
        report ? inferDateRangeMode(initialSchoolYear, report.filters.start_date, report.filters.end_date) : '',
    );
    const [visitorType, setVisitorType] = useState<VisitorTypeFilter>(initialVisitorType);
    const [yearLevel, setYearLevel] = useState(report ? (report.filters.year_level ?? allFilterValue) : '');
    const [section, setSection] = useState(report ? (report.filters.section ?? allFilterValue) : '');
    const [department, setDepartment] = useState(report ? (report.filters.department ?? allFilterValue) : '');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<ReportSortColumn | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [showResultsSkeleton, setShowResultsSkeleton] = useState(false);
    const didMountRef = useRef(false);

    const selectedSchoolYear = useMemo(
        () => reportOptions.schoolYears.find((schoolYear) => String(schoolYear.id) === schoolYearId) ?? null,
        [reportOptions.schoolYears, schoolYearId],
    );
    const schoolYearBounds = useMemo(() => getSchoolYearBounds(selectedSchoolYear), [selectedSchoolYear]);
    const sectionSource = useMemo(
        () => (schoolYearId ? (reportOptions.sectionsBySchoolYear[schoolYearId] ?? {}) : reportOptions.sectionsByYearLevel),
        [reportOptions.sectionsBySchoolYear, reportOptions.sectionsByYearLevel, schoolYearId],
    );
    const availableSections = useMemo(
        () => (visitorType === 'student' && yearLevel && yearLevel !== allFilterValue ? (sectionSource[yearLevel] ?? []) : []),
        [visitorType, sectionSource, yearLevel],
    );
    const reportRows = useMemo(() => report?.rows ?? [], [report?.rows]);
    const sortedRows = useMemo(
        () => sortReportRows(reportRows, sortColumn, sortDirection, visitorType),
        [visitorType, reportRows, sortColumn, sortDirection],
    );
    const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
    const visibleRows = sortedRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const fromRow = sortedRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const toRow = Math.min(currentPage * rowsPerPage, sortedRows.length);
    const dateRangeIsValid = Boolean(
        schoolYearId &&
        startDate &&
        endDate &&
        startDate <= endDate &&
        (!schoolYearBounds || (startDate >= schoolYearBounds.start && endDate <= schoolYearBounds.end)),
    );
    const dateRangeSummary = summarizeDateRange(startDate, endDate);
    const studentFiltersComplete = visitorType !== 'student' || Boolean(yearLevel && (yearLevel === allFilterValue || section));
    const employeeFiltersComplete = visitorType !== 'employee' || Boolean(department);
    const reportCanFetch = Boolean(dateRangeIsValid && visitorType && studentFiltersComplete && employeeFiltersComplete);

    const query = useMemo<ReportQuery>(
        () => ({
            school_year_id: schoolYearId,
            start_date: startDate,
            end_date: endDate,
            visitor_type: visitorType,
            year_level: visitorType === 'student' && yearLevel !== allFilterValue ? yearLevel : '',
            section: visitorType === 'student' && yearLevel !== allFilterValue && section !== allFilterValue ? section : '',
            department: visitorType === 'employee' && department !== allFilterValue ? department : '',
        }),
        [department, endDate, visitorType, schoolYearId, section, startDate, yearLevel],
    );

    const queryString = useMemo(() => toSearchParams(query).toString(), [query]);
    const reportQueryString = useMemo(() => (report ? toSearchParams(report.filters).toString() : ''), [report]);
    const hasReportResults = Boolean(report && reportCanFetch && queryString === reportQueryString);
    const excelUrl = `/admin/reports/visits.xls${queryString ? `?${queryString}` : ''}`;
    const wordUrl = `/admin/reports/visits.doc${queryString ? `?${queryString}` : ''}`;
    const csvUrl = `/admin/reports/visits.csv${queryString ? `?${queryString}` : ''}`;
    const pdfUrl = `/admin/reports/visits.pdf${queryString ? `?${queryString}` : ''}`;
    const printUrl = `/admin/reports/visits/print${queryString ? `?${queryString}` : ''}`;

    useEchoPublic('library-visits', '.LibraryVisitRecorded', () => {
        if (reportCanFetch) {
            router.reload({ only: ['report'] });
        }
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [sortedRows]);

    useEffect(() => {
        setSortColumn(null);
        setSortDirection('asc');
    }, [queryString]);

    useEffect(() => {
        if (hasReportResults) {
            setShowResultsSkeleton(false);
        }
    }, [hasReportResults]);

    useEffect(() => {
        if (visitorType !== 'student' || !section || section === allFilterValue || availableSections.includes(section)) {
            return;
        }

        setSection('');
    }, [availableSections, visitorType, section]);

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        if (!reportCanFetch) {
            setShowResultsSkeleton(false);

            return;
        }

        const timeout = window.setTimeout(() => {
            setShowResultsSkeleton(true);
            router.get('/admin/reports', cleanQuery(query), {
                only: ['report'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
            });
        }, 550);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [query, reportCanFetch]);

    useEffect(() => {
        if (
            visitorType === 'student' &&
            yearLevel &&
            yearLevel !== allFilterValue &&
            availableSections.length === 1 &&
            section !== availableSections[0]
        ) {
            setSection(availableSections[0]);
        }
    }, [availableSections, visitorType, section, yearLevel]);

    useEffect(() => {
        if (visitorType === 'employee' && reportOptions.departments.length === 1 && department !== reportOptions.departments[0]) {
            setDepartment(reportOptions.departments[0]);
        }
    }, [department, visitorType, reportOptions.departments]);

    const chooseSchoolYear = (value: string) => {
        setSchoolYearId(value);

        const schoolYear = reportOptions.schoolYears.find((option) => String(option.id) === value);

        if (schoolYear) {
            const bounds = getSchoolYearBounds(schoolYear);

            if (!bounds) {
                return;
            }

            setDateRangeMode('');
            setStartDate('');
            setEndDate('');
            setVisitorType('');
            setYearLevel('');
            setSection('');
            setDepartment('');
        }
    };

    const chooseDateRangeMode = (value: DateRangeMode) => {
        setDateRangeMode(value);

        if (!schoolYearBounds) {
            return;
        }

        setStartDate(value === 'school_year' ? schoolYearBounds.start : '');
        setEndDate(value === 'school_year' ? schoolYearBounds.end : '');
        setVisitorType('');
        setYearLevel('');
        setSection('');
        setDepartment('');
    };

    const chooseCustomDateRange = (nextStartDate: string, nextEndDate: string) => {
        setStartDate(nextStartDate);
        setEndDate(nextEndDate);
    };

    const chooseVisitorType = (value: VisitorTypeFilter) => {
        setVisitorType(value);

        if (!value) {
            setYearLevel('');
            setSection('');
            setDepartment('');
            return;
        }

        if (value === 'student') {
            setDepartment('');
            return;
        }

        setYearLevel('');
        setSection('');
    };

    const changeSort = (column: ReportSortColumn) => {
        setSortColumn((currentColumn) => {
            if (currentColumn === column) {
                setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));

                return currentColumn;
            }

            setSortDirection(column === 'visit_count' || column === 'progress_percent' ? 'desc' : 'asc');

            return column;
        });
    };

    const clearSort = () => {
        setSortColumn(null);
        setSortDirection('asc');
    };

    return (
        <>
            <Head title="Reports" />
            <main className="min-h-screen">
                <AdminLayout active="reports">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader title="Reports" description="School-year progress by selected visitors, date range, and filters." />

                        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                            <div className="grid gap-4 md:grid-cols-3">
                                <label className="text-sm font-medium text-[#010440]">
                                    1. School year
                                    <SelectInput value={schoolYearId} onChange={(event) => chooseSchoolYear(event.target.value)} className="mt-2">
                                        <option value="">Select school year</option>
                                        {reportOptions.schoolYears.map((schoolYear) => (
                                            <option key={schoolYear.id} value={schoolYear.id}>
                                                {schoolYear.name}
                                                {schoolYear.is_active ? ' (active)' : ''}
                                            </option>
                                        ))}
                                    </SelectInput>
                                </label>

                                {selectedSchoolYear && (
                                    <label className="text-sm font-medium text-[#010440]">
                                        2. Date coverage
                                        <SelectInput
                                            value={dateRangeMode}
                                            onChange={(event) => chooseDateRangeMode(event.target.value as DateRangeMode)}
                                            className="mt-2"
                                        >
                                            <option value="">Select date coverage</option>
                                            <option value="school_year">Whole school year</option>
                                            <option value="custom">Custom start and end</option>
                                        </SelectInput>
                                    </label>
                                )}

                                {selectedSchoolYear && dateRangeMode === 'custom' && schoolYearBounds && (
                                    <label className="text-sm font-medium text-[#010440]">
                                        3. Custom start and end
                                        <CustomDateRangePicker
                                            startDate={startDate}
                                            endDate={endDate}
                                            min={schoolYearBounds.start}
                                            max={schoolYearBounds.end}
                                            onChange={chooseCustomDateRange}
                                        />
                                    </label>
                                )}

                                {dateRangeIsValid && (
                                    <label className="text-sm font-medium text-[#010440]">
                                        {dateRangeMode === 'custom' ? '4.' : '3.'} Visitors
                                        <SelectInput
                                            value={visitorType}
                                            onChange={(event) => chooseVisitorType(event.target.value as VisitorTypeFilter)}
                                            className="mt-2"
                                        >
                                            <option value="">Select visitors</option>
                                            <option value="student">Students</option>
                                            <option value="employee">Employees</option>
                                        </SelectInput>
                                    </label>
                                )}

                                {dateRangeIsValid &&
                                    visitorType &&
                                    (visitorType === 'student' ? (
                                        <>
                                            <label className="text-sm font-medium text-[#010440]">
                                                Year level
                                                <SelectInput
                                                    value={yearLevel}
                                                    onChange={(event) => {
                                                        setYearLevel(event.target.value);
                                                        setSection('');
                                                    }}
                                                    className="mt-2"
                                                >
                                                    <option value="">Select year level</option>
                                                    <option value={allFilterValue}>All year levels</option>
                                                    {reportOptions.yearLevels.map((level) => (
                                                        <option key={level} value={level}>
                                                            {level}
                                                        </option>
                                                    ))}
                                                </SelectInput>
                                            </label>

                                            {yearLevel && yearLevel !== allFilterValue && (
                                                <label className="text-sm font-medium text-[#010440]">
                                                    Section
                                                    <SelectInput
                                                        value={section}
                                                        onChange={(event) => setSection(event.target.value)}
                                                        className="mt-2"
                                                    >
                                                        <option value="">Select section</option>
                                                        {availableSections.length > 1 && <option value={allFilterValue}>All sections</option>}
                                                        {availableSections.map((option) => (
                                                            <option key={option} value={option}>
                                                                {option}
                                                            </option>
                                                        ))}
                                                    </SelectInput>
                                                </label>
                                            )}
                                        </>
                                    ) : (
                                        <label className="text-sm font-medium text-[#010440]">
                                            Department
                                            <SelectInput value={department} onChange={(event) => setDepartment(event.target.value)} className="mt-2">
                                                <option value="">Select department</option>
                                                <option value={allFilterValue}>All departments</option>
                                                {reportOptions.departments.map((option) => (
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </SelectInput>
                                        </label>
                                    ))}
                            </div>

                            <div className="mt-4 rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] px-4 py-3 text-sm text-[#020659]/75">
                                <span className="font-medium text-[#010440]">Selected period:</span> {dateRangeSummary}
                                {schoolYearBounds && (
                                    <span className="block pt-1">
                                        Available dates stay inside {formatDisplayDate(schoolYearBounds.start)} to{' '}
                                        {formatDisplayDate(schoolYearBounds.end)}.
                                    </span>
                                )}
                            </div>
                        </section>

                        {showResultsSkeleton ? (
                            <ReportResultsSkeleton />
                        ) : hasReportResults && report ? (
                            <>
                                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <ReportMetricCard
                                        icon={UsersRound}
                                        label={visitorType === 'student' ? 'Students' : 'Employees'}
                                        value={report.summary.visitors}
                                    />
                                    <ReportMetricCard
                                        icon={Activity}
                                        label="Visits recorded"
                                        value={report.summary.total_visits}
                                        detail={`${report.summary.average_visits} average, ${report.summary.required_visits} target`}
                                    />
                                    <ReportMetricCard
                                        icon={Target}
                                        label="Excess visits"
                                        value={report.summary.excess_visits}
                                        detail="Visits beyond the required target"
                                    />
                                    <ReportMetricCard
                                        icon={Target}
                                        label="No visits"
                                        value={report.summary.unvisited_visitors}
                                        detail={`${report.summary.progress_percent}% overall progress`}
                                    />
                                </section>

                                <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold tracking-normal text-[#010440]">
                                                School year: {report.school_year?.name ?? selectedSchoolYear?.name ?? 'No school year selected'}
                                            </h2>
                                            <p className="mt-1 text-sm text-[#020659]/70">From {dateRangeSummary}</p>
                                        </div>
                                        <div className="min-w-64">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="font-medium text-[#020659]">Overall required progress</span>
                                                <span className="font-semibold text-[#010440]">{report.summary.progress_percent}%</span>
                                            </div>
                                            <ProgressBar value={report.summary.progress_percent} className="mt-2" />
                                        </div>
                                    </div>
                                </section>

                                <section className="admin-surface overflow-hidden rounded-lg border border-[#040DBF]/10 bg-white/95 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#040DBF]/10 bg-[#f6f8ff] px-5 py-3">
                                        <ReportExportActions
                                            excelUrl={excelUrl}
                                            wordUrl={wordUrl}
                                            csvUrl={csvUrl}
                                            pdfUrl={pdfUrl}
                                            printUrl={printUrl}
                                        />
                                        {sortColumn && (
                                            <Button type="button" variant="outline" size="sm" onClick={clearSort}>
                                                <RotateCcw className="size-4" />
                                                Clear sort
                                            </Button>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-180">
                                            <TableHeader className="bg-[#f6f8ff]">
                                                <TableRow>
                                                    <ReportSortableHead
                                                        column="school_id"
                                                        label="School ID"
                                                        sort={sortColumn}
                                                        direction={sortDirection}
                                                        onSortChange={changeSort}
                                                    />
                                                    <ReportSortableHead
                                                        column="name"
                                                        label="Name"
                                                        sort={sortColumn}
                                                        direction={sortDirection}
                                                        onSortChange={changeSort}
                                                    />
                                                    <ReportSortableHead
                                                        column="group"
                                                        label={visitorType === 'student' ? 'Year/section' : 'Department'}
                                                        sort={sortColumn}
                                                        direction={sortDirection}
                                                        onSortChange={changeSort}
                                                    />
                                                    <ReportSortableHead
                                                        column="visit_count"
                                                        label="Visits"
                                                        sort={sortColumn}
                                                        direction={sortDirection}
                                                        onSortChange={changeSort}
                                                    />
                                                    <ReportSortableHead
                                                        column="progress_percent"
                                                        label="Progress"
                                                        sort={sortColumn}
                                                        direction={sortDirection}
                                                        onSortChange={changeSort}
                                                    />
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {visibleRows.length > 0 ? (
                                                    visibleRows.map((row) => (
                                                        <ReportRow
                                                            key={row.id}
                                                            row={row}
                                                            visitorType={visitorType as VisitorType}
                                                            requiredVisits={report.summary.required_visits}
                                                        />
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-24 text-center text-sm text-[#020659]/65">
                                                            No matching records.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <PaginationControls
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        from={fromRow}
                                        to={toRow}
                                        total={sortedRows.length}
                                        onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                        onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                        onPageChange={(page) => setCurrentPage(Math.min(totalPages, Math.max(1, page)))}
                                    />
                                </section>
                            </>
                        ) : (
                            <section className="admin-surface rounded-lg border border-dashed border-[#040DBF]/20 bg-white/80 p-8 text-center">
                                <h2 className="text-lg font-semibold text-[#010440]">
                                    {reportCanFetch ? 'No report results' : 'Complete the report filters'}
                                </h2>
                                <p className="mt-2 text-sm text-[#020659]/70">
                                    {reportCanFetch
                                        ? 'No visitors matched the selected school year, date range, and filters.'
                                        : 'Choose the school year, date coverage, visitor type, and the required student or employee filter before results appear.'}
                                </p>
                            </section>
                        )}
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
