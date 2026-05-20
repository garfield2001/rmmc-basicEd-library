import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function VisitorMergeDialog({
    open,
    processing,
    onOpenChange,
    onConfirm,
}: {
    open: boolean;
    processing: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !processing && onOpenChange(nextOpen)}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl text-[#010440]">Merge duplicate profiles?</DialogTitle>
                    <DialogDescription>
                        This visitor now has a usable RFID or school ID. Keep this record, move any visit history here, and delete unresolved
                        duplicate placeholder records behind the scenes.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                        Review first
                    </Button>
                    <Button type="button" onClick={onConfirm} disabled={processing}>
                        {processing ? 'Merging...' : 'Merge duplicates'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
