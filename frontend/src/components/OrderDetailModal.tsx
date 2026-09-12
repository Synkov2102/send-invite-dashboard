import type { ReactNode } from "react";
import { useOrderDetail } from "../hooks/useAnalytics";

const statusLabel: Record<string, string> = {
  paid: "Оплачен",
  pending: "Ожидает",
  cancelled: "Отменён",
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-1.5 text-sm sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="break-words text-gray-900 sm:text-right">{children}</span>
    </div>
  );
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString("ru-RU") : "—";
}

function formatEventDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function OrderDetailModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data, isLoading, error } = useOrderDetail(orderId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Заказ</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-gray-700"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {isLoading && <p className="text-sm text-gray-500">Загрузка…</p>}
        {error && <p className="text-sm text-red-600">Не удалось загрузить заказ.</p>}

        {data && (
          <div className="space-y-5">
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Платёж
              </h3>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 px-3">
                <Row label="Статус">
                  <span
                    className={
                      data.order.status === "paid"
                        ? "text-green-700"
                        : data.order.status === "pending"
                          ? "text-amber-700"
                          : "text-gray-500"
                    }
                  >
                    {statusLabel[data.order.status]}
                  </span>
                </Row>
                <Row label="Номер счёта (InvId)">{data.order.invId}</Row>
                <Row label="Сумма">{data.order.amount} ₽</Row>
                <Row label="Сумма без скидки">{data.order.originalAmount} ₽</Row>
                <Row label="Скидка">{data.order.discountAmount} ₽</Row>
                <Row label="Способ оплаты">{data.order.paymentMethod ?? "—"}</Row>
                <Row label="Email плательщика">{data.order.email ?? "—"}</Row>
                <Row label="Создан">{formatDateTime(data.order.createdAt)}</Row>
                <Row label="Оплачен">{formatDateTime(data.order.paidAt)}</Row>
                <Row label="Обновлён">{formatDateTime(data.order.updatedAt)}</Row>
                <Row label="ID заказа">
                  <span className="font-mono text-xs">{data.order._id}</span>
                </Row>
              </div>
            </section>

            {data.promoCode && (
              <section>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Промокод
                </h3>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 px-3">
                  <Row label="Код">
                    <span className="font-mono">{data.promoCode.code}</span>
                  </Row>
                  <Row label="Скидка">
                    {data.promoCode.type === "percent"
                      ? `${data.promoCode.value}%`
                      : `${data.promoCode.value} ₽`}
                  </Row>
                  <Row label="Активен">{data.promoCode.isActive ? "Да" : "Нет"}</Row>
                  <Row label="Погашен">{formatDateTime(data.order.promoRedeemedAt)}</Row>
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Кто создал
              </h3>
              {data.owner ? (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 px-3">
                  <Row label="Имя">{data.owner.name}</Row>
                  <Row label="Email">{data.owner.email ?? "—"}</Row>
                  <Row label="Логин">{data.owner.login}</Row>
                  <Row label="Зарегистрирован">{formatDateTime(data.owner.createdAt)}</Row>
                  <Row label="ID пользователя">
                    <span className="font-mono text-xs">{data.owner.id}</span>
                  </Row>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Пользователь не найден.</p>
              )}
            </section>

            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Сайт
              </h3>
              {data.site ? (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100 px-3">
                  <Row label="Адрес">
                    <a
                      href={data.site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-pink-600 hover:underline"
                    >
                      {data.site.url}
                    </a>
                  </Row>
                  <Row label="Пара">
                    {data.site.groom} и {data.site.bride}
                  </Row>
                  <Row label="Дата события">
                    {formatEventDate(data.site.date)}
                    {data.site.time ? `, ${data.site.time}` : ""}
                  </Row>
                  <Row label="Место">
                    {[data.site.venue, data.site.city].filter(Boolean).join(", ") || "—"}
                  </Row>
                  <Row label="Шаблон">
                    <span className="font-mono text-xs">{data.site.templateId}</span>
                  </Row>
                  <Row label="Оплачен / опубликован">
                    {data.site.isPaid ? "Да" : "Нет"} / {data.site.isPublished ? "Да" : "Нет"}
                  </Row>
                  <Row label="Создан">{formatDateTime(data.site.createdAt)}</Row>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Сайт не найден.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
