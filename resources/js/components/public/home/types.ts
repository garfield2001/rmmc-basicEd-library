import type { HomePageData } from '@/types';

export interface IndexProps {
    home: HomePageData;
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
