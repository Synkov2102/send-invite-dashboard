import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SitesPoint } from "../hooks/useAnalytics";
import { formatFullDay, formatShortDay } from "../lib/date";

export function SitesChart({ data }: { data: SitesPoint[] }) {
  const tickInterval = Math.max(0, Math.ceil(data.length / 6) - 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 text-sm font-medium text-gray-700">Сайты: создано / опубликовано</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={formatShortDay}
            interval={tickInterval}
          />
          <YAxis tick={{ fontSize: 11 }} width={32} allowDecimals={false} />
          <Tooltip labelFormatter={(label: string) => formatFullDay(label)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="created" name="Создано" fill="#16171a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="published" name="Опубликовано" fill="#ff4f72" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
