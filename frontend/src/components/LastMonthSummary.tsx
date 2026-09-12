import { useMemo } from "react";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { KpiCard } from "./KpiCard";
import { useOverview } from "../hooks/useAnalytics";
import { useRobokassaActs } from "../hooks/useRobokassaActs";
import { useYandexDirectSpend } from "../hooks/useYandexDirectSpend";
import { toLocalDateKey } from "../lib/date";

const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

function isFullMonth(from: Date, to: Date) {
  return toLocalDateKey(from) === toLocalDateKey(startOfMonth(from)) && toLocalDateKey(to) === toLocalDateKey(endOfMonth(from));
}

export function LastMonthSummary({ range }: { range: { from: string; to: string } }) {
  const from = useMemo(() => new Date(range.from), [range.from]);
  const to = useMemo(() => new Date(range.to), [range.to]);
  const periodKey = useMemo(() => toLocalDateKey(from), [from]);
  const label = useMemo(() => {
    if (isFullMonth(from, to)) {
      return format(from, "LLLL yyyy", { locale: ru });
    }
    return `${format(from, "d MMM yyyy", { locale: ru })} — ${format(to, "d MMM yyyy", { locale: ru })}`;
  }, [from, to]);

  const overview = useOverview(range);
  const adSpend = useYandexDirectSpend(range);
  const acts = useRobokassaActs();

  const revenue = overview.data?.revenuePaid;
  const adSpendTotal = adSpend.data?.reduce((sum, point) => sum + point.cost, 0);
  const act = acts.data?.find((item) => item.periodFrom === periodKey);

  const commissionValue = acts.isLoading ? "…" : act ? currencyFormatter.format(act.commissionTotal) : "нет акта";
  const revenueValue = revenue != null ? currencyFormatter.format(revenue) : "…";
  const adSpendValue = adSpend.isError ? "—" : adSpendTotal != null ? currencyFormatter.format(adSpendTotal) : "…";

  const net =
    revenue != null && act != null && adSpendTotal != null ? revenue - act.commissionTotal - adSpendTotal : null;

  return (
    <section className="rounded-xl border border-pink-200 bg-pink-50/70 p-4">
      <h2 className="mb-3 text-sm font-medium capitalize text-gray-700">Итоги — {label}</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <KpiCard label="Выручка (оплачено)" value={revenueValue} />
        <KpiCard label="Комиссия Robokassa" value={commissionValue} />
        <KpiCard label="Реклама (Яндекс Директ)" value={adSpendValue} />
        <KpiCard label="Чистыми" value={net != null ? currencyFormatter.format(net) : "—"} />
      </div>
    </section>
  );
}
