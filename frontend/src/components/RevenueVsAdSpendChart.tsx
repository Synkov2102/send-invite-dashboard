import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useRevenueTimeseries } from "../hooks/useAnalytics";
import { useYandexDirectSpend } from "../hooks/useYandexDirectSpend";
import { formatFullDay, formatShortDay } from "../lib/date";

const seriesLabel: Record<string, string> = {
  revenue: "Выручка",
  adSpend: "Реклама",
};

export function RevenueVsAdSpendChart({ range }: { range: { from: string; to: string } }) {
  const revenue = useRevenueTimeseries(range);
  const adSpend = useYandexDirectSpend(range);

  const data = useMemo(() => {
    const revenueMap = new Map((revenue.data ?? []).map((point) => [point.date, point.amount]));
    const spendMap = new Map((adSpend.data ?? []).map((point) => [point.date, point.cost]));
    const dates = new Set([...revenueMap.keys(), ...spendMap.keys()]);

    return Array.from(dates)
      .sort()
      .map((date) => ({
        date,
        revenue: revenueMap.get(date) ?? 0,
        adSpend: spendMap.get(date) ?? 0,
      }));
  }, [revenue.data, adSpend.data]);

  const tickInterval = Math.max(0, Math.ceil(data.length / 6) - 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 text-sm font-medium text-gray-700">Выручка и расходы на рекламу по дням</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff4f72" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ff4f72" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="adSpendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16171a" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#16171a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatShortDay} interval={tickInterval} />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip
            labelFormatter={(label: string) => formatFullDay(label)}
            formatter={(value: number, name: string) => [`${value.toFixed(2)} ₽`, seriesLabel[name] ?? name]}
          />
          <Legend formatter={(value: string) => seriesLabel[value] ?? value} wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="#ff4f72"
            fill="url(#revenueFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="adSpend"
            name="adSpend"
            stroke="#16171a"
            fill="url(#adSpendFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      {adSpend.isError && (
        <p className="mt-2 text-xs text-gray-400">
          Расходы на рекламу недоступны:{" "}
          {adSpend.error instanceof Error ? adSpend.error.message : "ошибка загрузки"}
        </p>
      )}
    </div>
  );
}
