import { formatDisplayDate } from '@/components/ui/date-input';
import type { AdminDashboard } from '@/types/dashboard';

export function getSchoolYearDateRange(dashboard: AdminDashboard) {
    if (dashboard.schoolYear?.starts_at && dashboard.schoolYear?.ends_at) {
        return `${formatDisplayDate(dashboard.schoolYear.starts_at)} to ${formatDisplayDate(dashboard.schoolYear.ends_at)}`;
    }

    return 'Set up a school year to start tracking';
}

export function formatTime(time: string) {
    const [hours = '0', minutes = '0'] = time.split(':');
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}
