import { defaultVisitsPerPage } from '@/components/admin/live-visits/live-visits-table-helpers';
import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import { useEffect, useRef, useState, type MutableRefObject } from 'react';

export function useBriefTablePaging() {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<RowsPerPageOption>(defaultVisitsPerPage);
    const [isPaging, setIsPaging] = useState(false);
    const pagingTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const pagingTimer = pagingTimerRef.current;

        return () => {
            if (pagingTimer) {
                window.clearTimeout(pagingTimer);
            }
        };
    }, []);

    const changeRowsPerPage = (nextRowsPerPage: RowsPerPageOption) => {
        if (nextRowsPerPage !== rowsPerPage) {
            showBriefTableLoading(pagingTimerRef, setIsPaging);
            setRowsPerPage(nextRowsPerPage);
        }
    };

    const changePage = (nextPage: number) => {
        if (nextPage !== currentPage) {
            showBriefTableLoading(pagingTimerRef, setIsPaging);
            setCurrentPage(nextPage);
        }
    };

    return {
        currentPage,
        rowsPerPage,
        isPaging,
        setCurrentPage,
        changeRowsPerPage,
        changePage,
    };
}

function showBriefTableLoading(timerRef: MutableRefObject<number | null>, setIsPaging: (value: boolean) => void) {
    if (timerRef.current) {
        window.clearTimeout(timerRef.current);
    }

    setIsPaging(true);
    timerRef.current = window.setTimeout(() => {
        setIsPaging(false);
        timerRef.current = null;
    }, 180);
}
