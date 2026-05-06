import type { AuthUser } from './auth';
import type { DashboardVisit } from './dashboard';
import type { SchoolYearSummary } from './school-year';

export interface SharedData {
    name: string;
    schoolYear: SchoolYearSummary | null;
    auth: {
        user: AuthUser | null;
    };
    flash: {
        success?: string;
        recentVisit?: DashboardVisit | null;
    };
    [key: string]: unknown;
}
