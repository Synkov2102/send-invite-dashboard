import { useState, type ChangeEvent } from "react";
import { useImportRobokassaAct, useRobokassaActs } from "../hooks/useRobokassaActs";

const currencyFormatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 2,
});

function formatPeriod(from: string, to: string) {
  const formatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  return `${formatter.format(new Date(from))} — ${formatter.format(new Date(to))}`;
}

export function RobokassaActsSection() {
  const acts = useRobokassaActs();
  const importAct = useImportRobokassaAct();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    importAct.mutate(file, {
      onError: (err) => setError(err instanceof Error ? err.message : "Ошибка импорта."),
    });
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700">Отчёты Robokassa (комиссия по месяцам)</h2>
        <label className="cursor-pointer rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          {importAct.isPending ? "Загрузка…" : "Импортировать акт (PDF)"}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={importAct.isPending}
          />
        </label>
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-4 py-2 font-medium">Период</th>
              <th className="px-4 py-2 font-medium">Оплаты</th>
              <th className="px-4 py-2 font-medium">Возвраты</th>
              <th className="px-4 py-2 font-medium">Комиссия Robokassa</th>
              <th className="px-4 py-2 font-medium">Чистыми</th>
            </tr>
          </thead>
          <tbody>
            {(acts.data ?? []).map((act) => {
              const net = act.paymentsSum - act.refundsSum - act.commissionTotal;
              return (
                <tr key={act.actNumber} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 text-gray-700">{formatPeriod(act.periodFrom, act.periodTo)}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {currencyFormatter.format(act.paymentsSum)} ({act.paymentsCount})
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {currencyFormatter.format(act.refundsSum)} ({act.refundsCount})
                  </td>
                  <td className="px-4 py-2 text-gray-600">{currencyFormatter.format(act.commissionTotal)}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">{currencyFormatter.format(net)}</td>
                </tr>
              );
            })}
            {(acts.data ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Пока нет импортированных отчётов.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
