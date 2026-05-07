import { LiveVisitMetrics } from '@/components/admin/live-visits/live-visit-metrics';
import { LiveVisitScanner } from '@/components/admin/live-visits/live-visit-scanner';
import { LiveVisitsTable } from '@/components/admin/live-visits/live-visits-table';
import { useManilaClock } from '@/components/public/home/use-manila-clock';
import { LatestVisitCard } from '@/components/visits/latest-visit-card';
import { useRFIDScanListener } from '@/hooks/use-rfid-scan-listener';
import { AdminLayout } from '@/layouts/admin/admin-layout';
import { AdminPageHeader } from '@/layouts/admin/admin-page-header';
import { type AdminVisitMonitor } from '@/types/dashboard';
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
        return (visitMonitor.scanTargets ?? []).map((target) => ({
            value: target.RFIDUid,
            label: target.name,
            meta: `${target.schoolId} - ${target.type}${target.detail ? ` - ${target.detail}` : ''}`,
            idTerms: [target.schoolId, ...target.schoolId.split(/[^a-zA-Z0-9]+/)].filter((term): term is string => Boolean(term)),
            textTerms: [target.name, target.firstName, target.lastName, target.type, target.detail].filter((term): term is string => Boolean(term)),
        }));
    }, [visitMonitor.scanTargets]);

    const submitScan: FormEventHandler = (event) => {
        event.preventDefault();

        postScan('/library-visits', {
            preserveScroll: true,
            onStart: () => setScanError(undefined),
            onError: (errors) => {
                setScanError(typeof errors.rfid_uid === 'string' ? errors.rfid_uid : 'Unable to record this visit.');
            },
            onFinish: () => {
                resetScan('rfid_uid');
                scanInputRef.current?.focus();
            },
        });
    };

    useEffect(() => {
        scanInputRef.current?.focus();
    }, []);

    useRFIDScanListener({
        onScanStart: () => setScanError(undefined),
        onError: (errors) => {
            setScanError(typeof errors.rfid_uid === 'string' ? errors.rfid_uid : 'Unable to record this visit.');
        },
        onFinish: () => {
            resetScan('rfid_uid');
            scanInputRef.current?.focus();
        },
    });

    return (
        <>
            <Head title="Live Visits" />
            <main className="min-h-screen">
                <AdminLayout active="live-visits">
                    <div className="space-y-6 px-4 py-6 sm:px-6 lg:py-8">
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
