import { LiveVisitMetrics } from '@/components/admin/live-visits/live-visit-metrics';
import { LiveVisitScanner } from '@/components/admin/live-visits/live-visit-scanner';
import { LiveVisitsTable } from '@/components/admin/live-visits/live-visits-table';
import { useManilaClock } from '@/components/public/home/use-manila-clock';
import { LatestVisitCard } from '@/components/visits/latest-visit-card';
import { useRFIDScanListener } from '@/hooks/use-rfid-scan-listener';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { csrfFetch } from '@/lib/http';
import { type AdminVisitMonitor, type ScanTarget } from '@/types/dashboard';
import { Head, useForm } from '@inertiajs/react';
import { Clock3 } from 'lucide-react';
import { type FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

interface LiveVisitsProps {
    visitMonitor: AdminVisitMonitor;
}

interface ScanForm {
    [key: string]: string;
    rfid_uid: string;
}

export default function LiveVisits({ visitMonitor }: LiveVisitsProps) {
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const [scanError, setScanError] = useState<string | undefined>();
    const [scanTargets, setScanTargets] = useState<ScanTarget[]>(visitMonitor.scanTargets ?? []);
    const [loadingScanTargets, setLoadingScanTargets] = useState(false);
    const lastVisit = visitMonitor.todayVisits[0];
    const { formattedManilaTime } = useManilaClock();
    const {
        data: scanData,
        setData: setScanData,
        post: postScan,
        processing: scanning,
        reset: resetScan,
    } = useForm<ScanForm>({
        rfid_uid: '',
    });
    const scanTargetOptions = useMemo(() => {
        return scanTargets.map((target) => ({
            value: target.RFIDUid,
            label: target.name,
            meta: `${target.schoolId} - ${target.type}${target.detail ? ` - ${target.detail}` : ''}`,
            idTerms: [target.RFIDUid, target.schoolId, ...target.schoolId.split(/[^a-zA-Z0-9]+/)].filter((term): term is string => Boolean(term)),
            textTerms: [target.name, target.firstName, target.lastName, target.type, target.detail].filter((term): term is string => Boolean(term)),
        }));
    }, [scanTargets]);

    const submitScan: FormEventHandler = (event) => {
        event.preventDefault();

        postScan('/library-visits', {
            preserveScroll: true,
            onStart: () => setScanError(undefined),
            onError: (errors) => {
                setScanError(typeof errors.rfid_uid === 'string' ? errors.rfid_uid : 'Unable to record this visit.');
            },
            onSuccess: () => {
                setScanTargets([]);
            },
            onFinish: () => {
                setScanData('rfid_uid', '');
                resetScan('rfid_uid');
                scanInputRef.current?.focus();
            },
        });
    };

    useEffect(() => {
        scanInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const search = scanData.rfid_uid.trim();

        if (search.length < 1) {
            setScanTargets([]);
            setLoadingScanTargets(false);
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setLoadingScanTargets(true);

            try {
                const response = await csrfFetch(`/admin/live-visits/scan-targets?search=${encodeURIComponent(search)}`, {
                    signal: controller.signal,
                });
                const payload = await response.json().catch(() => null);

                if (response.ok) {
                    setScanTargets(payload?.targets ?? []);
                }
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    setScanTargets([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingScanTargets(false);
                }
            }
        }, 180);

        return () => {
            controller.abort();
            window.clearTimeout(timer);
        };
    }, [scanData.rfid_uid]);

    useRFIDScanListener({
        onScanStart: () => setScanError(undefined),
        onError: (errors) => {
            setScanError(typeof errors.rfid_uid === 'string' ? errors.rfid_uid : 'Unable to record this visit.');
        },
        onFinish: () => {
            setScanData('rfid_uid', '');
            setScanTargets([]);
            resetScan('rfid_uid');
            scanInputRef.current?.focus();
        },
    });

    return (
        <>
            <Head title="Live Visits" />
            <main className="min-h-screen">
                <AdminLayout active="live-visits">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Live Visits"
                            description="RFID visit recording, today's scanned members, and live student or employee attendance flow."
                            actions={
                                <div className="flex items-center gap-2 text-sm text-[#030A8C]">
                                    <Clock3 className="size-4" />
                                    <span>{formattedManilaTime}</span>
                                </div>
                            }
                        />

                        <LiveVisitScanner
                            value={scanData.rfid_uid}
                            options={scanTargetOptions}
                            inputRef={scanInputRef}
                            processing={scanning}
                            loadingOptions={loadingScanTargets}
                            error={scanError}
                            onChange={(value) => setScanData('rfid_uid', value)}
                            onSubmit={submitScan}
                        />

                        <LatestVisitCard
                            visit={lastVisit ?? null}
                            emptyMessage="Scanned students and employees will appear in the live table below."
                        />

                        <LiveVisitMetrics
                            visitsToday={visitMonitor.metrics.visitsToday}
                            studentVisitsToday={visitMonitor.metrics.studentVisitsToday}
                            employeeVisitsToday={visitMonitor.metrics.employeeVisitsToday}
                        />

                        <LiveVisitsTable
                            visits={visitMonitor.todayVisits}
                            studentCount={visitMonitor.metrics.studentVisitsToday}
                            employeeCount={visitMonitor.metrics.employeeVisitsToday}
                        />
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
