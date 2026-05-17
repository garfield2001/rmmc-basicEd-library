import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { SelectInput } from './select-input';

export type RowsPerPageOption = number | 'all';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    from: number;
    to: number;
    total: number;
    rowsPerPage?: RowsPerPageOption;
    rowsPerPageOptions?: RowsPerPageOption[];
    onPrevious: () => void;
    onNext: () => void;
    onPageChange?: (page: number) => void;
    onRowsPerPageChange?: (rows: RowsPerPageOption) => void;
}

export function PaginationControls({
    currentPage,
    totalPages,
    from,
    to,
    total,
    rowsPerPage,
    rowsPerPageOptions = [5, 10, 30, 50, 100],
    onPrevious,
    onNext,
    onPageChange,
    onRowsPerPageChange,
}: PaginationControlsProps) {
    const pageItems = paginationItems(currentPage, totalPages);

    return (
        <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-t border-[#040DBF]/10 px-5 py-4 text-sm text-[#020659]/70">
            <span className="shrink-0">
                Showing {total === 0 ? 0 : from}-{to} of {total}
            </span>
            <div className="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto">
                {rowsPerPage && onRowsPerPageChange && (
                    <div className="w-28 shrink-0">
                        <SelectInput
                            value={rowsPerPage}
                            onChange={(event) => onRowsPerPageChange(event.target.value === 'all' ? 'all' : Number(event.target.value))}
                            className="h-9 py-1 pr-8 pl-2 font-medium text-[#020659]"
                        >
                            {rowsPerPageOptions.map((rows) => (
                                <option key={rows} value={rows}>
                                    {rows === 'all' ? 'See all' : `${rows} rows`}
                                </option>
                            ))}
                        </SelectInput>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => onPageChange?.(1)}
                    disabled={currentPage === 1 || !onPageChange}
                    className={pageButtonClass}
                    title="First page"
                >
                    <ChevronsLeft className="size-4" />
                </button>
                <button
                    type="button"
                    onClick={onPrevious}
                    disabled={currentPage === 1}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#040DBF]/15 bg-white px-3 font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#040DBF]/15 disabled:hover:bg-white disabled:hover:text-[#020659] disabled:hover:shadow-none"
                >
                    <ChevronLeft className="size-4" />
                    Previous
                </button>
                <div className="flex items-center gap-1">
                    {pageItems.map((page, index) =>
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="px-1.5 font-medium text-[#020659]/45">
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                type="button"
                                onClick={() => onPageChange?.(page)}
                                disabled={!onPageChange || page === currentPage}
                                className={`${pageButtonClass} min-w-9 px-2 ${
                                    page === currentPage ? 'border-[#040DBF] bg-[#040DBF] text-white opacity-100' : ''
                                }`}
                            >
                                {page}
                            </button>
                        ),
                    )}
                </div>
                <button
                    type="button"
                    onClick={onNext}
                    disabled={currentPage === totalPages}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#040DBF]/15 bg-white px-3 font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#040DBF]/15 disabled:hover:bg-white disabled:hover:text-[#020659] disabled:hover:shadow-none"
                >
                    Next
                    <ChevronRight className="size-4" />
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange?.(totalPages)}
                    disabled={currentPage === totalPages || !onPageChange}
                    className={pageButtonClass}
                    title="Last page"
                >
                    <ChevronsRight className="size-4" />
                </button>
            </div>
        </div>
    );
}

const pageButtonClass =
    'inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[#040DBF]/15 bg-white px-3 font-medium text-[#020659] transition-[background-color,border-color,color,box-shadow] hover:border-[#040DBF]/25 hover:bg-[#f6f8ff] hover:text-[#010440] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#040DBF]/15 disabled:hover:bg-white disabled:hover:text-[#020659] disabled:hover:shadow-none';

function paginationItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
    if (totalPages <= 4) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3];
    }

    if (currentPage >= totalPages - 2) {
        return ['ellipsis', ...Array.from({ length: 4 }, (_, index) => totalPages - 3 + index).filter((page) => page >= 1)];
    }

    const pages: Array<number | 'ellipsis'> = ['ellipsis'];
    const endPage = Math.min(totalPages, currentPage + 3);

    for (let page = currentPage; page <= endPage; page += 1) {
        pages.push(page);
    }

    return pages;
}
