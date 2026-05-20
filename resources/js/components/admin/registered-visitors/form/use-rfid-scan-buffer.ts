import { useEffect, useRef } from 'react';

export function useRfidScanBuffer({
    enabled,
    onScan,
}: {
    enabled: boolean;
    onScan: (rfidUid: string) => void;
}) {
    const scanBuffer = useRef('');
    const scanTimer = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const listener = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTypingField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';

            if (isTypingField) {
                return;
            }

            if (event.key === 'Enter') {
                if (scanBuffer.current) {
                    onScan(scanBuffer.current);
                    scanBuffer.current = '';
                }
                return;
            }

            if (event.key.length === 1) {
                scanBuffer.current += event.key;

                if (scanTimer.current) {
                    window.clearTimeout(scanTimer.current);
                }

                scanTimer.current = window.setTimeout(() => {
                    if (scanBuffer.current.length >= 10) {
                        onScan(scanBuffer.current);
                    }

                    scanBuffer.current = '';
                }, 80);
            }
        };

        window.addEventListener('keydown', listener);

        return () => {
            window.removeEventListener('keydown', listener);

            if (scanTimer.current) {
                window.clearTimeout(scanTimer.current);
            }
        };
    }, [enabled, onScan]);
}
