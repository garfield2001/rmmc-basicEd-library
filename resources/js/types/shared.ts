import type { AuthUser } from './auth';
import type { DashboardVisit } from './dashboard';
import type { LibraryMemberImportSummary } from './registered-visitors';
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
        error?: string;
        recentVisit?: DashboardVisit | null;
        importSummary?: LibraryMemberImportSummary | null;
    };
    [key: string]: unknown;
}
