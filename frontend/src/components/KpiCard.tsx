type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="text-xs text-gray-500 sm:text-sm">{label}</div>
      <div className="mt-1 truncate text-xl font-semibold text-gray-900 sm:text-2xl">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-gray-400 sm:text-xs">{hint}</div>}
    </div>
  );
}
