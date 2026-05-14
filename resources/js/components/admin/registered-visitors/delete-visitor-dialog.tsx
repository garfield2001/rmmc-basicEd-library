import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type RegisteredVisitorRow } from '@/types/registered-visitors';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface DeleteVisitorDialogProps {
    visitor: RegisteredVisitorRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteVisitorDialog({ visitor, open, onOpenChange }: DeleteVisitorDialogProps) {
    const [processing, setProcessing] = useState(false);

    const deleteVisitor = () => {
        if (!visitor) {
            return;
        }

        const visitorId = visitor.id;

        onOpenChange(false);
        setProcessing(true);
        router.delete(`/admin/registered-visitors/${visitorId}`, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const close = (nextOpen: boolean) => {
        if (!nextOpen && processing) {
            return;
        }

        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <AlertTriangle className="size-5" />
                    </div>
                    <DialogTitle className="text-2xl text-[#010440]">Archive visitor?</DialogTitle>
                    <DialogDescription>
                        This will move {visitor?.name ?? 'this visitor'} to Archived Registered Visitors. Their visit history stays available, and the
                        visitor can be restored later.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => close(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" variant="danger" onClick={deleteVisitor} disabled={processing}>
                        {processing ? 'Archiving...' : 'Archive visitor'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
