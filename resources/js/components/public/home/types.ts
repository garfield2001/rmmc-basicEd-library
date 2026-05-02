import type { PublicDashboard } from '@/types';

export interface IndexProps {
    dashboard: PublicDashboard;
}

export interface LoginForm {
    [key: string]: string;
    email: string;
    password: string;
}

export interface ScanForm {
    [key: string]: string;
    rfid_uid: string;
}
