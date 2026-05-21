import { formatVisitTime, type LiveVisitsTableMode, type VisitTab } from './live-visits-table-helpers';
import { LiveVisitLoadingRows, VisitVisitorCell } from '@/components/admin/live-visits/live-visits-table-ui';
import { TableCell, TableRow } from '@/components/ui/table';
import { VirtualTableSpacerRow } from '@/components/ui/virtual-table-spacer-row';
import type { DashboardVisit } from '@/types/dashboard';

interface LiveVisitsTableRowsProps {
    mode: LiveVisitsTableMode;
    visitTab: VisitTab;
    visits: DashboardVisit[];
    allVisitsCount: number;
    isPaging: boolean;
    columns: number;
    usesVirtualRows: boolean;
    virtualRows: {
        paddingTop: number;
        paddingBottom: number;
    };
    onVisitSelect?: (visit: DashboardVisit) => void;
}

export function LiveVisitsTableRows({
    mode,
    visitTab,
    visits,
    allVisitsCount,
    isPaging,
    columns,
    usesVirtualRows,
    virtualRows,
    onVisitSelect,
}: LiveVisitsTableRowsProps) {
    if (isPaging) {
        return <LiveVisitLoadingRows columns={columns} />;
    }

    if (visits.length === 0) {
        return <LiveVisitsEmptyRow mode={mode} visitsCount={allVisitsCount} columns={columns} />;
    }

    return (
        <>
            {usesVirtualRows && virtualRows.paddingTop > 0 && <VirtualTableSpacerRow height={virtualRows.paddingTop} colSpan={columns} />}
            {visits.map((visit) => (
                <LiveVisitRow key={visit.id} mode={mode} visitTab={visitTab} visit={visit} onVisitSelect={onVisitSelect} />
            ))}
            {usesVirtualRows && virtualRows.paddingBottom > 0 && <VirtualTableSpacerRow height={virtualRows.paddingBottom} colSpan={columns} />}
        </>
    );
}

function LiveVisitRow({
    mode,
    visitTab,
    visit,
    onVisitSelect,
}: {
    mode: LiveVisitsTableMode;
    visitTab: VisitTab;
    visit: DashboardVisit;
    onVisitSelect?: (visit: DashboardVisit) => void;
}) {
    return (
        <TableRow
            onClick={onVisitSelect ? () => onVisitSelect(visit) : undefined}
            tabIndex={onVisitSelect ? 0 : undefined}
            onKeyDown={
                onVisitSelect
                    ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onVisitSelect(visit);
                          }
                      }
                    : undefined
            }
            className={onVisitSelect ? 'cursor-pointer focus-visible:bg-[#f6f8ff] focus-visible:outline-none' : undefined}
        >
            <TableCell className="text-[#030A8C]">{formatVisitTime(visit, mode)}</TableCell>
            <TableCell className="font-medium">{visit.visitor.schoolId}</TableCell>
            <TableCell>
                <VisitVisitorCell visit={visit} />
            </TableCell>
            {visitTab === 'student' ? (
                <>
                    <TableCell className="text-[#020659]/70">{visit.visitor.yearLevel || '-'}</TableCell>
                    <TableCell className="text-[#020659]/70">{visit.visitor.section || '-'}</TableCell>
                </>
            ) : (
                <TableCell className="text-[#020659]/70">{visit.visitor.department || '-'}</TableCell>
            )}
        </TableRow>
    );
}

function LiveVisitsEmptyRow({ mode, visitsCount, columns }: { mode: LiveVisitsTableMode; visitsCount: number; columns: number }) {
    return (
        <TableRow>
            <TableCell colSpan={columns} className="px-5 py-14 text-center">
                <p className="font-medium text-[#010440]">
                    {visitsCount > 0
                        ? 'No records match the selected filter'
                        : mode === 'history'
                          ? 'No visits recorded in the active school year'
                          : 'No RFID visits recorded today'}
                </p>
                <p className="mt-2 text-sm text-[#020659]/70">
                    {visitsCount > 0
                        ? 'Try another filter or search term.'
                        : mode === 'history'
                          ? 'Active school-year visit logs will appear here after visitors scan in.'
                          : 'Scanned student and employee visits will appear here.'}
                </p>
            </TableCell>
        </TableRow>
    );
}
