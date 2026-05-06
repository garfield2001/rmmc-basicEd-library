import { VISIT_SCAN_ERROR_MODAL_AUTO_CLOSE_SECONDS } from '@/config/timing';
import type { DashboardVisit } from '@/types/dashboard';
import { useEffect, useState } from 'react';

export function useScanErrorDialog(scanValidationError: string | undefined, recentVisit: DashboardVisit | null | undefined) {
    const [isOpen, setIsOpen] = useState(false);
    const [countdown, setCountdown] = useState(VISIT_SCAN_ERROR_MODAL_AUTO_CLOSE_SECONDS);

    useEffect(() => {
        if (scanValidationError) {
            setIsOpen(true);
        }
    }, [scanValidationError]);

    useEffect(() => {
        if (recentVisit) {
            setIsOpen(false);
        }
    }, [recentVisit]);

    useEffect(() => {
        if (!isOpen || !scanValidationError) {
            return;
        }

        setCountdown(VISIT_SCAN_ERROR_MODAL_AUTO_CLOSE_SECONDS);

        const closeTimer = window.setTimeout(() => setIsOpen(false), VISIT_SCAN_ERROR_MODAL_AUTO_CLOSE_SECONDS * 1000);
        const countdownTimer = window.setInterval(() => {
            setCountdown((currentCountdown) => Math.max(currentCountdown - 1, 1));
        }, 1000);

        return () => {
            window.clearTimeout(closeTimer);
            window.clearInterval(countdownTimer);
        };
    }, [isOpen, scanValidationError]);

    return {
        isOpen,
        setIsOpen,
        countdown,
    };
}
