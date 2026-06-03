import { ProgressBar } from '@/components/admin/reports/report-table-parts';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { SelectInput } from '@/components/ui/select-input';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { VisitorTypeFilter, VisitorWithRangeVisits } from '../visit-logs/visit-logs-helpers';
import { formatVisitDateTime, groupLabel } from '../visit-logs/visit-logs-helpers';
import { matchesDrilldownSearch } from './visit-progress-drilldown-utils';
import { matchesProgressStatus, progressPercent, type ProgressStatusFilter } from './visit-progress-helpers';

export interface VisitProgressDrilldown {
    title: string;
    detail: string;
    visitors: VisitorWithRangeVisits[];
}

interface VisitProgressDrilldownModalProps {
    drilldown: VisitProgressDrilldown | null;
    visitorType: VisitorTypeFilter;
    requiredVisits: number;
    onOpenChange: (open: boolean) => void;
    onVisitorOpen: (visitor: VisitorWithRangeVisits) => void;
}

export function VisitProgressDrilldownModal({
    drilldown,
    visitorType,
    requiredVisits,
    onOpenChange,
    onVisitorOpen,
}: VisitProgressDrilldownModalProps) {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<ProgressStatusFilter>('all');
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageOption>(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [highlightedVisitorId, setHighlightedVisitorId] = useState<number | null>(null);
    const rows = useMemo(
        () =>
            [...(drilldown?.visitors ?? [])]
                .filter((visitor) => matchesDrilldownSearch(visitor, search))
                .filter((visitor) => matchesProgressStatus(visitor, requiredVisits, status))
                .sort(
                    (first, second) =>
                        progressPercent(first, requiredVisits) - progressPercent(second, requiredVisits) ||
                        first.rangeVisits.length - second.rangeVisits.length ||
                        (first.name ?? '').localeCompare(second.name ?? ''),
                ),
        [drilldown?.visitors, requiredVisits, search, status],
    );
    const groupHeader = visitorType === 'student' ? 'Year / section' : 'Department';
    const totalPages = rowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / rowsPerPage));
    const visibleRows = rowsPerPage === 'all' ? rows : rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const from = rows.length === 0 ? 0 : rowsPerPage === 'all' ? 1 : (currentPage - 1) * rowsPerPage + 1;
    const to = rowsPerPage === 'all' ? rows.length : Math.min(rows.length, currentPage * rowsPerPage);

    useEffect(() => {
        setSearch('');
        setStatus('all');
        setRowsPerPage(5);
        setCurrentPage(1);
        setHighlightedVisitorId(null);
    }, [drilldown]);

    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, search, status]);

    useEffect(() => {
        setCurrentPage((page) => Math.min(page, totalPages));
    }, [totalPages]);

    const openVisitor = (visitor: VisitorWithRangeVisits) => {
        setHighlightedVisitorId(visitor.id);
        window.setTimeout(() => setHighlightedVisitorId((current) => (current === visitor.id ? null : current)), 3500);
        onVisitorOpen(visitor);
    };

    return (
        <Dialog open={Boolean(drilldown)} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden sm:max-w-6xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#010440]">{drilldown?.title ?? 'Progress details'}</DialogTitle>
                    <DialogDescription>{drilldown?.detail ?? 'People matching this progress view.'}</DialogDescription>
                </DialogHeader>

                <div className="overflow-hidden rounded-lg border border-[#040DBF]/10">
                    <div className="grid gap-3 border-b border-[#040DBF]/10 bg-[#f6f8ff] px-4 py-3 lg:grid-cols-[minmax(0,1fr)_12rem_18rem] lg:items-end">
                        <div>
                            <p className="text-sm font-semibold text-[#010440]">{rows.length.toLocaleString()} matching visitor{rows.length === 1 ? '' : 's'}</p>
                            <p className="mt-1 text-xs font-medium text-[#020659]/70">Click a row to open exact visit timestamps. The drilldown stays open behind it.</p>
                        </div>
                        <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                            Progress
                            <SelectInput value={status} onChange={(event) => setStatus(event.target.value as ProgressStatusFilter)}>
                                <option value="all">All progress</option>
                                <option value="in-progress">In progress</option>
                                <option value="complete">Complete</option>
                                <option value="no-visits">No visits</option>
                            </SelectInput>
                        </label>
                        <label className="grid gap-1 text-xs font-semibold text-[#030A8C]">
                            Search
                            <span className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#030A8C]/50" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={visitorType === 'student' ? 'Search ID, name, section' : 'Search ID, name, department'}
                                    className="h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white pr-9 pl-9 text-sm font-normal text-[#010440] transition outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[#030A8C]/50 transition hover:bg-[#040DBF]/5 hover:text-[#010440]"
                                        title="Clear search"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </span>
                        </label>
                    </div>
                    <div className="admin-contained-scroll max-h-[min(58vh,34rem)] overflow-auto overscroll-contain">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="sticky top-0 z-10 border-b border-[#040DBF]/10 bg-white text-[#020659]/70">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">{groupHeader}</th>
                                    <th className="px-4 py-3">Visits</th>
                                    <th className="px-4 py-3">Last visit</th>
                                    <th className="px-4 py-3">Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.map((visitor) => {
                                    const percent = progressPercent(visitor, requiredVisits);

                                    return (
                                        <tr
                                            key={visitor.id}
                                            tabIndex={0}
                                            onClick={() => openVisitor(visitor)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    openVisitor(visitor);
                                                }
                                            }}
                                            className={`cursor-pointer border-b border-[#040DBF]/5 last:border-0 transition-colors hover:bg-[#f6f8ff] focus-visible:bg-[#f6f8ff] focus-visible:outline-none ${
                                                highlightedVisitorId === visitor.id ? 'bg-amber-50' : ''
                                            }`}
                                        >
                                            <td className="px-4 py-3 font-semibold text-[#010440]">{visitor.name ?? '-'}</td>
                                            <td className="px-4 py-3 text-[#020659]/70">{groupLabel(visitor)}</td>
                                            <td className="px-4 py-3 font-semibold text-[#010440]">
                                                {visitor.rangeVisits.length}/{requiredVisits}
                                            </td>
                                            <td className="px-4 py-3 text-[#020659]/70">{formatVisitDateTime(visitor.rangeVisits[0]?.visitedAt)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <ProgressBar value={percent} className="min-w-28 flex-1" />
                                                    <span className="w-12 text-right font-semibold text-[#010440]">{percent}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {visibleRows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#020659]/70">
                                            No visitors match this progress view.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        from={from}
                        to={to}
                        total={rows.length}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={[5, 15, 30, 'all']}
                        onRowsPerPageChange={setRowsPerPage}
                        onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        onPageChange={(page) => setCurrentPage(Math.min(totalPages, Math.max(1, page)))}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
