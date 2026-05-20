import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { visitorFormSteps } from './visitor-form-state';

export function VisitorFormFooter({
    isEditing,
    step,
    processing,
    onBack,
    onClose,
}: {
    isEditing: boolean;
    step: number;
    processing: boolean;
    onBack: () => void;
    onClose: () => void;
}) {
    return (
        <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
                Cancel
            </Button>
            {!isEditing && step > 0 && (
                <Button type="button" variant="secondary" onClick={onBack} disabled={processing}>
                    Back
                </Button>
            )}
            <Button type="submit" disabled={processing}>
                {isEditing
                    ? processing
                        ? 'Saving...'
                        : 'Save changes'
                    : step === visitorFormSteps.length - 1
                      ? processing
                          ? 'Saving...'
                          : 'Create visitor'
                      : 'Continue'}
            </Button>
        </DialogFooter>
    );
}
