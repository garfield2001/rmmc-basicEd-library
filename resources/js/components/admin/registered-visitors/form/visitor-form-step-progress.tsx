import { visitorFormSteps } from './visitor-form-state';

export function VisitorFormStepProgress({ step }: { step: number }) {
    return (
        <div className="border-y border-[#040DBF]/10 py-4">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.16em] text-[#030A8C] uppercase">
                <span>
                    Step {step + 1} of {visitorFormSteps.length}
                </span>
                <span>{visitorFormSteps[step].title}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#040DBF]/10">
                <div
                    className="h-full rounded-full bg-[#040DBF] transition-[width] duration-300"
                    style={{ width: `${((step + 1) / visitorFormSteps.length) * 100}%` }}
                />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#020659]">{visitorFormSteps[step].description}</p>
        </div>
    );
}
