export const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });
export const displayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const monthOptions = Array.from({ length: 12 }, (_, month) => ({
    value: month,
    label: monthFormatter.format(new Date(2026, month, 1)),
}));

const monthAliases = [
    ['january', 'jan'],
    ['february', 'feb'],
    ['march', 'mar'],
    ['april', 'apr'],
    ['may'],
    ['june', 'jun'],
    ['july', 'jul'],
    ['august', 'aug'],
    ['september', 'sep', 'sept'],
    ['october', 'oct'],
    ['november', 'nov'],
    ['december', 'dec'],
];

export function monthIndex(value: string) {
    const normalized = value.toLowerCase();
    const index = monthAliases.findIndex((aliases) => aliases.includes(normalized));

    return index >= 0 ? index + 1 : null;
}
