import { TableCell, TableRow } from './table';

export function VirtualTableSpacerRow({ height, colSpan }: { height: number; colSpan: number }) {
    return (
        <TableRow className="border-0 hover:bg-transparent">
            <TableCell colSpan={colSpan} className="p-0" style={{ height }} aria-hidden="true" />
        </TableRow>
    );
}
