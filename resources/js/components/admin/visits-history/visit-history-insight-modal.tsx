import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaginationControls, type RowsPerPageOption } from '@/components/ui/pagination-controls';
import { useEffect, useMemo, useState } from 'react';
import { formatVisitDateTime, type VisitorTypeFilter, type VisitorWithRangeVisits } from './visit-history-helpers';
import type { ActivityInsight, GroupInsight } from './visit-history-insights';

export type InsightModalState = { kind: 'activity' } | { kind: 'group'; group: GroupInsight };

export function VisitInsightModal({
    modal,
    visitors,
    visitorType,
    activity,
    onOpenChange,
}: {
    modal: InsightModalState | null;
    visitors: VisitorWithRangeVisits[];
    visitorType: VisitorTypeFilter;
    activity: ActivityInsight[];
    onOpenChange: (open: boolean) => void;
}) {
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageOption>(5);
    const rows = useMemo(() => insightRows(modal, visitors, visitorType), [modal, visitorType, visitors]);
    const totalPages = rowsPerPage === 'all' ? 1 : Math.max(1, Math.ceil(rows.length / rowsPerPage));
    const visibleRows = rowsPerPage === 'all' ? rows : rows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    useEffect(() => setPage(1), [modal, rowsPerPage]);
    useEffect(() => setPage((current) => Math.min(current, totalPages)), [totalPages]);

    return (
        <Dialog open={Boolean(modal)} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden sm:max-w-5xl" onOpenAutoFocus={(event) => event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#010440]">{modal?.kind === 'group' ? modal.group.label : 'Visit activity'}</DialogTitle>
                    <DialogDescription>
                        {modal?.kind === 'group'
                            ? `${rows.length.toLocaleString()} visitor${rows.length === 1 ? '' : 's'} in this group.`
                            : `${activity.length.toLocaleString()} activity bucket${activity.length === 1 ? '' : 's'} from the selected filters.`}
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-hidden rounded-lg border border-[#040DBF]/10">
                    <div className="admin-contained-scroll max-h-[min(58vh,34rem)] overflow-auto overscroll-contain">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="sticky top-0 z-10 border-b border-[#040DBF]/10 bg-white text-[#020659]/70">
                                <tr>
                                    <th className="px-4 py-3">Name</th>
                                    <th className="px-4 py-3">{visitorType === 'student' ? 'Year / section' : 'Department'}</th>
                                    <th className="px-4 py-3">Visits</th>
                                    <th className="px-4 py-3">Latest / timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRows.length > 0 ? (
                                    visibleRows.map((row) => <InsightModalRow key={row.key} row={row} />)
                                ) : (
                                    <InsightModalEmptyRow />
                                )}
                            </tbody>
                        </table>
                    </div>
                    <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        from={rows.length === 0 ? 0 : rowsPerPage === 'all' ? 1 : (page - 1) * rowsPerPage + 1}
                        to={rowsPerPage === 'all' ? rows.length : Math.min(rows.length, page * rowsPerPage)}
                        total={rows.length}
                        rowsPerPage={rowsPerPage}
                        rowsPerPageOptions={[5, 15, 30, 'all']}
                        onRowsPerPageChange={setRowsPerPage}
                        onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                        onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
                        onPageChange={(nextPage) => setPage(Math.min(totalPages, Math.max(1, nextPage)))}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

function insightRows(modal: InsightModalState | null, visitors: VisitorWithRangeVisits[], visitorType: VisitorTypeFilter) {
    if (!modal) {
        return [];
    }

    if (modal.kind === 'activity') {
        return visitors.flatMap((visitor) =>
            visitor.rangeVisits.map((visit) => ({
                key: `${visitor.id}-${visit.id}`,
                name: visitor.name ?? '-',
                group:
                    visitorType === 'student' ? [visitor.yearLevel, visitor.section].filter(Boolean).join(' - ') || '-' : visitor.department || '-',
                visits: visitor.rangeVisits.length,
                lastVisit: formatVisitDateTime(visit.visitedAt),
            })),
        );
    }

    return visitors
        .filter((visitor) =>
            visitorType === 'student'
                ? (visitor.yearLevel ?? '') === modal.group.yearLevel && (visitor.section ?? '') === modal.group.section
                : (visitor.department ?? '') === modal.group.department,
        )
        .map((visitor) => ({
            key: String(visitor.id),
            name: visitor.name ?? '-',
            group: modal.group.label,
            visits: visitor.rangeVisits.length,
            lastVisit: formatVisitDateTime(visitor.rangeVisits[0]?.visitedAt),
        }));
}

type InsightRow = ReturnType<typeof insightRows>[number];

function InsightModalRow({ row }: { row: InsightRow }) {
    return (
        <tr className="border-b border-[#040DBF]/5 last:border-0">
            <td className="px-4 py-3 font-semibold text-[#010440]">{row.name}</td>
            <td className="px-4 py-3 text-[#020659]/70">{row.group}</td>
            <td className="px-4 py-3 font-semibold text-[#010440]">{row.visits}</td>
            <td className="px-4 py-3 text-[#020659]/70">{row.lastVisit}</td>
        </tr>
    );
}

function InsightModalEmptyRow() {
    return (
        <tr>
            <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#020659]/70">
                No details available for this view.
            </td>
        </tr>
    );
}
