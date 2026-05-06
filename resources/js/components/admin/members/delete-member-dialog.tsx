import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type LibraryMemberRow } from '@/types/members';
import { router } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface DeleteMemberDialogProps {
    member: LibraryMemberRow | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteMemberDialog({ member, open, onOpenChange }: DeleteMemberDialogProps) {
    const [processing, setProcessing] = useState(false);

    const deleteMember = () => {
        if (!member) {
            return;
        }

        setProcessing(true);
        router.delete(`/admin/members/${member.id}`, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
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
                    <DialogTitle className="text-2xl text-[#010440]">Delete member?</DialogTitle>
                    <DialogDescription>
                        This will remove {member?.name ?? 'this member'} and their related library visit ownership links. This action cannot be
                        undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => close(false)} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="button" variant="danger" onClick={deleteMember} disabled={processing}>
                        {processing ? 'Deleting...' : 'Delete member'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
