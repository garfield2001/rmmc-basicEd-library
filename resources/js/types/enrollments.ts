import type { LibraryMemberRow } from './members';
import type { Paginated } from './pagination';

export type EnrollmentStatus = 'enrolled' | 'pending' | 'retained' | 'not_enrolled' | 'stopped' | 'transferred' | 'graduated';

export interface SchoolYearOption {
    id: number;
    name: string;
    is_active: boolean;
}

export interface RosterPreviewStudent {
    id: number;
    schoolId: string;
    name: string;
    isActive: boolean;
    sourceYearLevel: string | null;
    sourceSection: string | null;
    targetYearLevel: string | null;
    targetSection: string | null;
    alreadyPlaced: boolean;
    isDemotion: boolean;
}

export interface RosterPlacementPreview {
    inputCount: number;
    uniqueCount: number;
    matchedCount: number;
    assignableCount: number;
    targetYearLevel: string;
    targetSection: string | null;
    memberIds: number[];
    matchedStudents: RosterPreviewStudent[];
    notFoundIds: string[];
    duplicateIds: string[];
    alreadyPlaced: RosterPreviewStudent[];
    inactiveStudents: RosterPreviewStudent[];
    demotionStudents: RosterPreviewStudent[];
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
