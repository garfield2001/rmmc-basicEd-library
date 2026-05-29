import type React from 'react';

export function Panel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
    return (
        <section className="admin-surface rounded-lg border border-[#040DBF]/10 bg-white/95 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#010440]">{title}</h2>
            <p className="mt-1 text-sm text-[#020659]/70">{detail}</p>
            <div className="mt-4">{children}</div>
        </section>
    );
}
