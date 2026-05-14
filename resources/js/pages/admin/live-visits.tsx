import { LiveVisitMetrics } from '@/components/admin/live-visits/live-visit-metrics';
import { LiveVisitScanner } from '@/components/admin/live-visits/live-visit-scanner';
import { LiveVisitsTable } from '@/components/admin/live-visits/live-visits-table';
import { useManilaClock } from '@/components/public/home/use-manila-clock';
import { LatestVisitCard } from '@/components/visits/latest-visit-card';
import { useRFIDScanListener } from '@/hooks/use-rfid-scan-listener';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { csrfFetch } from '@/lib/http';
import { type AdminVisitMonitor, type DashboardVisit, type ScanTarget } from '@/types/dashboard';
import { Head, router, useForm } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { Clock3 } from 'lucide-react';
import { type FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

interface LiveVisitsProps {
    visitMonitor: AdminVisitMonitor;
}

interface ScanForm {
    [key: string]: string;
    rfid_uid: string;
}

interface LibraryVisitRecordedEvent {
    visit: DashboardVisit;
}

const liveVisitPollMs = 2500;

export default function LiveVisits({ visitMonitor }: LiveVisitsProps) {
    const scanInputRef = useRef<HTMLInputElement | null>(null);
    const [liveVisitMonitor, setLiveVisitMonitor] = useState(visitMonitor);
    const [scanError, setScanError] = useState<string | undefined>();
    const [scanTargets, setScanTargets] = useState<ScanTarget[]>(visitMonitor.scanTargets ?? []);
    const [loadingScanTargets, setLoadingScanTargets] = useState(false);
    const lastVisit = liveVisitMonitor.todayVisits[0];
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

    useEffect(() => {
        setLiveVisitMonitor(visitMonitor);
    }, [visitMonitor]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (document.hidden) {
                return;
            }

            router.reload({
                only: ['visitMonitor'],
                preserveScroll: true,
                preserveState: true,
            });
        }, liveVisitPollMs);

        return () => window.clearInterval(interval);
    }, []);

    useEchoPublic<LibraryVisitRecordedEvent>('library-visits', '.LibraryVisitRecorded', (event) => {
        setLiveVisitMonitor((current) => {
            if (current.todayVisits.some((visit) => visit.id === event.visit.id)) {
                return current;
            }

            const isStudent = event.visit.visitor.type === 'student';
            const isEmployee = event.visit.visitor.type === 'employee';

            return {
                ...current,
                metrics: {
                    visitsToday: current.metrics.visitsToday + 1,
                    studentVisitsToday: current.metrics.studentVisitsToday + (isStudent ? 1 : 0),
                    employeeVisitsToday: current.metrics.employeeVisitsToday + (isEmployee ? 1 : 0),
                },
                todayVisits: [event.visit, ...current.todayVisits],
            };
        });
    });

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
            },
        });
    };

    useRFIDScanListener({
        enabled: !scanning,
        onScanStart: () => setScanError(undefined),
        onError: (errors) => {
            setScanError(typeof errors.rfid_uid === 'string' ? errors.rfid_uid : 'Unable to record this visit.');
        },
        onFinish: () => {
            router.reload({
                only: ['visitMonitor'],
                preserveScroll: true,
                preserveState: true,
            });
        },
    });

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

    return (
        <>
            <Head title="Live Visits" />
            <main className="min-h-screen">
                <AdminLayout active="live-visits">
                    <div className="admin-content-shell mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:py-8">
                        <AdminPageHeader
                            title="Live Visits"
                            description="Today's scanned visitors, Radio-Frequency ID visit recording, and live student or employee attendance flow."
                            actions={
                                <div className="flex items-center gap-2 text-sm text-[#030A8C]">
                                    <Clock3 className="size-4" />
                                    <span>{formattedManilaTime}</span>
                                </div>
                            }
                        />

                        <LiveVisitMetrics
                            visitsToday={liveVisitMonitor.metrics.visitsToday}
                            studentVisitsToday={liveVisitMonitor.metrics.studentVisitsToday}
                            employeeVisitsToday={liveVisitMonitor.metrics.employeeVisitsToday}
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

                        <LiveVisitsTable
                            visits={liveVisitMonitor.todayVisits}
                            studentCount={liveVisitMonitor.metrics.studentVisitsToday}
                            employeeCount={liveVisitMonitor.metrics.employeeVisitsToday}
                        />
                    </div>
                </AdminLayout>
            </main>
        </>
    );
}
