export function EmptyChartState({ message }: { message: string }) {
    return (
        <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-[#040DBF]/15 bg-[#f6f8ff]/70 px-4 text-center text-sm font-medium text-[#020659]/70">
            {message}
        </div>
    );
}
