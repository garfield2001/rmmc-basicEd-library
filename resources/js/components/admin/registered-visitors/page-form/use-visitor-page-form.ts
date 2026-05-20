import { initialVisitorPageFormData, type VisitorPageFormData } from '@/components/admin/registered-visitors/page-form/visitor-page-form-state';
import type { LibraryMemberRow } from '@/types/registered-visitors';
import { useForm } from '@inertiajs/react';
import { type FormEventHandler, useEffect, useRef, useState } from 'react';

export function useVisitorPageForm(visitor: LibraryMemberRow | null) {
    const isEditing = Boolean(visitor);
    const scanBuffer = useRef('');
    const scanTimer = useRef<number | null>(null);
    const [scanStatus, setScanStatus] = useState('Ready for RFID scan');
    const form = useForm<VisitorPageFormData>(initialVisitorPageFormData(visitor));

    useEffect(() => {
        if (isEditing) {
            return;
        }

        const listener = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null;
            const isTypingField = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';

            if (isTypingField) {
                return;
            }

            if (event.key === 'Enter') {
                captureScanBuffer();
                return;
            }

            if (event.key.length === 1) {
                scanBuffer.current += event.key;
                setScanStatus('Scanning...');
                queueScanCapture();
            }
        };

        window.addEventListener('keydown', listener);

        return () => {
            window.removeEventListener('keydown', listener);
            clearScanTimer();
        };
    }, [form.setData, isEditing]);

    const clearScanTimer = () => {
        if (scanTimer.current) {
            window.clearTimeout(scanTimer.current);
        }
    };

    const captureScanBuffer = () => {
        if (scanBuffer.current) {
            form.setData('rfid_uid', scanBuffer.current);
            setScanStatus('RFID captured');
            scanBuffer.current = '';
        }
    };

    const queueScanCapture = () => {
        clearScanTimer();
        scanTimer.current = window.setTimeout(() => {
            if (scanBuffer.current.length >= 10) {
                form.setData('rfid_uid', scanBuffer.current);
                setScanStatus('RFID captured');
            }

            scanBuffer.current = '';
        }, 80);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        form.post(isEditing && visitor ? `/admin/registered-visitors/${visitor.id}` : '/admin/registered-visitors', {
            forceFormData: true,
        });
    };

    const changeVisitorType = (type: VisitorPageFormData['type']) => {
        form.setData({
            ...form.data,
            type,
            ...(type === 'student' ? { department: '' } : { year_level: '', section: '' }),
        });
    };

    const changeRfid = (value: string) => {
        form.setData('rfid_uid', value);
        setScanStatus(value ? 'RFID entered' : 'Ready for RFID scan');
    };

    const captureEnteredRfid = () => {
        setScanStatus(form.data.rfid_uid ? 'RFID captured' : 'Ready for RFID scan');
    };

    return {
        ...form,
        isEditing,
        scanStatus,
        submit,
        changeRfid,
        changeVisitorType,
        captureEnteredRfid,
    };
}
