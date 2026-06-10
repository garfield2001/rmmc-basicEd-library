import { useManilaClock } from '@/components/public/home/use-manila-clock';
import { useRFIDScanListener } from '@/hooks/use-rfid-scan-listener';
import { csrfFetch } from '@/lib/http';
import { type AdminVisitMonitor, type DashboardVisit, type ScanTarget } from '@/types/dashboard';
import { router, useForm } from '@inertiajs/react';
import { useEchoPublic } from '@laravel/echo-react';
import { type FormEventHandler, useEffect, useMemo, useState } from 'react';

interface LibraryVisitRecordedEvent {
    visit: DashboardVisit;
}

interface ScanForm {
    [key: string]: string;
    rfid_uid: string;
}

const liveVisitPollMs = 2500;

export function useLiveVisitsPage(visitMonitor: AdminVisitMonitor) {
    const [liveVisitMonitor, setLiveVisitMonitor] = useState(visitMonitor);
    const [scanError, setScanError] = useState<string | undefined>();
    const [scanTargets, setScanTargets] = useState<ScanTarget[]>(visitMonitor.scanTargets ?? []);
    const [loadingScanTargets, setLoadingScanTargets] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<DashboardVisit | null>(null);
    const { formattedManilaTime } = useManilaClock();
    const { data, setData, post, processing, reset } = useForm<ScanForm>({ rfid_uid: '' });

    const scanTargetOptions = useMemo(
        () =>
            scanTargets.map((target) => {
                const scanValue = target.RFIDUid ?? target.schoolId ?? target.name;
                const schoolId = target.schoolId ?? 'No school ID';

                return {
                    value: scanValue,
                    label: target.name,
                    meta: `${schoolId} - ${target.type}${target.detail ? ` - ${target.detail}` : ''}`,
                    idTerms: [target.RFIDUid, target.schoolId, ...(target.schoolId ?? '').split(/[^a-zA-Z0-9]+/)].filter(
                        (term): term is string => Boolean(term),
                    ),
                    textTerms: [target.name, target.firstName, target.lastName, target.type, target.detail].filter((term): term is string =>
                        Boolean(term),
                    ),
                };
            }),
        [scanTargets],
    );

    useEffect(() => setLiveVisitMonitor(visitMonitor), [visitMonitor]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            if (!document.hidden) {
                router.reload({ only: ['visitMonitor'] });
            }
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
        post('/library-visits', {
            preserveScroll: true,
            onStart: () => setScanError(undefined),
            onError: (errors) => setScanError(typeof errors.rfid_uid === 'string' ? errors.rfid_uid : 'Unable to record this visit.'),
            onSuccess: () => setScanTargets([]),
            onFinish: () => {
                setData('rfid_uid', '');
                reset('rfid_uid');
            },
        });
    };

    useRFIDScanListener({
        enabled: !processing,
        onScanStart: () => setScanError(undefined),
        onError: (errors) => setScanError(typeof errors.rfid_uid === 'string' ? errors.rfid_uid : 'Unable to record this visit.'),
        onFinish: () => {
            setData('rfid_uid', '');
            reset('rfid_uid');
            setScanTargets([]);
            router.reload({ only: ['visitMonitor'] });
        },
    });

    useEffect(() => {
        const search = data.rfid_uid.trim();

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
    }, [data.rfid_uid]);

    return {
        formattedManilaTime,
        liveVisitMonitor,
        loadingScanTargets,
        scanData: data,
        scanError,
        scanTargetOptions,
        scanning: processing,
        selectedVisit,
        setScanData: setData,
        setSelectedVisit,
        submitScan,
    };
}
