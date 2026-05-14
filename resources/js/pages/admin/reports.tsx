import { Button } from '@/components/ui/button';
import { formatDisplayDate } from '@/components/ui/date-input';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { SelectInput } from '@/components/ui/select-input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { cn } from '@/lib/utils';
import { type VisitReport, type VisitReportOptions, type VisitReportRow, type VisitReportSchoolYear } from '@/types/reports';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    ArrowDown,
    ArrowUp,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronsUpDown,
    Download,
    FileSpreadsheet,
    FileText,
    GraduationCap,
    Printer,
    RotateCcw,
    Target,
    UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface ReportsProps {
    report: VisitReport | null;
    reportOptions: VisitReportOptions;
}

type VisitorType = 'student' | 'employee';
type VisitorTypeFilter = '' | VisitorType;
type DateRangeMode = '' | 'school_year' | 'custom';
type AllFilterValue = '__all__';
type ReportSortColumn = 'school_id' | 'name' | 'group' | 'visit_count' | 'progress_percent' | 'last_visit_at';
type SortDirection = 'asc' | 'desc';

interface ReportQuery {
    school_year_id: string;
    start_date: string;
    end_date: string;
    visitor_type: VisitorTypeFilter;
    year_level: string;
    section: string;
    department: string;
}

const rowsPerPage = 10;
const skeletonDelayMs = 350;
const allFilterValue: AllFilterValue = '__all__';

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
    const skeletonTimerRef = useRef<number | null>(null);

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
    const reportRows = report?.rows ?? [];
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
    const printUrl = `/admin/reports/visits/print${queryString ? `?${queryString}` : ''}`;

    useEffect(() => {
        setCurrentPage(1);
    }, [sortedRows]);

    useEffect(() => {
        setSortColumn(null);
        setSortDirection('asc');
    }, [queryString]);

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
            if (skeletonTimerRef.current) {
                window.clearTimeout(skeletonTimerRef.current);
                skeletonTimerRef.current = null;
            }

            setShowResultsSkeleton(false);

            return;
        }

        const timeout = window.setTimeout(() => {
            router.get('/admin/reports', cleanQuery(query), {
                only: ['report'],
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onStart: () => {
                    skeletonTimerRef.current = window.setTimeout(() => setShowResultsSkeleton(true), skeletonDelayMs);
                },
                onFinish: () => {
                    if (skeletonTimerRef.current) {
                        window.clearTimeout(skeletonTimerRef.current);
                        skeletonTimerRef.current = null;
                    }

                    setShowResultsSkeleton(false);
                },
            });
        }, 550);

        return () => {
            window.clearTimeout(timeout);

            if (skeletonTimerRef.current) {
                window.clearTimeout(skeletonTimerRef.current);
                skeletonTimerRef.current = null;
            }
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
                                    <MetricCard
                                        icon={UsersRound}
                                        label={visitorType === 'student' ? 'Students' : 'Employees'}
                                        value={report.summary.visitors}
                                    />
                                    <MetricCard
                                        icon={Activity}
                                        label="Visits recorded"
                                        value={report.summary.total_visits}
                                        detail={`${report.summary.average_visits} average`}
                                    />
                                    <MetricCard
                                        icon={CheckCircle2}
                                        label="Met required"
                                        value={report.summary.met_required}
                                        detail={`${report.summary.required_visits} required visits`}
                                    />
                                    <MetricCard
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
                                                {report.school_year?.name ?? selectedSchoolYear?.name ?? 'No school year selected'}
                                            </h2>
                                            <p className="mt-1 text-sm text-[#020659]/70">{dateRangeSummary}</p>
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
                                        <div className="flex flex-wrap items-center gap-2">
                                            <ExportButton href={excelUrl} label="Excel" icon={FileSpreadsheet} />
                                            <ExportButton href={wordUrl} label="Word" icon={FileText} />
                                            <ExportButton href={csvUrl} label="CSV" icon={Download} />
                                            <ExportButton href={printUrl} label="Print" icon={Printer} external />
                                        </div>
                                        {sortColumn && (
                                            <Button type="button" variant="outline" size="sm" onClick={clearSort}>
                                                <RotateCcw className="size-4" />
                                                Clear sort
                                            </Button>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-220">
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
                                                        label={visitorType === 'student' ? 'Year and section' : 'Department'}
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
                                                    <ReportSortableHead
                                                        column="last_visit_at"
                                                        label="Last visit"
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
                                                            visitorType={visitorType}
                                                            requiredVisits={report.summary.required_visits}
                                                        />
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-24 text-center text-sm text-[#020659]/65">
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
                                    />
                                </section>
                            </>
                        ) : (
                            <section className="admin-surface rounded-lg border border-dashed border-[#040DBF]/20 bg-white/80 p-8 text-center">
                                <h2 className="text-lg font-semibold text-[#010440]">Complete the report filters</h2>
                                <p className="mt-2 text-sm text-[#020659]/70">
                                    Choose the school year, date coverage, visitor type, and the required student or employee filter before results
                                    appear.
                                </p>
                            </section>
                        )}
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}

function CustomDateRangePicker({
    startDate,
    endDate,
    min,
    max,
    onChange,
}: {
    startDate: string;
    endDate: string;
    min: string;
    max: string;
    onChange: (startDate: string, endDate: string) => void;
}) {
    const wrapperRef = useRef<HTMLSpanElement>(null);
    const minDate = useMemo(() => parseReportIsoDate(min), [min]);
    const maxDate = useMemo(() => parseReportIsoDate(max), [max]);
    const selectedStartDate = useMemo(() => parseReportIsoDate(startDate), [startDate]);
    const selectedEndDate = useMemo(() => parseReportIsoDate(endDate), [endDate]);
    const [isOpen, setIsOpen] = useState(false);
    const [startVisibleMonth, setStartVisibleMonth] = useState(() =>
        startOfReportMonth(clampReportDate(selectedStartDate ?? minDate ?? new Date(), minDate, maxDate)),
    );
    const [endVisibleMonth, setEndVisibleMonth] = useState(() =>
        startOfReportMonth(clampReportDate(selectedEndDate ?? selectedStartDate ?? minDate ?? new Date(), selectedStartDate ?? minDate, maxDate)),
    );
    const startYearOptions = useMemo(() => buildReportYearOptions(minDate, maxDate, startVisibleMonth), [maxDate, minDate, startVisibleMonth]);
    const endYearOptions = useMemo(
        () => buildReportYearOptions(selectedStartDate ?? minDate, maxDate, endVisibleMonth),
        [endVisibleMonth, maxDate, minDate, selectedStartDate],
    );

    useEffect(() => {
        setStartVisibleMonth(startOfReportMonth(clampReportDate(selectedStartDate ?? minDate ?? new Date(), minDate, maxDate)));
    }, [maxDate, minDate, selectedStartDate]);

    useEffect(() => {
        setEndVisibleMonth(
            startOfReportMonth(clampReportDate(selectedEndDate ?? selectedStartDate ?? minDate ?? new Date(), selectedStartDate ?? minDate, maxDate)),
        );
    }, [maxDate, minDate, selectedEndDate, selectedStartDate]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const closeOnOutsideClick = (event: MouseEvent) => {
            if (wrapperRef.current?.contains(event.target as Node)) {
                return;
            }

            setIsOpen(false);
        };

        document.addEventListener('mousedown', closeOnOutsideClick);

        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, [isOpen]);

    const selectStartDate = (date: Date) => {
        if (!isReportDateInRange(date, minDate, maxDate)) {
            return;
        }

        const nextStartDate = toReportIsoDate(date);
        const nextEndDate = endDate && endDate >= nextStartDate ? endDate : '';

        onChange(nextStartDate, nextEndDate);

        if (!nextEndDate) {
            setEndVisibleMonth(startOfReportMonth(clampReportDate(date, minDate, maxDate)));
        }
    };

    const selectEndDate = (date: Date) => {
        const endMinDate = selectedStartDate ?? minDate;

        if (!selectedStartDate || !isReportDateInRange(date, endMinDate, maxDate)) {
            return;
        }

        onChange(startDate, toReportIsoDate(date));
    };

    const moveStartMonth = (month: number, year: number) => {
        setStartVisibleMonth(
            startOfReportMonth(clampReportDate(new Date(year, month, 1), reportMonthStartLimit(minDate), reportMonthStartLimit(maxDate))),
        );
    };

    const moveEndMonth = (month: number, year: number) => {
        setEndVisibleMonth(
            startOfReportMonth(
                clampReportDate(new Date(year, month, 1), reportMonthStartLimit(selectedStartDate ?? minDate), reportMonthStartLimit(maxDate)),
            ),
        );
    };

    return (
        <span ref={wrapperRef} className="relative mt-2 block w-full">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                className="flex h-12 w-full items-center justify-between gap-3 rounded-lg border border-[#040DBF]/15 bg-white px-4 text-left text-sm font-medium text-[#010440] transition outline-none hover:border-[#040DBF]/30 focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                aria-expanded={isOpen}
            >
                <span className={cn(startDate || endDate ? 'text-[#010440]' : 'text-[#020659]/55')}>{summarizeDateRange(startDate, endDate)}</span>
                <CalendarDays className="size-4 shrink-0 text-[#030A8C]" />
            </button>

            {isOpen && (
                <span className="absolute right-0 z-50 mt-2 block w-[min(42rem,calc(100vw-2rem))] rounded-lg border border-[#040DBF]/15 bg-white p-4 text-[#010440] shadow-xl">
                    <span className="grid gap-4 md:grid-cols-2">
                        <CompactCalendar
                            label="Start date"
                            selectedDate={selectedStartDate}
                            visibleMonth={startVisibleMonth}
                            minDate={minDate}
                            maxDate={maxDate}
                            yearOptions={startYearOptions}
                            onMoveMonth={moveStartMonth}
                            onSelectDate={selectStartDate}
                        />
                        <CompactCalendar
                            label="End date"
                            hint={selectedStartDate ? undefined : 'Choose a start date first.'}
                            selectedDate={selectedEndDate}
                            visibleMonth={endVisibleMonth}
                            minDate={selectedStartDate ?? minDate}
                            maxDate={maxDate}
                            yearOptions={endYearOptions}
                            onMoveMonth={moveEndMonth}
                            onSelectDate={selectEndDate}
                        />
                    </span>
                </span>
            )}
        </span>
    );
}

function CompactCalendar({
    label,
    hint,
    selectedDate,
    visibleMonth,
    minDate,
    maxDate,
    yearOptions,
    onMoveMonth,
    onSelectDate,
}: {
    label: string;
    hint?: string;
    selectedDate: Date | null;
    visibleMonth: Date;
    minDate: Date | null;
    maxDate: Date | null;
    yearOptions: number[];
    onMoveMonth: (month: number, year: number) => void;
    onSelectDate: (date: Date) => void;
}) {
    const calendarDays = useMemo(() => buildReportCalendarDays(visibleMonth), [visibleMonth]);

    return (
        <span className="block">
            <span className="mb-2 block text-sm font-semibold text-[#010440]">{label}</span>
            <span className="grid grid-cols-[minmax(0,1fr)_6rem] gap-2">
                <select
                    value={visibleMonth.getMonth()}
                    onChange={(event) => onMoveMonth(Number(event.target.value), visibleMonth.getFullYear())}
                    className="h-10 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                >
                    {reportMonthOptions.map((month) => (
                        <option
                            key={month.value}
                            value={month.value}
                            disabled={!isReportMonthInRange(month.value, visibleMonth.getFullYear(), minDate, maxDate)}
                        >
                            {month.label}
                        </option>
                    ))}
                </select>
                <select
                    value={visibleMonth.getFullYear()}
                    onChange={(event) => onMoveMonth(visibleMonth.getMonth(), Number(event.target.value))}
                    className="h-10 rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm font-medium outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                >
                    {yearOptions.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </span>
            {hint && <span className="mt-2 block rounded-md bg-[#f6f8ff] px-3 py-2 text-xs font-medium text-[#020659]/70">{hint}</span>}

            <span className="mt-3 grid grid-cols-7 gap-y-1 text-center text-sm">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <span key={day} className="py-1 font-semibold text-[#020659]/70">
                        {day}
                    </span>
                ))}
                {calendarDays.map((day) => {
                    const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
                    const isSelected = selectedDate ? isSameReportDay(day, selectedDate) : false;
                    const isDisabled = !isReportDateInRange(day, minDate, maxDate);

                    return (
                        <button
                            key={`${label}-${toReportIsoDate(day)}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => onSelectDate(day)}
                            className={cn(
                                'mx-auto flex size-8 items-center justify-center rounded-md font-medium transition disabled:cursor-not-allowed disabled:text-[#020659]/25',
                                isCurrentMonth ? 'text-[#010440]' : 'text-[#020659]/40',
                                isSelected ? 'bg-[#040DBF] text-white hover:bg-[#030A8C] disabled:bg-[#040DBF]/45' : 'hover:bg-[#f6f8ff]',
                            )}
                        >
                            {String(day.getDate()).padStart(2, '0')}
                        </button>
                    );
                })}
            </span>
        </span>
    );
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof UsersRound; label: string; value: number; detail?: string }) {
    return (
        <div className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-[#030A8C]">{label}</p>
                    <p className="mt-3 text-4xl font-semibold tracking-normal text-[#010440]">{value.toLocaleString()}</p>
                </div>
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-[#040DBF]/10 text-[#040DBF]">
                    <Icon className="size-5" />
                </span>
            </div>
            {detail && <p className="mt-3 text-sm text-[#020659]/70">{detail}</p>}
        </div>
    );
}

function ReportRow({ row, visitorType, requiredVisits }: { row: VisitReportRow; visitorType: VisitorType; requiredVisits: number }) {
    const groupLabel = visitorType === 'student' ? [row.year_level, row.section].filter(Boolean).join(' - ') || '-' : row.department || '-';
    const GroupIcon = visitorType === 'student' ? GraduationCap : BriefcaseBusiness;

    return (
        <TableRow>
            <TableCell className="font-medium text-[#010440]">{row.school_id}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>
                <span className="inline-flex items-center gap-2">
                    <GroupIcon className="size-4 text-[#040DBF]" />
                    {groupLabel}
                </span>
            </TableCell>
            <TableCell className="font-semibold text-[#010440]">
                {row.visit_count}
                <span className="font-normal text-[#020659]/60"> / {requiredVisits}</span>
            </TableCell>
            <TableCell className="min-w-48">
                <div className="flex items-center gap-3">
                    <ProgressBar value={row.progress_percent} className="min-w-28 flex-1" />
                    <span className="w-10 text-right text-sm font-medium text-[#020659]">{row.progress_percent}%</span>
                </div>
            </TableCell>
            <TableCell>{row.last_visit_at ?? '-'}</TableCell>
        </TableRow>
    );
}

function ReportSortableHead({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: ReportSortColumn;
    label: string;
    sort: ReportSortColumn | null;
    direction: SortDirection;
    onSortChange: (column: ReportSortColumn) => void;
}) {
    const active = sort === column;
    const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <TableHead>
            <button type="button" onClick={() => onSortChange(column)} className="inline-flex items-center gap-1.5 hover:text-[#010440]">
                {label}
                <Icon className="size-3.5" />
            </button>
        </TableHead>
    );
}

function sortReportRows(
    rows: VisitReportRow[],
    column: ReportSortColumn | null,
    direction: SortDirection,
    visitorType: VisitorTypeFilter,
): VisitReportRow[] {
    if (!column) {
        return rows;
    }

    return [...rows].sort((first, second) => {
        const firstValue = reportSortValue(first, column, visitorType);
        const secondValue = reportSortValue(second, column, visitorType);
        const result = compareReportValues(firstValue, secondValue);

        return direction === 'asc' ? result : result * -1;
    });
}

function reportSortValue(row: VisitReportRow, column: ReportSortColumn, visitorType: VisitorTypeFilter) {
    if (column === 'group') {
        return visitorType === 'student' ? [row.year_level, row.section].filter(Boolean).join(' ') : (row.department ?? '');
    }

    return row[column] ?? '';
}

function compareReportValues(first: string | number | boolean, second: string | number | boolean) {
    if (typeof first === 'number' && typeof second === 'number') {
        return first - second;
    }

    return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' });
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
    return (
        <div className={cn('h-2 overflow-hidden rounded-full bg-[#040DBF]/10', className)}>
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
        </div>
    );
}

function ExportButton({ href, label, icon: Icon, external = false }: { href: string; label: string; icon: typeof Download; external?: boolean }) {
    return (
        <Button asChild variant="outline" size="sm">
            <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
                <Icon className="size-4" />
                {label}
            </a>
        </Button>
    );
}

function toSearchParams(query: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams();

    Object.entries(cleanQuery(query)).forEach(([key, value]) => {
        params.set(key, String(value));
    });

    return params;
}

function cleanQuery(query: Record<string, string | number | null | undefined>) {
    return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== null && value !== undefined));
}

function ReportResultsSkeleton() {
    return (
        <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading report results">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="admin-page-loading-surface p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-3">
                                <span className="admin-page-loading-line h-3 w-24" />
                                <span className="admin-page-loading-line h-9 w-16" />
                            </div>
                            <span className="admin-page-loading-icon" />
                        </div>
                        <span className="admin-page-loading-line mt-4 h-3 w-32 max-w-full" />
                    </div>
                ))}
            </section>

            <section className="admin-page-loading-surface p-5">
                <span className="admin-page-loading-line h-5 w-48 max-w-full" />
                <span className="admin-page-loading-line mt-3 h-3 w-64 max-w-full" />
                <span className="admin-page-loading-line mt-5 h-2 w-full" />
            </section>

            <section className="admin-page-loading-surface overflow-hidden">
                <div className="grid min-w-250 grid-cols-7 gap-4 border-b border-[#040DBF]/10 bg-[#f6f8ff]/70 px-5 py-4">
                    {Array.from({ length: 7 }).map((_, index) => (
                        <span key={index} className="admin-page-loading-line h-3 w-20 max-w-full" />
                    ))}
                </div>
                {Array.from({ length: 7 }).map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className="grid min-h-16 min-w-250 grid-cols-7 items-center gap-4 border-b border-[#040DBF]/10 px-5 py-3 last:border-b-0"
                    >
                        {Array.from({ length: 7 }).map((_, columnIndex) => (
                            <span
                                key={columnIndex}
                                className={`admin-page-loading-line h-3 ${columnIndex % 3 === 0 ? 'w-24' : columnIndex % 3 === 1 ? 'w-16' : 'w-32'} max-w-full`}
                            />
                        ))}
                    </div>
                ))}
            </section>
        </>
    );
}

const reportMonthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
const reportMonthOptions = Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: reportMonthFormatter.format(new Date(2026, month, 1)),
}));

function inferDateRangeMode(schoolYear: VisitReportSchoolYear | null, startDate: string, endDate: string): DateRangeMode {
    const bounds = getSchoolYearBounds(schoolYear);

    if (!bounds) {
        return 'custom';
    }

    if (startDate === bounds.start && endDate === bounds.end) {
        return 'school_year';
    }

    return 'custom';
}

function getSchoolYearBounds(schoolYear: VisitReportSchoolYear | null) {
    if (!schoolYear) {
        return null;
    }

    return {
        start: dateOnly(schoolYear.starts_at),
        end: dateOnly(schoolYear.ends_at),
    };
}

function summarizeDateRange(startDate: string, endDate: string) {
    if (!startDate && !endDate) {
        return 'Choose a custom start and end date';
    }

    if (startDate && !endDate) {
        return `${formatDisplayDate(startDate)} to choose end date`;
    }

    if (!startDate && endDate) {
        return `Choose start date to ${formatDisplayDate(endDate)}`;
    }

    if (startDate === endDate) {
        return formatDisplayDate(startDate);
    }

    return `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`;
}

function dateOnly(value: VisitReportSchoolYear['starts_at']) {
    return value.slice(0, 10);
}

function parseReportIsoDate(value?: string) {
    if (!value) {
        return null;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return null;
    }

    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }

    return date;
}

function startOfReportMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function reportMonthStartLimit(date: Date | null) {
    return date ? startOfReportMonth(date) : null;
}

function buildReportCalendarDays(month: Date) {
    const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());

    return Array.from(
        { length: 42 },
        (_, index) => new Date(firstVisibleDay.getFullYear(), firstVisibleDay.getMonth(), firstVisibleDay.getDate() + index),
    );
}

function buildReportYearOptions(minDate: Date | null, maxDate: Date | null, visibleMonth: Date) {
    const firstYear = minDate?.getFullYear() ?? visibleMonth.getFullYear();
    const lastYear = maxDate?.getFullYear() ?? visibleMonth.getFullYear();

    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index);
}

function isReportDateInRange(date: Date, minDate: Date | null, maxDate: Date | null) {
    const candidate = startOfReportDay(date);

    if (minDate && candidate < startOfReportDay(minDate)) {
        return false;
    }

    if (maxDate && candidate > startOfReportDay(maxDate)) {
        return false;
    }

    return true;
}

function isReportMonthInRange(month: number, year: number, minDate: Date | null, maxDate: Date | null) {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    if (minDate && monthEnd < startOfReportMonth(minDate)) {
        return false;
    }

    if (maxDate && monthStart > startOfReportMonth(maxDate)) {
        return false;
    }

    return true;
}

function clampReportDate(date: Date, minDate: Date | null, maxDate: Date | null) {
    if (minDate && date < minDate) {
        return new Date(minDate);
    }

    if (maxDate && date > maxDate) {
        return new Date(maxDate);
    }

    return new Date(date);
}

function startOfReportDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameReportDay(first: Date, second: Date) {
    return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
}

function toReportIsoDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
