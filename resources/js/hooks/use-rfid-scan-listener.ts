import { router } from '@inertiajs/react';
import { useEffect } from 'react';

interface UseRFIDScanListenerOptions {
    enabled?: boolean;
    minLength?: number;
    scanTimeoutMs?: number;
    onScanStart?: () => void;
    onError?: (errors: Record<string, unknown>) => void;
    onFinish?: () => void;
}

interface EditableSnapshot {
    element: HTMLInputElement | HTMLTextAreaElement;
    value: string;
    selectionStart: number | null;
    selectionEnd: number | null;
}

const isEditableElement = (target: HTMLElement | null): target is HTMLInputElement | HTMLTextAreaElement =>
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

const snapshotEditable = (target: HTMLElement | null): EditableSnapshot | null => {
    if (!isEditableElement(target)) {
        return null;
    }

    return {
        element: target,
        value: target.value,
        selectionStart: target.selectionStart,
        selectionEnd: target.selectionEnd,
    };
};

const restoreEditable = (snapshot: EditableSnapshot | null) => {
    if (!snapshot) {
        return;
    }

    snapshot.element.value = snapshot.value;

    if (snapshot.selectionStart !== null && snapshot.selectionEnd !== null) {
        snapshot.element.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
    }

    snapshot.element.dispatchEvent(new Event('input', { bubbles: true }));
};

export function useRFIDScanListener({
    enabled = true,
    minLength = 10,
    scanTimeoutMs = 120,
    onScanStart,
    onError,
    onFinish,
}: UseRFIDScanListenerOptions) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        let scanBuffer = '';
        let scanTimer: number | null = null;
        let editableSnapshot: EditableSnapshot | null = null;
        let scanLocked = false;

        const resetBuffer = () => {
            scanBuffer = '';
            editableSnapshot = null;

            if (scanTimer) {
                window.clearTimeout(scanTimer);
                scanTimer = null;
            }
        };

        const listener = (event: KeyboardEvent) => {
            const target = event.target instanceof HTMLElement ? event.target : null;

            if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || target?.closest('[data-rfid-scan-input="true"]')) {
                return;
            }

            if (event.key === 'Enter') {
                if (scanBuffer.length >= minLength && !scanLocked) {
                    event.preventDefault();
                    restoreEditable(editableSnapshot);
                    scanLocked = true;
                    onScanStart?.();

                    router.post(
                        '/library-visits',
                        { rfid_uid: scanBuffer },
                        {
                            preserveScroll: true,
                            onError,
                            onFinish: () => {
                                scanLocked = false;
                                onFinish?.();
                            },
                        },
                    );
                }

                resetBuffer();
                return;
            }

            if (!/^\d$/.test(event.key)) {
                resetBuffer();
                return;
            }

            if (!scanBuffer) {
                editableSnapshot = snapshotEditable(target);
            }

            scanBuffer += event.key;

            if (scanTimer) {
                window.clearTimeout(scanTimer);
            }

            scanTimer = window.setTimeout(resetBuffer, scanTimeoutMs);
        };

        window.addEventListener('keydown', listener, true);

        return () => {
            window.removeEventListener('keydown', listener, true);
            resetBuffer();
        };
    }, [enabled, minLength, onError, onFinish, onScanStart, scanTimeoutMs]);
}
