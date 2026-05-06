import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import type { RefObject } from 'react';
import { AdministrationStatCard } from './AdministrationStatCard';
import { AdministrationStatusCard } from './AdministrationStatusCard';
import { getAdministrationStats, getAdministrationStatus } from './metrics';
import type { IndexProps } from './types';

interface AdministrationSectionProps {
    home: IndexProps['home'];
    sectionRef: RefObject<HTMLElement | null>;
    isRevealed: boolean;
    showScrollHint: boolean;
    showReturnButton: boolean;
    onLoginClick: () => void;
    onReturnToScanner: () => void;
}

export function AdministrationSection({
    home,
    sectionRef,
    isRevealed,
    showScrollHint,
    showReturnButton,
    onLoginClick,
    onReturnToScanner,
}: AdministrationSectionProps) {
    const administrationStats = getAdministrationStats(home);
    const administrationStatus = getAdministrationStatus(home);

    return (
        <section
            ref={sectionRef}
            className="relative z-10 flex min-h-screen items-center border-t border-[#040DBF]/20 bg-[linear-gradient(180deg,#010440_0%,#020659_100%)] px-5 py-8 text-white sm:px-8 sm:py-10"
        >
            {showScrollHint && (
                <div
                    className="pointer-events-none absolute top-8 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center bg-transparent text-white/90 drop-shadow-lg motion-safe:animate-bounce sm:top-10"
                    aria-hidden="true"
                >
                    <ChevronDown className="size-14 sm:size-16" />
                </div>
            )}

            <div
                className={`mx-auto w-full max-w-6xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-85'
                }`}
            >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
                    <div className="max-w-3xl">
                        <p className="text-sm font-semibold text-blue-200">Staff Area</p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">Administration and records</h2>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:mt-4 sm:text-base sm:leading-7">
                            Library staff can sign in here to manage member profiles, verify visit activity, export attendance records, and maintain
                            scanner settings.
                        </p>
                    </div>

                    <Button
                        onClick={onLoginClick}
                        className="h-12 w-full shrink-0 bg-[#040DBF] px-6 text-white shadow-lg shadow-[#040DBF]/25 hover:bg-white hover:text-[#010440] sm:w-auto"
                    >
                        <LogIn className="size-4" />
                        Admin login
                    </Button>
                </div>

                <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-10">
                    <div className="divide-y divide-white/15 border-y border-white/15">
                        {administrationStats.map((stat) => (
                            <AdministrationStatCard key={stat.label} label={stat.label} value={stat.value} detail={stat.detail} icon={stat.icon} />
                        ))}
                    </div>

                    <div className="border-y border-white/15 py-4 sm:py-5">
                        <p className="text-sm font-semibold text-blue-200">Current setup</p>
                        <div className="mt-5 space-y-5">
                            {administrationStatus.map((item) => (
                                <AdministrationStatusCard
                                    key={item.label}
                                    label={item.label}
                                    value={item.value}
                                    detail={item.detail}
                                    icon={item.icon}
                                />
                            ))}
                        </div>
                        <div className="mt-6 border-t border-white/15 pt-5">
                            <p className="text-sm leading-6 text-blue-100">
                                Administrative tools are kept behind staff login so the scanner station stays focused on visitor flow.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {isRevealed && (
                <Button
                    type="button"
                    onClick={onReturnToScanner}
                    aria-label="Show scanner page"
                    className={`group fixed right-5 bottom-5 z-30 h-14 w-14 gap-0 overflow-hidden rounded-full border border-white/20 bg-[#040DBF] p-0 text-white shadow-2xl shadow-[#010440]/45 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:w-52 hover:animate-none hover:gap-2 hover:bg-[#030A8C] hover:pr-4 hover:pl-2 motion-safe:animate-bounce sm:right-8 sm:bottom-8 ${
                        showReturnButton ? 'translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-5 scale-95 opacity-0'
                    }`}
                >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-transparent text-white">
                        <ChevronUp className="size-7" />
                    </span>
                    <span className="max-w-0 overflow-hidden font-semibold whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-36 group-hover:opacity-100">
                        Return to scanner
                    </span>
                </Button>
            )}
        </section>
    );
}
