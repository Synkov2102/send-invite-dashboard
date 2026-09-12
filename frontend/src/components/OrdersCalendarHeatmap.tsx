import { useMemo, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { useOrdersHeatmap } from "../hooks/useAnalytics";
import { formatFullDay, toLocalDateKey as toIsoDate } from "../lib/date";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function startOfWeekMonday(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getColor(count: number, max: number) {
  if (count === 0 || max <= 0) return "#eef0f2";
  const ratio = count / max;
  if (ratio > 0.75) return "#ff4f72";
  if (ratio > 0.5) return "#ff7d99";
  if (ratio > 0.25) return "#ffabbe";
  return "#ffd7e0";
}

type Day = { date: string; dayOfMonth: number; count: number; inMonth: boolean };

export function OrdersCalendarHeatmap() {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));

  const range = useMemo(() => {
    const from = startOfMonth(monthCursor);
    const to = endOfMonth(monthCursor);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [monthCursor]);

  const heatmap = useOrdersHeatmap(range);

  const { weeks, max } = useMemo(() => {
    const data = heatmap.data ?? [];
    const countsByDate = new Map(data.map((point) => [point.date, point.count]));
    const monthStart = startOfMonth(monthCursor);
    const monthEnd = endOfMonth(monthCursor);
    const monthNumber = monthStart.getMonth();

    const gridStart = startOfWeekMonday(monthStart);
    const gridEnd = new Date(monthEnd);
    const endWeekday = (gridEnd.getDay() + 6) % 7;
    gridEnd.setDate(gridEnd.getDate() + (6 - endWeekday));

    const days: Day[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      const iso = toIsoDate(cursor);
      days.push({
        date: iso,
        dayOfMonth: cursor.getDate(),
        count: countsByDate.get(iso) ?? 0,
        inMonth: cursor.getMonth() === monthNumber,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const weeksArr: Day[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksArr.push(days.slice(i, i + 7));
    }

    const maxCount = Math.max(0, ...data.map((point) => point.count));
    return { weeks: weeksArr, max: maxCount };
  }, [heatmap.data, monthCursor]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-gray-700">Заказы по дням</div>
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setMonthCursor((current) => addMonths(current, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 active:bg-gray-200"
            aria-label="Предыдущий месяц"
          >
            ‹
          </button>
          <span className="min-w-[8rem] text-center capitalize text-gray-700">
            {format(monthCursor, "LLLL yyyy", { locale: ru })}
          </span>
          <button
            onClick={() => setMonthCursor((current) => addMonths(current, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 active:bg-gray-200"
            aria-label="Следующий месяц"
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex w-max gap-2">
          <div className="flex flex-col gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="flex h-9 items-center text-[10px] text-gray-400">
                {label}
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week) => (
              <div key={week[0].date} className="flex w-9 shrink-0 flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={
                      day.inMonth ? `${formatFullDay(day.date)} — заказов: ${day.count}` : undefined
                    }
                    className="relative flex h-9 items-center justify-center rounded"
                    style={{
                      backgroundColor: day.inMonth ? getColor(day.count, max) : "transparent",
                      visibility: day.inMonth ? "visible" : "hidden",
                    }}
                  >
                    <span className="absolute left-1 top-0.5 text-[9px] font-normal text-gray-500">
                      {day.dayOfMonth}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: day.count > 0 ? "#8a1030" : "#c3c7cd" }}
                    >
                      {day.count}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
