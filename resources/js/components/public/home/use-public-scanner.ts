import { useRFIDScanListener } from '@/hooks/use-rfid-scan-listener';
import { router } from '@inertiajs/react';
import { type FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import type { ScanForm } from './types';
import { useBlockedPublicScannerInput } from './use-blocked-public-scanner-input';

interface UsePublicScannerOptions {
    enabled: boolean;
    cooldownSeconds: number;
    onScanStart?: () => void;
    onScanError: () => void;
}

export function usePublicScanner({ enabled, cooldownSeconds, onScanStart, onScanError }: UsePublicScannerOptions) {
    const [data, setData] = useState<ScanForm>({ rfid_uid: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const submittingRef = useRef(false);
    const preparingRef = useRef(false);
    const readyTimerRef = useRef<number | null>(null);
    const unavailable = isSubmitting || isPreparing;

    const resetScan = useCallback((key?: keyof ScanForm) => {
        setData((currentData) => {
            if (!key) {
                return { rfid_uid: '' };
            }

            return {
                ...currentData,
                [key]: '',
            };
        });
    }, []);

    const releaseScanner = useCallback(() => {
        if (readyTimerRef.current) {
            window.clearTimeout(readyTimerRef.current);
            readyTimerRef.current = null;
        }

        preparingRef.current = false;
        setIsPreparing(false);
        resetScan('rfid_uid');
        inputRef.current?.focus();
    }, [resetScan]);

    const startScannerCooldown = useCallback(() => {
        if (readyTimerRef.current) {
            window.clearTimeout(readyTimerRef.current);
        }

        preparingRef.current = true;
        setIsPreparing(true);
        resetScan('rfid_uid');

        readyTimerRef.current = window.setTimeout(releaseScanner, Math.max(0, cooldownSeconds) * 1000);
    }, [cooldownSeconds, releaseScanner, resetScan]);

    const finishScan = useCallback(() => {
        submittingRef.current = false;
        setIsSubmitting(false);
        startScannerCooldown();
    }, [startScannerCooldown]);

    const startScanSubmission = useCallback(() => {
        onScanStart?.();
        submittingRef.current = true;
        setIsSubmitting(true);
    }, [onScanStart]);

    const recordScan = useCallback(
        (RFIDUid: string) => {
            const normalizedRFIDUid = RFIDUid.trim();

            if (submittingRef.current || preparingRef.current) {
                resetScan('rfid_uid');
                inputRef.current?.focus();
                return;
            }

            if (!normalizedRFIDUid) {
                inputRef.current?.focus();
                return;
            }

            startScanSubmission();

            router.post(
                '/library-visits',
                { rfid_uid: normalizedRFIDUid },
                {
                    preserveScroll: true,
                    onError: (scanErrors) => {
                        if (typeof scanErrors.rfid_uid === 'string') {
                            onScanError();
                        }
                    },
                    onFinish: finishScan,
                },
            );
        },
        [finishScan, onScanError, resetScan, startScanSubmission],
    );

    const submitScan: FormEventHandler = (event) => {
        event.preventDefault();
        recordScan(inputRef.current?.value ?? data.rfid_uid);
    };

    const changeScanData = (RFIDUid: string) => {
        if (unavailable) {
            resetScan('rfid_uid');
            return;
        }

        setData((currentData) => ({
            ...currentData,
            rfid_uid: RFIDUid,
        }));
    };

    useEffect(() => {
        return () => {
            if (readyTimerRef.current) {
                window.clearTimeout(readyTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (enabled) {
            inputRef.current?.focus();
        }
    }, [enabled]);

    useBlockedPublicScannerInput({ enabled, unavailable });

    useRFIDScanListener({
        enabled: enabled && !unavailable,
        onScanStart: startScanSubmission,
        onError: (scanErrors) => {
            if (typeof scanErrors.rfid_uid === 'string') {
                onScanError();
            }
        },
        onFinish: finishScan,
    });

    return {
        data,
        inputRef,
        isSubmitting,
        isPreparing,
        isReady: !unavailable,
        submitScan,
        changeScanData,
    };
}
