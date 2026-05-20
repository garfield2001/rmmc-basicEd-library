import { PUBLIC_SCANNER_BLOCKED_INPUT_TIMEOUT_MS } from '@/config/timing';
import { useEffect } from 'react';

interface UseBlockedPublicScannerInputOptions {
    enabled: boolean;
    unavailable: boolean;
}

export function useBlockedPublicScannerInput({ enabled, unavailable }: UseBlockedPublicScannerInputOptions) {
    useEffect(() => {
        if (!unavailable || !enabled) {
            return;
        }

        let scanBuffer = '';
        let scanTimer: number | null = null;

        const resetBuffer = () => {
            scanBuffer = '';

            if (scanTimer) {
                window.clearTimeout(scanTimer);
                scanTimer = null;
            }
        };

        const blockScanWhileUnavailable = (event: KeyboardEvent) => {
            const isScanDigit = /^\d$/.test(event.key);
            const isBufferedScanEnter = event.key === 'Enter' && scanBuffer.length > 0;

            if (!isScanDigit && !isBufferedScanEnter) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            if (isScanDigit) {
                scanBuffer += event.key;

                if (scanTimer) {
                    window.clearTimeout(scanTimer);
                }

                scanTimer = window.setTimeout(resetBuffer, PUBLIC_SCANNER_BLOCKED_INPUT_TIMEOUT_MS);
                return;
            }

            resetBuffer();
        };

        window.addEventListener('keydown', blockScanWhileUnavailable, true);

        return () => {
            window.removeEventListener('keydown', blockScanWhileUnavailable, true);
            resetBuffer();
        };
    }, [enabled, unavailable]);
}
