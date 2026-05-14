import type { SchoolYearSummary } from './school-year';

export interface HomePageData {
    schoolYear: SchoolYearSummary | null;
    scanSettings: {
        repeat_scan_interval_hours: number;
        scan_starts_at: string;
        scan_ends_at: string;
        success_modal_close_seconds: number;
        error_modal_close_seconds: number;
        scanner_cooldown_seconds: number;
    };
    metrics: {
        students: number;
        employees: number;
        visitsToday: number;
        studentVisitsToday: number;
        employeeVisitsToday: number;
        visitsThisSchoolYear: number;
    };
}
