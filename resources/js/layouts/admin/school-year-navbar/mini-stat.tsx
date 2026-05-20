export function MiniStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="admin-school-year-mini-stat rounded-md border border-[#040DBF]/10 bg-[#f6f8ff] px-2 py-1.5">
            <p className="font-medium text-[#030A8C]">{label}</p>
            <p className="mt-0.5 font-semibold text-[#010440]">{value.toLocaleString()}</p>
        </div>
    );
}
