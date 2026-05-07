import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    from: number;
    to: number;
    total: number;
    rowsPerPage?: number;
    rowsPerPageOptions?: number[];
    onPrevious: () => void;
    onNext: () => void;
    onRowsPerPageChange?: (rows: number) => void;
}

export function PaginationControls({
    currentPage,
    totalPages,
    from,
    to,
    total,
    rowsPerPage,
    rowsPerPageOptions = [10, 30, 50, 100],
    onPrevious,
    onNext,
    onRowsPerPageChange,
}: PaginationControlsProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-[#040DBF]/10 px-5 py-4 text-sm text-[#020659]/70 sm:flex-row sm:items-center sm:justify-between">
            <span>
                Showing {total === 0 ? 0 : from}-{to} of {total}
            </span>
            <div className="flex flex-wrap items-center gap-2">
                {rowsPerPage && onRowsPerPageChange && (
                    <select
                        value={rowsPerPage}
                        onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
                        className="h-9 rounded-lg border border-[#040DBF]/15 bg-white px-2 text-sm font-medium text-[#020659] outline-none focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10"
                    >
                        {rowsPerPageOptions.map((rows) => (
                            <option key={rows} value={rows}>
                                {rows} rows
                            </option>
                        ))}
                    </select>
                )}
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#040DBF]/15 bg-white px-3 font-medium text-[#020659] disabled:cursor-not-allowed disabled:opacity-45"
                >
                    <ChevronLeft className="size-4" />
                    Previous
                </button>
                <span className="px-2 font-medium text-[#010440]">
                    {currentPage} / {totalPages}
                </span>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#040DBF]/15 bg-white px-3 font-medium text-[#020659] disabled:cursor-not-allowed disabled:opacity-45"
                >
                    Next
                    <ChevronRight className="size-4" />
                </button>
            </div>
        </div>
    );
}
