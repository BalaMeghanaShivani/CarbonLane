import type { CarEntryRow } from '../types';

function formatToNearestMinute(ts: string | null): string {
    if (!ts) return '—';
    try {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '—';
    }
}

function formatDateTime(ts: string | null): string {
    if (!ts) return '—';
    try {
        const d = new Date(ts);
        return d.toLocaleString();
    } catch {
        return '—';
    }
}

interface Props {
    entries: CarEntryRow[];
}

const CarEntriesTable = ({ entries }: Props) => {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-medium text-white">Recent Entries</h3>
            <div className="max-h-[220px] overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-900">
                        <tr className="border-b border-slate-700">
                            <th className="px-3 py-2 text-left font-medium text-slate-400">License</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-400">Entry</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-400">Exit</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-400">Min</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-400">Fuel (g)</th>
                            <th className="px-3 py-2 text-right font-medium text-slate-400">CO₂ (g)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                                    No entries yet
                                </td>
                            </tr>
                        ) : (
                            entries.map((row, i) => (
                                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                    <td className="px-3 py-2 font-mono text-white">{row.numberplate}</td>
                                    <td className="px-3 py-2 text-slate-300" title={formatDateTime(row.enter_timestamp)}>
                                        {formatToNearestMinute(row.enter_timestamp)}
                                    </td>
                                    <td className="px-3 py-2 text-slate-300" title={row.exit_timestamp ? formatDateTime(row.exit_timestamp) : undefined}>
                                        {formatToNearestMinute(row.exit_timestamp)}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-300">
                                        {row.minutes_elapsed != null ? Number(row.minutes_elapsed).toFixed(2) : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-300">
                                        {row.fuel_used != null ? Number(row.fuel_used).toFixed(1) : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-slate-300">
                                        {row.carbon_produced != null ? Number(row.carbon_produced).toFixed(1) : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <p className="mt-2 text-xs text-slate-500">Scroll for older entries · Order: newest first</p>
        </div>
    );
};

export default CarEntriesTable;
