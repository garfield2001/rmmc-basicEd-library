import type { AuthUser } from './auth';
import type { DashboardVisit } from './dashboard';
import type { SchoolYearRow } from './school-year';

export interface SharedData {
    name: string;
    schoolYear: SchoolYearRow | null;
    schoolYears: SchoolYearRow[];
    auth: {
        user: AuthUser | null;
    };
    flash: {
        success?: string;
        recentVisit?: DashboardVisit | null;
    };
    [key: string]: unknown;
}
