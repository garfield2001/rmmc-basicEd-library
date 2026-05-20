export interface SchoolYearForm {
    [key: string]: string | number | boolean;
    starts_at: string;
    ends_at: string;
    student_required_visits: number | '';
    employee_required_visits: number | '';
    transfer_employees: boolean;
    confirmed_transition: boolean;
}

export type SchoolYearFormErrors = Partial<Record<keyof SchoolYearForm, string>>;

export const emptySchoolYearForm: SchoolYearForm = {
    starts_at: '',
    ends_at: '',
    student_required_visits: '',
    employee_required_visits: '',
    transfer_employees: false,
    confirmed_transition: false,
};
