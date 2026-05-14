export interface SchoolYearSummary {
    id: number;
    name: string;
}

export interface SchoolYearRow extends SchoolYearSummary {
    starts_at: string;
    ends_at: string;
    student_required_visits: number;
    employee_required_visits: number;
    is_active: boolean;
}
