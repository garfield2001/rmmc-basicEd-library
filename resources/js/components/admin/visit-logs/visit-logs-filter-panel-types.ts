export interface VisitLogsFilterPanelProps {
    schoolYearName?: string | null;
    schoolYearStart: string;
    schoolYearEnd: string;
    startDate: string;
    endDate: string;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
    onResetDateCoverage: () => void;
    onClearFilters?: () => void;
    framed?: boolean;
}
