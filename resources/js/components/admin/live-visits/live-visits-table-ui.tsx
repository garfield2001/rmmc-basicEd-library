import { SelectInput } from '@/components/ui/select-input';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { VisitorAvatar } from '@/components/ui/visitor-avatar';
import type { DashboardVisit } from '@/types/dashboard';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { SortColumn, SortDirection } from './live-visits-table-helpers';

export function FilterSelect({
    value,
    options,
    placeholder,
    disabled = false,
    onChange,
}: {
    value: string;
    options: string[];
    placeholder: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <SelectInput
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className="border-[#040DBF]/15 bg-white text-[#020659] focus:border-[#040DBF] focus:ring-[#040DBF]/10"
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </SelectInput>
    );
}

export function SortableHead({
    column,
    label,
    sort,
    direction,
    onSortChange,
}: {
    column: SortColumn;
    label: string;
    sort: SortColumn;
    direction: SortDirection;
    onSortChange: (column: SortColumn) => void;
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

export function LiveVisitLoadingRows({ columns }: { columns: number }) {
    return (
        <>
            {Array.from({ length: 5 }).map((_, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-transparent">
                    {Array.from({ length: columns }).map((_, columnIndex) => (
                        <TableCell key={columnIndex}>
                            <span
                                className={`admin-page-loading-line h-3 ${
                                    columnIndex === 2 ? 'w-36' : columnIndex % 2 === 0 ? 'w-20' : 'w-28'
                                } max-w-full`}
                            />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

export function VisitVisitorCell({ visit }: { visit: DashboardVisit }) {
    return (
        <div className="flex items-center gap-3">
            <VisitorAvatar
                name={visit.visitor.name}
                src={visit.visitor.photoUrl}
                className="live-visit-avatar bg-[#eef2ff] text-[#030A8C]/70 ring-1 ring-[#040DBF]/10"
            />
            <span>{visit.visitor.name}</span>
        </div>
    );
}
