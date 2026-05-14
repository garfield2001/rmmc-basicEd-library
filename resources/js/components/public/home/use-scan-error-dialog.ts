import type { DashboardVisit } from '@/types/dashboard';
import { useEffect, useState } from 'react';

export function useScanErrorDialog(
    scanValidationError: string | undefined,
    recentVisit: DashboardVisit | null | undefined,
    closeAfterSeconds: number,
) {
    const [isOpen, setIsOpen] = useState(false);
    const [countdown, setCountdown] = useState(closeAfterSeconds);

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

        setCountdown(closeAfterSeconds);

        const closeTimer = window.setTimeout(() => setIsOpen(false), closeAfterSeconds * 1000);
        const countdownTimer = window.setInterval(() => {
            setCountdown((currentCountdown) => Math.max(currentCountdown - 1, 1));
        }, 1000);

        return () => {
            window.clearTimeout(closeTimer);
            window.clearInterval(countdownTimer);
        };
    }, [closeAfterSeconds, isOpen, scanValidationError]);

    return {
        isOpen,
        setIsOpen,
        countdown,
    };
}
