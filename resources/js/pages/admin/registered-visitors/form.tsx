import { AdminLayout } from '@/layouts/admin/admin-layout';
import { type LibraryMemberRow } from '@/types/registered-visitors';
import { Head, Link, useForm } from '@inertiajs/react';
import { BriefcaseBusiness, GraduationCap, RadioTower, Save } from 'lucide-react';
import { type FormEventHandler, useEffect, useRef, useState } from 'react';

interface VisitorFormProps {
    visitor: LibraryMemberRow | null;
}

type VisitorFormData = {
    _method: string;
    rfid_uid: string;
    school_id: string;
    type: 'student' | 'employee';
    first_name: string;
    middle_name: string;
    last_name: string;
    photo_file: File | null;
    year_level: string;
    section: string;
    department: string;
};

export default function VisitorForm({ visitor }: VisitorFormProps) {
    const isEditing = Boolean(visitor);
    const scanBuffer = useRef('');
    const scanTimer = useRef<number | null>(null);
    const [scanStatus, setScanStatus] = useState('Ready for RFID scan');

    const { data, setData, post, processing, errors } = useForm<VisitorFormData>({
        _method: isEditing ? 'put' : 'post',
        rfid_uid: visitor?.rfid_uid ?? '',
        school_id: visitor?.school_id ?? '',
        type: visitor?.type ?? 'student',
        first_name: visitor?.first_name ?? '',
        middle_name: visitor?.middle_name ?? '',
        last_name: visitor?.last_name ?? '',
        photo_file: null,
        year_level: visitor?.student?.year_level ?? '',
        section: visitor?.student?.section ?? '',
        department: visitor?.employee?.department ?? '',
    });

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
                if (scanBuffer.current) {
                    setData('rfid_uid', scanBuffer.current);
                    setScanStatus('RFID captured');
                    scanBuffer.current = '';
                }
                return;
            }

            if (event.key.length === 1) {
                scanBuffer.current += event.key;
                setScanStatus('Scanning...');

                if (scanTimer.current) {
                    window.clearTimeout(scanTimer.current);
                }

                scanTimer.current = window.setTimeout(() => {
                    if (scanBuffer.current.length >= 10) {
                        setData('rfid_uid', scanBuffer.current);
                        setScanStatus('RFID captured');
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
    }, [isEditing, setData]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (isEditing && visitor) {
            post(`/admin/registered-visitors/${visitor.id}`, {
                forceFormData: true,
            });
            return;
        }

        post('/admin/registered-visitors', {
            forceFormData: true,
        });
    };

    const inputClass =
        'mt-2 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100';

    const changeVisitorType = (type: VisitorFormData['type']) => {
        setData({
            ...data,
            type,
            ...(type === 'student'
                ? {
                      department: '',
                  }
                : {
                      year_level: '',
                      section: '',
                  }),
        });
    };

    return (
        <>
            <Head title={isEditing ? 'Edit Visitor' : 'Add Visitor'} />
            <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f4f4f5_42%,#e7e5e4_100%)] text-zinc-950">
                <AdminLayout active="visitors">
                    <header className="admin-surface border-b border-zinc-200 bg-white">
                        <div className="admin-content-shell mx-auto w-full px-4 py-5 sm:px-6">
                            <h1 className="admin-page-title font-semibold">{isEditing ? 'Edit Visitor' : 'Add Student or Employee'}</h1>
                            <p className="admin-page-description mt-1 text-zinc-500">
                                Scan the RFID card, then complete the registered visitor profile.
                            </p>
                        </div>
                    </header>

                    <form onSubmit={submit} className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
                                    <RadioTower className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">RFID identity</h2>
                                    <p className="text-sm text-zinc-500">{scanStatus}</p>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                                <label className="text-sm font-medium">
                                    RFID Unique ID
                                    <input
                                        data-rfid-input="true"
                                        value={data.rfid_uid}
                                        onChange={(event) => {
                                            setData('rfid_uid', event.target.value);
                                            setScanStatus(event.target.value ? 'RFID entered' : 'Ready for RFID scan');
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                setScanStatus(data.rfid_uid ? 'RFID captured' : 'Ready for RFID scan');
                                            }
                                        }}
                                        placeholder="Scan or enter RFID"
                                        className={inputClass}
                                        autoComplete="off"
                                        autoFocus={!isEditing}
                                        disabled={isEditing}
                                    />
                                    {errors.rfid_uid && <p className="mt-1 text-xs text-red-600">{errors.rfid_uid}</p>}
                                </label>
                                <label className="text-sm font-medium">
                                    School ID
                                    <input
                                        value={data.school_id}
                                        onChange={(event) => setData('school_id', event.target.value)}
                                        className={inputClass}
                                        disabled={isEditing}
                                    />
                                    {errors.school_id && <p className="mt-1 text-xs text-red-600">{errors.school_id}</p>}
                                </label>
                                <div className="text-sm font-medium">
                                    Visitor type
                                    <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                                        <button
                                            type="button"
                                            onClick={() => changeVisitorType('student')}
                                            className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${
                                                data.type === 'student' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                                            }`}
                                        >
                                            <GraduationCap className="size-4" />
                                            Student
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => changeVisitorType('employee')}
                                            className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition ${
                                                data.type === 'employee' ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                                            }`}
                                        >
                                            <BriefcaseBusiness className="size-4" />
                                            Employee
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <h2 className="font-semibold">Profile</h2>
                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                                <label className="text-sm font-medium">
                                    First name
                                    <input
                                        value={data.first_name}
                                        onChange={(event) => setData('first_name', event.target.value)}
                                        className={inputClass}
                                    />
                                    {errors.first_name && <p className="mt-1 text-xs text-red-600">{errors.first_name}</p>}
                                </label>
                                <label className="text-sm font-medium">
                                    Middle name
                                    <input
                                        value={data.middle_name}
                                        onChange={(event) => setData('middle_name', event.target.value)}
                                        className={inputClass}
                                    />
                                </label>
                                <label className="text-sm font-medium">
                                    Last name
                                    <input
                                        value={data.last_name}
                                        onChange={(event) => setData('last_name', event.target.value)}
                                        className={inputClass}
                                    />
                                    {errors.last_name && <p className="mt-1 text-xs text-red-600">{errors.last_name}</p>}
                                </label>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">
                                        Photo upload
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(event) => setData('photo_file', event.target.files?.[0] ?? null)}
                                            className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white`}
                                        />
                                    </label>
                                    {errors.photo_file && <p className="mt-1 text-xs text-red-600">{errors.photo_file}</p>}
                                    {visitor?.photo_url && (
                                        <div className="mt-3 inline-flex overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-1">
                                            <img
                                                src={visitor.photo_url}
                                                alt={`${visitor.name} current photo`}
                                                className="size-20 rounded-md object-cover"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {data.type === 'student' ? (
                            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="size-5 text-zinc-500" />
                                    <h2 className="font-semibold">Student details</h2>
                                </div>
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <label className="text-sm font-medium">
                                        Year level
                                        <input
                                            value={data.year_level}
                                            onChange={(event) => setData('year_level', event.target.value)}
                                            className={inputClass}
                                        />
                                        {errors.year_level && <p className="mt-1 text-xs text-red-600">{errors.year_level}</p>}
                                    </label>
                                    <label className="text-sm font-medium">
                                        Section
                                        <input
                                            value={data.section}
                                            onChange={(event) => setData('section', event.target.value)}
                                            className={inputClass}
                                        />
                                        {errors.section && <p className="mt-1 text-xs text-red-600">{errors.section}</p>}
                                    </label>
                                </div>
                            </section>
                        ) : (
                            <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <BriefcaseBusiness className="size-5 text-zinc-500" />
                                    <h2 className="font-semibold">Employee details</h2>
                                </div>
                                <div className="mt-5 grid gap-4 md:grid-cols-2">
                                    <label className="text-sm font-medium">
                                        Department
                                        <input
                                            value={data.department}
                                            onChange={(event) => setData('department', event.target.value)}
                                            className={inputClass}
                                        />
                                        {errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}
                                    </label>
                                </div>
                            </section>
                        )}

                        <div className="flex justify-end gap-2">
                            <Link
                                href="/admin/registered-visitors"
                                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                            >
                                <Save className="size-4" />
                                Save visitor
                            </button>
                        </div>
                    </form>
                </AdminLayout>
            </main>
        </>
    );
}
