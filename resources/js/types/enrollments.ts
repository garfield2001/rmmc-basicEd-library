import type { LibraryMemberRow } from './members';
import type { Paginated } from './pagination';

export type EnrollmentStatus = 'enrolled' | 'pending' | 'retained' | 'not_enrolled' | 'stopped' | 'transferred' | 'graduated';

export interface SchoolYearOption {
    id: number;
    name: string;
    is_active: boolean;
}

export interface StudentEnrollmentPageProps {
    students: Paginated<LibraryMemberRow>;
    schoolYears: SchoolYearOption[];
    filters: {
        source_school_year_id: number;
        target_school_year_id: number;
        search: string;
        source_year_level: string;
        source_section: string;
        source_member_status: string;
        per_page: number;
        sort: string;
        direction: 'asc' | 'desc';
    };
    options: {
        yearLevels: string[];
        sourceSectionsByYearLevel: Record<string, string[]>;
        targetSectionsByYearLevel: Record<string, string[]>;
        hasDistinctSchoolYears: boolean;
    };
}
