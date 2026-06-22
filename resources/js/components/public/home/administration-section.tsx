import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import type { RefObject } from 'react';
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
    const { metrics, schoolYear, scanSettings } = home;
    const registeredTotal = metrics.students + metrics.employees;
    const scanWindowLabel = `${scanSettings.scan_starts_at} – ${scanSettings.scan_ends_at}`;

    return (
        <section
            ref={sectionRef}
            className="relative z-10 flex min-h-screen items-start border-t border-[#040DBF]/20 bg-[linear-gradient(180deg,#010440_0%,#020659_100%)] px-5 py-10 text-white sm:px-8 sm:py-12 lg:items-center 2xl:px-12 2xl:py-12"
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
                className={`public-admin-shell mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-85'
                }`}
            >
                {/* Header */}
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 2xl:gap-12">
                    <div className="max-w-5xl">
                        <p className="public-display-label font-semibold text-blue-200">Staff Area</p>
                        <h2 className="public-admin-title mt-2 font-semibold tracking-normal text-white">Administration and records</h2>
                        <p className="public-admin-copy mt-3 max-w-4xl text-blue-100 sm:mt-4">
                            Library staff can sign in here to manage registered visitor profiles, verify visit activity, export attendance records,
                            and maintain scanner settings.
                        </p>
                    </div>

                    <Button
                        onClick={onLoginClick}
                        className="h-12 w-full shrink-0 bg-[#040DBF] px-6 text-base text-white shadow-lg shadow-[#040DBF]/25 hover:bg-white hover:text-[#010440] sm:w-auto 2xl:h-14 2xl:px-8 2xl:text-lg"
                    >
                        <LogIn className="size-4 2xl:size-5" />
                        Admin login
                    </Button>
                </div>

                {/* Body */}
                <div className="mt-8 space-y-6 lg:mt-10 2xl:mt-14">
                    {/* Hero stat — visits today */}
                    <div className="rounded-2xl border border-white/12 bg-white/8 px-6 py-8 sm:px-8 sm:py-10 2xl:px-10 2xl:py-12">
                        <p className="text-sm font-medium tracking-wide text-blue-200 sm:text-base">Visits recorded today</p>
                        <p className="mt-3 text-6xl font-bold tracking-tight text-white tabular-nums sm:text-7xl 2xl:text-8xl">
                            {metrics.visitsToday.toLocaleString()}
                        </p>
                        <p className="mt-3 text-sm text-blue-200/70 sm:text-base">
                            from {registeredTotal.toLocaleString()} registered visitor{registeredTotal === 1 ? '' : 's'}
                        </p>
                        {metrics.visitsThisSchoolYear > 0 && (
                            <p className="mt-1 text-sm text-blue-200/50">{metrics.visitsThisSchoolYear.toLocaleString()} total this school year</p>
                        )}
                    </div>

                    {/* Breakdown — student & employee */}
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                        <div className="rounded-xl border border-l-2 border-white/8 border-l-blue-400 bg-white/5 px-5 py-5 sm:px-6 2xl:px-7 2xl:py-6">
                            <p className="text-sm font-medium text-blue-200/80">Student visits</p>
                            <p className="mt-2 text-3xl font-semibold text-white tabular-nums 2xl:text-4xl">
                                {metrics.studentVisitsToday.toLocaleString()}
                            </p>
                            <p className="mt-1.5 text-sm text-blue-200/50">
                                {metrics.students.toLocaleString()} registered student{metrics.students === 1 ? '' : 's'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-l-2 border-white/8 border-l-teal-400 bg-white/5 px-5 py-5 sm:px-6 2xl:px-7 2xl:py-6">
                            <p className="text-sm font-medium text-blue-200/80">Employee visits</p>
                            <p className="mt-2 text-3xl font-semibold text-white tabular-nums 2xl:text-4xl">
                                {metrics.employeeVisitsToday.toLocaleString()}
                            </p>
                            <p className="mt-1.5 text-sm text-blue-200/50">
                                {metrics.employees.toLocaleString()} registered employee{metrics.employees === 1 ? '' : 's'}
                            </p>
                        </div>
                    </div>

                    {/* System info strip */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-sm text-blue-200/60 2xl:pt-6">
                        <span>
                            <span className="font-medium text-blue-200/80">School year</span> {schoolYear?.name ?? 'Not configured'}
                        </span>
                        <span className="hidden text-white/20 sm:inline" aria-hidden="true">
                            ·
                        </span>
                        <span>
                            <span className="font-medium text-blue-200/80">Scan window</span> {scanWindowLabel}
                        </span>
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
