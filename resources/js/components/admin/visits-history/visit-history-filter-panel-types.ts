import type { AdminVisitHistory } from '@/types/dashboard';
import type { SortColumn, SortDirection, VisitLogStatusFilter, VisitorTypeFilter } from './visit-history-helpers';

export interface VisitHistoryFilterPanelProps {
    filters: AdminVisitHistory['filters'];
    schoolYearName?: string | null;
    schoolYearStart: string;
    schoolYearEnd: string;
    startDate: string;
    endDate: string;
    visitorType: VisitorTypeFilter;
    yearLevel: string;
    section: string;
    department: string;
    search: string;
    logStatus?: VisitLogStatusFilter;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onResetDateCoverage: () => void;
    onYearLevelChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onSearchChange: (value: string) => void;
    onLogStatusChange?: (value: VisitLogStatusFilter) => void;
    onQuickSortChange: (value: string) => void;
    onClearFilters?: () => void;
    showVisitStatusFilter?: boolean;
    showTableControls?: boolean;
    framed?: boolean;
}
