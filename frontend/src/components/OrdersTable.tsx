import type { OrderRow } from "../hooks/useAnalytics";

const statusLabel: Record<OrderRow["status"], string> = {
  paid: "Оплачен",
  pending: "Ожидает",
  cancelled: "Отменён",
};

const statusClass: Record<OrderRow["status"], string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export function OrdersTable({
  orders,
  onSelect,
}: {
  orders: OrderRow[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200 text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Дата</th>
            <th className="px-4 py-2 font-medium">Сайт</th>
            <th className="px-4 py-2 font-medium">Сумма</th>
            <th className="px-4 py-2 font-medium">Промокод</th>
            <th className="px-4 py-2 font-medium">Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order._id}
              onClick={() => onSelect(order._id)}
              className="cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <td className="px-4 py-2 text-gray-600">
                {new Date(order.createdAt).toLocaleString("ru-RU")}
              </td>
              <td className="px-4 py-2 font-mono text-xs text-gray-500">
                {order.siteId.slice(0, 8)}…
              </td>
              <td className="px-4 py-2 text-gray-900">{order.amount} ₽</td>
              <td className="px-4 py-2 text-gray-600">{order.promoCode ?? "—"}</td>
              <td className="px-4 py-2">
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass[order.status]}`}>
                  {statusLabel[order.status]}
                </span>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                Нет заказов за выбранный период.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
