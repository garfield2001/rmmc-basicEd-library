import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VisitorsIndexFilterOptions, VisitorsIndexFilters, VisitorType } from './visitors-index-types';
import { defaultSortForVisitorType, visitorIndexQuery } from './visitors-query';

export function useVisitorsTableControls(
    filters: VisitorsIndexFilters,
    filterOptions: VisitorsIndexFilterOptions,
    pagePath = '/admin/registered-visitors',
) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [yearLevel, setYearLevel] = useState(filters.year_level ?? '');
    const [section, setSection] = useState(filters.section ?? '');
    const [department, setDepartment] = useState(filters.department ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'created_at');
    const [direction, setDirection] = useState<'asc' | 'desc'>(filters.direction === 'asc' ? 'asc' : 'desc');
    const [perPage, setPerPage] = useState<RowsPerPageOption>(filters.per_page ?? 5);
    const [tableLoading, setTableLoading] = useState(false);
    const loadingTimerRef = useRef<number | null>(null);
    const activeType: VisitorType = filters.type === 'employee' ? 'employee' : 'student';
    const availableSections = useMemo(
        () => (yearLevel ? (filterOptions.sectionsByYearLevel[yearLevel] ?? []) : []),
        [filterOptions.sectionsByYearLevel, yearLevel],
    );

    const startTableLoading = useCallback(() => {
        if (loadingTimerRef.current) {
            window.clearTimeout(loadingTimerRef.current);
        }

        loadingTimerRef.current = window.setTimeout(() => setTableLoading(true), 250);
    }, []);

    const stopTableLoading = useCallback(() => {
        if (loadingTimerRef.current) {
            window.clearTimeout(loadingTimerRef.current);
            loadingTimerRef.current = null;
        }

        setTableLoading(false);
    }, []);

    const requestVisitors = useCallback(
        (
            type: VisitorType,
            nextSearch: string,
            nextYearLevel: string,
            nextSection: string,
            nextDepartment: string,
            nextPerPage: RowsPerPageOption,
            nextSort = sort,
            nextDirection = direction,
            showLoading = true,
            nextPage = 1,
        ) => {
            if (showLoading) {
                startTableLoading();
            }
            router.get(
                pagePath,
                visitorIndexQuery(
                    type,
                    {
                        search: nextSearch,
                        yearLevel: nextYearLevel,
                        section: nextSection,
                        department: nextDepartment,
                        sort: nextSort,
                        direction: nextDirection,
                        perPage: nextPerPage,
                    },
                    nextPage,
                ),
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => showLoading && stopTableLoading(),
                },
            );
        },
        [direction, pagePath, sort, startTableLoading, stopTableLoading],
    );

    useEffect(() => () => loadingTimerRef.current && window.clearTimeout(loadingTimerRef.current), []);

    useEffect(() => {
        if (activeType === 'student' && yearLevel && availableSections.length === 1 && section !== availableSections[0]) {
            setSection(availableSections[0]);
        }
    }, [activeType, availableSections, section, yearLevel]);

    useEffect(() => {
        if (activeType === 'employee' && filterOptions.departments.length === 1 && department !== filterOptions.departments[0]) {
            setDepartment(filterOptions.departments[0]);
        }
    }, [activeType, department, filterOptions.departments]);

    useEffect(() => {
        const normalizedSection = yearLevel ? section : '';
        const matchesFilters =
            filters.search === search &&
            filters.year_level === yearLevel &&
            filters.section === normalizedSection &&
            filters.department === department &&
            filters.type === activeType &&
            filters.sort === sort &&
            filters.direction === direction &&
            filters.per_page === perPage;

        if (!matchesFilters) {
            const filterTimer = window.setTimeout(() => {
                requestVisitors(activeType, search, yearLevel, normalizedSection, department, perPage);
            }, 300);

            return () => window.clearTimeout(filterTimer);
        }
    }, [activeType, filters, perPage, requestVisitors, search, section, department, sort, direction, yearLevel]);

    const changeSort = (column: string) => {
        const nextDirection = sort === column && direction === 'asc' ? 'desc' : 'asc';

        setSort(column);
        setDirection(nextDirection);
        requestVisitors(activeType, search, yearLevel, section, department, perPage, column, nextDirection);
    };

    return {
        activeType,
        availableSections,
        tableLoading,
        fields: { search, yearLevel, section, department, sort, direction, perPage },
        setters: { setSearch, setPerPage },
        changeYearLevel: (value: string) => {
            setYearLevel(value);
            setSection('');
            setSearch('');
        },
        changeSection: (value: string) => {
            setSection(value);
            setSearch('');
        },
        changeDepartment: (value: string) => {
            setDepartment(value);
            setSearch('');
        },
        changeSort,
        clearSort: () => {
            const defaultSort = activeType === 'student' ? 'year_level' : 'created_at';

            setSort(defaultSort);
            setDirection('desc');
            requestVisitors(activeType, search, yearLevel, section, department, perPage, defaultSort, 'desc');
        },
        changeType: (type: VisitorType) => {
            const nextSort = defaultSortForVisitorType(type, sort);
            const nextDirection = nextSort === 'created_at' || nextSort === 'year_level' ? 'desc' : direction;

            setSort(nextSort);
            setDirection(nextDirection);
            requestVisitors(type, search, yearLevel, section, department, perPage, nextSort, nextDirection);
        },
        requestPage: (page: number) => requestVisitors(activeType, search, yearLevel, section, department, perPage, sort, direction, true, page),
        visitUrl: (url: string | null | undefined) => {
            if (url) {
                startTableLoading();
                router.visit(url, { preserveScroll: true, preserveState: true, onFinish: stopTableLoading });
            }
        },
    };
}
