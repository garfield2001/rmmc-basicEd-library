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
    const defaultSort = type === 'student' ? 'year_level' : 'created_at';
    const defaultDirection = type === 'student' ? 'desc' : 'desc';

    return {
        type,
        search: state.search || undefined,
        year_level: type === 'student' ? state.yearLevel || undefined : undefined,
        section: type === 'student' && state.yearLevel ? state.section || undefined : undefined,
        department: type === 'employee' ? state.department || undefined : undefined,
        sort: state.sort === defaultSort ? undefined : state.sort,
        direction: state.sort === defaultSort && state.direction === defaultDirection ? undefined : state.direction,
        per_page: state.perPage,
        page: page > 1 ? page : undefined,
    };
}

export function defaultSortForVisitorType(type: VisitorType, sort: string) {
    if (type === 'student' && !['name', 'year_level'].includes(sort)) {
        return 'year_level';
    }

    return type === 'employee' && !['name', 'department'].includes(sort) ? 'created_at' : sort;
}
