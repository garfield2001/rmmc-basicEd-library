import type { SchoolYearSummary } from './school-year';

export interface HomePageData {
    schoolYear: SchoolYearSummary | null;
    metrics: {
        students: number;
        employees: number;
        visitsToday: number;
        studentVisitsToday: number;
        employeeVisitsToday: number;
        visitsThisSchoolYear: number;
    };
}
