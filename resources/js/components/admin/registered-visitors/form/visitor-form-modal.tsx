import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type LibraryMemberRow } from '@/types/registered-visitors';
import { useVisitorFormModal } from './use-visitor-form-modal';
import { VisitorFormStepAlert, VisitorMergeWarning } from './visitor-form-alerts';
import { VisitorFormFieldsFlow } from './visitor-form-fields-flow';
import { VisitorFormFooter } from './visitor-form-footer';
import { VisitorFormStepProgress } from './visitor-form-step-progress';
import { VisitorMergeDialog } from './visitor-merge-dialog';

interface VisitorFormModalProps {
    visitor: LibraryMemberRow | null;
    open: boolean;
    sectionsByYearLevel: Record<string, string[]>;
    onOpenChange: (open: boolean) => void;
}

export function VisitorFormModal({ visitor, open, sectionsByYearLevel, onOpenChange }: VisitorFormModalProps) {
    const form = useVisitorFormModal({ visitor, open, onOpenChange });
    const inputClass =
        'mt-2 h-10 w-full rounded-lg border border-[#040DBF]/15 bg-white px-3 text-sm text-[#010440] outline-none transition focus:border-[#040DBF] focus:ring-4 focus:ring-[#040DBF]/10';
    const sectionClass = form.isEditing ? 'rounded-lg border border-[#040DBF]/10 bg-[#f6f8ff] p-4' : 'space-y-4';
    const editTitle = visitor?.type === 'employee' ? 'Edit employee details' : 'Edit student details';

    return (
        <Dialog open={open} onOpenChange={form.close}>
            <DialogContent
                onOpenAutoFocus={(event) => {
                    if (form.isEditing) {
                        event.preventDefault();
                    }
                }}
                className={`max-h-[calc(100dvh-2rem)] overflow-y-auto pb-8 ${form.isEditing ? 'top-4 ![translate:-50%_0] sm:max-w-4xl' : 'sm:max-w-3xl'}`}
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl text-[#010440]">{form.isEditing ? editTitle : 'Add visitor'}</DialogTitle>
                    <DialogDescription>
                        {form.isEditing
                            ? "Review or update this visitor's library profile and active details."
                            : 'Create a registered visitor profile one clear step at a time.'}
                    </DialogDescription>
                </DialogHeader>

                {!form.isEditing && <VisitorFormStepProgress step={form.step} />}

                <form onSubmit={form.submit} className="space-y-5">
                    <VisitorFormFieldsFlow
                        data={form.data}
                        errors={form.errors}
                        step={form.step}
                        isEditing={form.isEditing}
                        visitor={visitor}
                        sectionsByYearLevel={sectionsByYearLevel}
                        inputClass={inputClass}
                        sectionClass={sectionClass}
                        setData={form.updateData}
                        onTypeChange={form.changeVisitorType}
                    />
                    <VisitorFormStepAlert
                        show={!form.isEditing && form.attemptedStep === form.step && (!form.currentStepComplete || form.currentStepHasErrors)}
                        hasErrors={form.currentStepHasErrors}
                    />
                    {form.isEditing && <VisitorMergeWarning errors={form.errors} />}

                    <VisitorFormFooter
                        isEditing={form.isEditing}
                        step={form.step}
                        processing={form.processing}
                        onBack={() => form.setStep((current) => current - 1)}
                        onClose={() => form.close(false)}
                    />
                </form>
            </DialogContent>

            <VisitorMergeDialog
                open={form.confirmMergeOpen}
                processing={form.processing}
                onOpenChange={form.setConfirmMergeOpen}
                onConfirm={form.confirmMerge}
            />
        </Dialog>
    );
}
