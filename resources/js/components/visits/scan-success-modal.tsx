import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type DashboardVisit } from '@/types/dashboard';
import { BriefcaseBusiness, CalendarClock, CheckCircle2, GraduationCap, IdCard, Timer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DetailItem, formatVisitTime, ScanVisitorPhoto, visitSignature } from './scan-success-modal-parts';

interface ScanSuccessModalProps {
    visit: DashboardVisit | null | undefined;
    closeAfterSeconds: number;
}

export function ScanSuccessModal({ visit, closeAfterSeconds }: ScanSuccessModalProps) {
    const [visibleVisit, setVisibleVisit] = useState<DashboardVisit | null>(null);
    const [visibleVisitSignature, setVisibleVisitSignature] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [closeCountdown, setCloseCountdown] = useState(closeAfterSeconds);
    const isEmployee = visibleVisit?.visitor.type === 'employee';
    const TypeIcon = isEmployee ? BriefcaseBusiness : GraduationCap;
    const typeLabel = isEmployee ? 'Employee' : 'Student';

    useEffect(() => {
        const nextVisitSignature = visitSignature(visit);

        if (!visit || nextVisitSignature === visibleVisitSignature) {
            return;
        }

        setVisibleVisit(visit);
        setVisibleVisitSignature(nextVisitSignature);
        setCloseCountdown(closeAfterSeconds);
        setIsOpen(true);
    }, [closeAfterSeconds, visibleVisitSignature, visit]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setCloseCountdown(closeAfterSeconds);

        const closeTimer = window.setTimeout(() => setIsOpen(false), closeAfterSeconds * 1000);
        const countdownTimer = window.setInterval(() => {
            setCloseCountdown((currentCountdown) => Math.max(currentCountdown - 1, 1));
        }, 1000);

        return () => {
            window.clearTimeout(closeTimer);
            window.clearInterval(countdownTimer);
        };
    }, [closeAfterSeconds, isOpen, visibleVisit?.id]);

    if (!visibleVisit) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                key={visibleVisit.id}
                className="scan-success-content max-h-[calc(100dvh-1rem)] overflow-y-auto border-[#040DBF]/20 bg-[#f6f8ff] p-0 sm:min-h-140 sm:max-w-5xl"
            >
                <div className="h-3 bg-[linear-gradient(90deg,#040DBF_0%,#030A8C_52%,#010440_100%)]" />
                <div className="p-6 sm:p-8">
                    <DialogHeader className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start">
                        <div>
                            <div className="inline-flex items-center gap-3 rounded-full border border-[#040DBF]/15 bg-white px-4 py-2 text-sm font-semibold text-[#020659] shadow-sm shadow-[#010440]/5">
                                <span className="flex size-8 items-center justify-center rounded-full bg-[#040DBF] text-white">
                                    <CheckCircle2 className="size-5" />
                                </span>
                                Visit recorded successfully
                            </div>
                            <DialogTitle className="mt-5 text-4xl leading-tight font-semibold tracking-normal text-[#010440] sm:text-5xl">
                                {visibleVisit.visitor.name ?? 'Unknown visitor'}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Library visit was recorded successfully and this confirmation closes automatically.
                            </DialogDescription>
                        </div>

                        <div className="rounded-xl border border-[#040DBF]/15 bg-white p-4 text-center shadow-md shadow-[#010440]/10">
                            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-[#030A8C] uppercase">
                                <Timer className="size-4" />
                                Closes on
                            </div>
                            <p className="mt-1 text-6xl leading-none font-semibold tracking-normal text-[#040DBF]">{closeCountdown}</p>
                        </div>
                    </DialogHeader>

                    <div className="mt-8 grid gap-8 sm:grid-cols-[300px_minmax(0,1fr)]">
                        <ScanVisitorPhoto visit={visibleVisit} />

                        <div className="min-w-0">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <DetailItem label="School ID" value={visibleVisit.visitor.schoolId ?? 'No school ID'} icon={IdCard} />
                                <DetailItem label="Visitor type" value={typeLabel} icon={TypeIcon} />
                                <DetailItem label="Recorded at" value={formatVisitTime(visibleVisit.visitedAt)} icon={CalendarClock} />
                                {isEmployee ? (
                                    <DetailItem label="Department" value={visibleVisit.visitor.department} />
                                ) : (
                                    <>
                                        <DetailItem label="Year level" value={visibleVisit.visitor.yearLevel} />
                                        <DetailItem label="Section" value={visibleVisit.visitor.section} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
