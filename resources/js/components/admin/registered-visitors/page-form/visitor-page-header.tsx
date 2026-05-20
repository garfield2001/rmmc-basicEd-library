interface VisitorPageHeaderProps {
    isEditing: boolean;
}

export function VisitorPageHeader({ isEditing }: VisitorPageHeaderProps) {
    return (
        <header className="admin-surface border-b border-zinc-200 bg-white">
            <div className="admin-content-shell mx-auto w-full px-4 py-5 sm:px-6">
                <h1 className="admin-page-title font-semibold">{isEditing ? 'Edit Visitor' : 'Add Student or Employee'}</h1>
                <p className="admin-page-description mt-1 text-zinc-500">Scan the RFID card, then complete the registered visitor profile.</p>
            </div>
        </header>
    );
}
