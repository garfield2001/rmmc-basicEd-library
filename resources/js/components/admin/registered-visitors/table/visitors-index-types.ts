import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import type { Paginated } from '@/types/pagination';
import type { LibraryMemberRow } from '@/types/registered-visitors';

export type VisitorType = 'student' | 'employee';

export interface VisitorsIndexFilters {
    search: string;
    type: VisitorType;
    year_level: string;
    section: string;
    department: string;
    sort: string;
    direction: 'asc' | 'desc';
    per_page: RowsPerPageOption;
}

export interface VisitorsIndexFilterOptions {
    yearLevels: string[];
    sectionsByYearLevel: Record<string, string[]>;
    departments: string[];
}

export interface VisitorDistributionPoint {
    label: string;
    count: number;
}

export interface VisitorDistribution {
    students: {
        yearLevels: VisitorDistributionPoint[];
        sectionsByYearLevel: Record<string, VisitorDistributionPoint[]>;
    };
    employees: {
        departments: VisitorDistributionPoint[];
    };
}

export interface VisitorsIndexProps {
    visitors: Paginated<LibraryMemberRow>;
    audienceType: VisitorType;
    pagePath: string;
    filters: VisitorsIndexFilters;
    filterOptions: VisitorsIndexFilterOptions;
    distribution: VisitorDistribution;
}
