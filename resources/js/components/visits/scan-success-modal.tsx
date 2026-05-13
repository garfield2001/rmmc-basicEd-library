import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FallbackImage } from '@/components/ui/fallback-image';
import { VISIT_SCAN_SUCCESS_MODAL_AUTO_CLOSE_SECONDS } from '@/config/timing';
import { type DashboardVisit } from '@/types/dashboard';
import { BriefcaseBusiness, CalendarClock, CheckCircle2, GraduationCap, IdCard, Timer, UserRound, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScanSuccessModalProps {
    visit: DashboardVisit | null | undefined;
}

const fallback = '-';

function formatVisitTime(visitedAt: string | null) {
    return visitedAt
        ? new Date(visitedAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'Just now';
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: LucideIcon }) {
    return (
        <div className="rounded-lg border border-[#040DBF]/10 bg-white/90 p-4 shadow-sm shadow-[#010440]/5">
            <div className="flex items-center gap-2 text-[#030A8C]">
                {Icon && <Icon className="size-4" />}
                <p className="text-xs font-semibold tracking-[0.14em] uppercase">{label}</p>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-normal text-[#010440]">{value || fallback}</p>
        </div>
    );
}

export function ScanSuccessModal({ visit }: ScanSuccessModalProps) {
    const [visibleVisit, setVisibleVisit] = useState<DashboardVisit | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [closeCountdown, setCloseCountdown] = useState(VISIT_SCAN_SUCCESS_MODAL_AUTO_CLOSE_SECONDS);
    const isEmployee = visibleVisit?.member.type === 'employee';
    const TypeIcon = isEmployee ? BriefcaseBusiness : GraduationCap;
    const typeLabel = isEmployee ? 'Employee' : 'Student';

    useEffect(() => {
        if (!visit || visit.id === visibleVisit?.id) {
            return;
        }

        setVisibleVisit(visit);
        setCloseCountdown(VISIT_SCAN_SUCCESS_MODAL_AUTO_CLOSE_SECONDS);
        setIsOpen(true);
    }, [visibleVisit?.id, visit]);

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

        setCloseCountdown(VISIT_SCAN_SUCCESS_MODAL_AUTO_CLOSE_SECONDS);

        const closeTimer = window.setTimeout(() => setIsOpen(false), VISIT_SCAN_SUCCESS_MODAL_AUTO_CLOSE_SECONDS * 1000);
        const countdownTimer = window.setInterval(() => {
            setCloseCountdown((currentCountdown) => Math.max(currentCountdown - 1, 1));
        }, 1000);

        return () => {
            window.clearTimeout(closeTimer);
            window.clearInterval(countdownTimer);
        };
    }, [isOpen, visibleVisit?.id]);

    if (!visibleVisit) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                key={visibleVisit.id}
                className="scan-success-content min-h-140 overflow-hidden border-[#040DBF]/20 bg-[#f6f8ff] p-0 sm:max-w-5xl"
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
                                {visibleVisit.member.name ?? 'Unknown visitor'}
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
                        <ScanMemberPhoto visit={visibleVisit} />

                        <div className="min-w-0">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <DetailItem label="School ID" value={visibleVisit.member.schoolId ?? 'No school ID'} icon={IdCard} />
                                <DetailItem label="Visitor type" value={typeLabel} icon={TypeIcon} />
                                <DetailItem label="Recorded at" value={formatVisitTime(visibleVisit.visitedAt)} icon={CalendarClock} />
                                {isEmployee ? (
                                    <DetailItem label="Department" value={visibleVisit.member.department} />
                                ) : (
                                    <>
                                        <DetailItem label="Year level" value={visibleVisit.member.yearLevel} />
                                        <DetailItem label="Section" value={visibleVisit.member.section} />
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

function ScanMemberPhoto({ visit }: { visit: DashboardVisit }) {
    return (
        <div className="scan-success-photo overflow-hidden rounded-xl border border-[#040DBF]/15 bg-white p-2 shadow-lg shadow-[#010440]/10">
            <FallbackImage
                src={visit.member.photoUrl}
                className="aspect-square size-full rounded-lg object-cover"
                fallback={
                    <div className="flex aspect-square items-center justify-center rounded-lg bg-[#eef2ff] text-[#030A8C]/50">
                        <UserRound className="size-20" />
                    </div>
                }
            />
        </div>
    );
}
