import { csrfFetch } from '@/lib/http';
import { router } from '@inertiajs/react';
import { useState, type FormEventHandler } from 'react';
import type { LoginForm } from './types';

type LoginErrors = Partial<Record<keyof LoginForm, string>>;

export function useAdminLogin() {
    const [data, setData] = useState<LoginForm>({ email: '', password: '' });
    const [errors, setErrors] = useState<LoginErrors>({});
    const [processing, setProcessing] = useState(false);
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    const setField = (field: keyof LoginForm, value: string) => {
        setErrors((current) => ({ ...current, [field]: undefined }));
        setData((current) => ({ ...current, [field]: value }));
    };

    const submit: FormEventHandler = async (event) => {
        event.preventDefault();

        if (processing || loadingAdmin) {
            return;
        }

        setProcessing(true);
        setErrors({});

        try {
            const response = await csrfFetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                setErrors(validationErrors(payload));
                setData((current) => ({ ...current, password: '' }));
                return;
            }

            setData((current) => ({ ...current, password: '' }));
            setLoadingAdmin(true);
            router.visit(typeof payload.redirect === 'string' ? payload.redirect : '/admin', {
                preserveScroll: false,
                onError: () => setLoadingAdmin(false),
                onCancel: () => setLoadingAdmin(false),
            });
        } finally {
            setProcessing(false);
        }
    };

    return {
        data,
        errors,
        processing,
        loadingAdmin,
        setEmail: (value: string) => setField('email', value),
        setPassword: (value: string) => setField('password', value),
        submit,
    };
}

function validationErrors(payload: unknown): LoginErrors {
    if (!payload || typeof payload !== 'object' || !('errors' in payload)) {
        return { password: 'Unable to sign in. Please try again.' };
    }

    const errors = (payload as { errors?: Record<string, string[]> }).errors ?? {};

    return {
        email: errors.email?.[0],
        password: errors.password?.[0],
    };
}
