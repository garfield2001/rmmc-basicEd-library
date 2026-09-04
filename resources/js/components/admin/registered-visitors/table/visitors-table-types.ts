import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import type { Paginated } from '@/types/pagination';
import type { LibraryMemberRow } from '@/types/registered-visitors';
import type { VisitorDistribution } from './visitors-index-types';

export type VisitorType = 'student' | 'employee';
export type SortDirection = 'asc' | 'desc';
export type ColumnKey = 'visitor' | 'school_id' | 'rfid' | 'year_level' | 'section' | 'department';

export interface ColumnOption {
    key: ColumnKey;
    label: string;
}

export interface VisitorsTableProps {
    visitors: Paginated<LibraryMemberRow>;
    activeType: VisitorType;
    search: string;
    yearLevel: string;
    section: string;
    department: string;
    yearLevels: string[];
    sections: string[];
    departments: string[];
    rowsPerPage: RowsPerPageOption;
    sort: string;
    direction: SortDirection;
    isLoading?: boolean;
    showTypeTabs?: boolean;
    distribution?: VisitorDistribution;
    onSelectCohort?: (cohort: string | null) => void;
    onSearchChange: (value: string) => void;
    onTypeChange: (type: VisitorType) => void;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onRowsPerPageChange: (rows: RowsPerPageOption) => void;
    onSortChange: (column: string) => void;
    onSortClear: () => void;
    onEdit: (visitor: LibraryMemberRow) => void;
    onPrevious: () => void;
    onNext: () => void;
    onPageChange: (page: number) => void;
}
