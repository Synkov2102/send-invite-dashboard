import { useMemo, useState } from "react";
import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { KpiCard } from "../components/KpiCard";
import { LastMonthSummary } from "../components/LastMonthSummary";
import { OrderDetailModal } from "../components/OrderDetailModal";
import { OrdersCalendarHeatmap } from "../components/OrdersCalendarHeatmap";
import { OrdersTable } from "../components/OrdersTable";
import { RevenueVsAdSpendChart } from "../components/RevenueVsAdSpendChart";
import { RobokassaActsSection } from "../components/RobokassaActsSection";
import { SitesChart } from "../components/SitesChart";
import type { useAuth } from "../hooks/useAuth";
import { useOrders, useOverview, usePromoCodeStats, useSitesTimeseries } from "../hooks/useAnalytics";
import { useYandexDirectSpend } from "../hooks/useYandexDirectSpend";
import { toLocalDateKey } from "../lib/date";

type RangePreset = "7d" | "30d" | "90d" | "thisMonth" | "lastMonth" | "custom";

const DAY_PRESETS: { key: RangePreset; label: string; days: number }[] = [
  { key: "7d", label: "7 дней", days: 7 },
  { key: "30d", label: "30 дней", days: 30 },
  { key: "90d", label: "90 дней", days: 90 },
];

const MONTH_PRESETS: { key: RangePreset; label: string }[] = [
  { key: "thisMonth", label: "Этот месяц" },
  { key: "lastMonth", label: "Прошлый месяц" },
];

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export function DashboardPage({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const range = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case "7d":
        return { from: isoDaysAgo(7), to: now.toISOString() };
      case "90d":
        return { from: isoDaysAgo(90), to: now.toISOString() };
      case "thisMonth":
        return { from: startOfMonth(now).toISOString(), to: endOfMonth(now).toISOString() };
      case "lastMonth": {
        const prevMonth = addMonths(now, -1);
        return { from: startOfMonth(prevMonth).toISOString(), to: endOfMonth(prevMonth).toISOString() };
      }
      case "custom": {
        const lastMonth = addMonths(now, -1);
        return {
          from: (customFrom ?? startOfMonth(lastMonth)).toISOString(),
          to: (customTo ?? endOfMonth(lastMonth)).toISOString(),
        };
      }
      case "30d":
      default:
        return { from: isoDaysAgo(30), to: now.toISOString() };
    }
  }, [preset, customFrom, customTo]);

  function handleCustomFrom(value: string) {
    if (!value) return;
    setPreset("custom");
    setCustomFrom(new Date(`${value}T00:00:00`));
  }

  function handleCustomTo(value: string) {
    if (!value) return;
    setPreset("custom");
    setCustomTo(new Date(`${value}T23:59:59.999`));
  }

  const presetButtonClass = (active: boolean) =>
    `rounded-md px-2.5 py-1.5 text-sm transition sm:px-3 sm:py-1 ${
      active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
    }`;

  const overview = useOverview(range);
  const sitesTimeseries = useSitesTimeseries(range);
  const orders = useOrders(range, status, page);
  const promoCodes = usePromoCodeStats();
  const adSpend = useYandexDirectSpend(range);
  const adSpendTotal = adSpend.data?.reduce((sum, point) => sum + point.cost, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-base font-semibold text-gray-900 sm:text-lg">Send Invite — Дашборд</h1>
            <button onClick={auth.logout} className="shrink-0 text-sm text-gray-500 hover:text-gray-900">
              Выйти
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap rounded-lg border border-gray-200 p-0.5">
              {DAY_PRESETS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPreset(item.key)}
                  className={presetButtonClass(preset === item.key)}
                >
                  {item.label}
                </button>
              ))}
              {MONTH_PRESETS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPreset(item.key)}
                  className={presetButtonClass(preset === item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={toLocalDateKey(new Date(range.from))}
                onChange={(event) => handleCustomFrom(event.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700"
                aria-label="Начало периода"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={toLocalDateKey(new Date(range.to))}
                onChange={(event) => handleCustomTo(event.target.value)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700"
                aria-label="Конец периода"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
        <LastMonthSummary range={range} />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
          <KpiCard
            label="Выручка (оплачено)"
            value={overview.data ? currencyFormatter.format(overview.data.revenuePaid) : "…"}
          />
          <KpiCard label="Оплаченные заказы" value={overview.data ? String(overview.data.ordersPaid) : "…"} />
          <KpiCard
            label="Конверсия в оплату"
            value={
              overview.data?.conversionRate != null
                ? `${(overview.data.conversionRate * 100).toFixed(1)}%`
                : "—"
            }
            hint="оплачено / (оплачено + отменено)"
          />
          <KpiCard
            label="Сайты созданы / опубликованы"
            value={overview.data ? `${overview.data.sitesCreated} / ${overview.data.sitesPublished}` : "…"}
          />
          <KpiCard
            label="Реклама (Яндекс Директ)"
            value={
              adSpend.isError
                ? "—"
                : adSpendTotal != null
                  ? currencyFormatter.format(adSpendTotal)
                  : "…"
            }
            hint={adSpend.isError ? "токен не настроен" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <OrdersCalendarHeatmap />
          <RevenueVsAdSpendChart range={range} />
          <SitesChart data={sitesTimeseries.data ?? []} />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Заказы</h2>
            <select
              value={status ?? ""}
              onChange={(event) => {
                setStatus(event.target.value || undefined);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">Все статусы</option>
              <option value="paid">Оплачен</option>
              <option value="pending">Ожидает</option>
              <option value="cancelled">Отменён</option>
            </select>
          </div>
          <OrdersTable orders={orders.data?.items ?? []} onSelect={setSelectedOrderId} />
          {orders.data && orders.data.total > orders.data.limit && (
            <div className="mt-3 flex items-center justify-center gap-3 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Назад
              </button>
              <span className="text-gray-500">
                Стр. {page} из {Math.ceil(orders.data.total / orders.data.limit)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(orders.data.total / orders.data.limit)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Вперёд
              </button>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-gray-700">Промокоды</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Код</th>
                  <th className="px-4 py-2 font-medium">Скидка</th>
                  <th className="px-4 py-2 font-medium">Использовано</th>
                  <th className="px-4 py-2 font-medium">Оплаченных выкупов</th>
                  <th className="px-4 py-2 font-medium">Сумма скидок</th>
                  <th className="px-4 py-2 font-medium">Активен</th>
                </tr>
              </thead>
              <tbody>
                {(promoCodes.data ?? []).map((code) => (
                  <tr key={code.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2 font-mono text-xs text-gray-700">{code.code}</td>
                    <td className="px-4 py-2 text-gray-600">
                      {code.type === "percent" ? `${code.value}%` : `${code.value} ₽`}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {code.usedCount}
                      {code.maxUses != null ? ` / ${code.maxUses}` : ""}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{code.paidRedemptions}</td>
                    <td className="px-4 py-2 text-gray-600">{code.totalDiscount.toFixed(2)} ₽</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          code.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {code.isActive ? "Да" : "Нет"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <RobokassaActsSection />
      </main>

      {selectedOrderId && (
        <OrderDetailModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
      )}
    </div>
  );
}
