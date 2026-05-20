import { csrfFetch } from '@/lib/http';
import { type LibraryMemberImportPreview } from '@/types/registered-visitors';
import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';

export function useVisitorImport() {
    const [importing, setImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<LibraryMemberImportPreview | null>(null);
    const [importPreviewOpen, setImportPreviewOpen] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const importInputRef = useRef<HTMLInputElement | null>(null);

    const previewImport = async (file: File | null) => {
        if (!file) {
            return;
        }

        setImportFile(file);
        setImportPreview(null);
        setImportError(null);
        setImporting(true);

        const formData = new FormData();
        formData.append('visitors_file', file);

        try {
            const response = await csrfFetch('/admin/registered-visitors/import/preview', { method: 'POST', body: formData });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                const message =
                    payload?.errors?.visitors_file?.[0] ?? payload?.message ?? 'Unable to preview this file. Please check the file and try again.';
                setImportError(message);
                setImportFile(null);
                return;
            }

            setImportPreview(payload.preview);
            setImportPreviewOpen(true);
        } catch {
            setImportError('Unable to preview this file. Please check the file and try again.');
            setImportFile(null);
        } finally {
            setImporting(false);

            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };

    const cancelImport = () => {
        if (importing) {
            return;
        }

        setImportPreviewOpen(false);
        setImportPreview(null);
        setImportFile(null);
    };

    const confirmImport = () => {
        if (!importFile || !importPreview) {
            return;
        }

        router.post(
            '/admin/registered-visitors/import',
            { visitors_file: importFile },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => {
                    setImporting(true);
                    setImportError(null);
                },
                onSuccess: () => {
                    setImportPreviewOpen(false);
                    setImportPreview(null);
                    setImportFile(null);
                },
                onError: (errors) => {
                    setImportError(typeof errors.visitors_file === 'string' ? errors.visitors_file : 'Unable to import this file.');
                },
                onFinish: () => {
                    setImporting(false);
                },
            },
        );
    };

    return {
        importing,
        importPreview,
        importPreviewOpen,
        importError,
        importInputRef,
        previewImport,
        cancelImport,
        confirmImport,
    };
}
