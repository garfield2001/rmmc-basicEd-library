export interface SchoolYearSummary {
    id: number;
    name: string;
}

export interface SchoolYearRow extends SchoolYearSummary {
    starts_at: string;
    ends_at: string;
    minimum_visits: number;
    target_visits: number;
    is_active: boolean;
}
