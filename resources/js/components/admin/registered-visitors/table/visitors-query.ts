import type { RowsPerPageOption } from '@/components/ui/pagination-controls';
import type { VisitorType } from './visitors-index-types';

export interface VisitorsQueryState {
    search: string;
    yearLevel: string;
    section: string;
    department: string;
    sort: string;
    direction: 'asc' | 'desc';
    perPage: RowsPerPageOption;
}

export function visitorIndexQuery(type: VisitorType, state: VisitorsQueryState, page = 1) {
    return {
        search: state.search || undefined,
        type,
        year_level: type === 'student' ? state.yearLevel || undefined : undefined,
        section: type === 'student' && state.yearLevel ? state.section || undefined : undefined,
        department: type === 'employee' ? state.department || undefined : undefined,
        sort: state.sort === 'created_at' ? undefined : state.sort,
        direction: state.sort === 'created_at' && state.direction === 'desc' ? undefined : state.direction,
        per_page: state.perPage,
        page: page > 1 ? page : undefined,
    };
}

export function defaultSortForVisitorType(type: VisitorType, sort: string) {
    if (type === 'student' && sort === 'department') {
        return 'created_at';
    }

    return type === 'employee' && ['year_level', 'section'].includes(sort) ? 'created_at' : sort;
}
