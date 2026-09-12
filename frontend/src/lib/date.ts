import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

/** "1 сент, вт" — для подписей на графиках. */
export function formatShortDay(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM, EEE", { locale: ru });
}

/** "1 сентября 2026, вторник" — для тултипов и заголовков. */
export function formatFullDay(dateStr: string): string {
  return format(parseISO(dateStr), "d MMMM yyyy, EEEE", { locale: ru });
}

/** Локальная календарная дата (не UTC) в формате YYYY-MM-DD — для сравнения с датами из Robokassa-актов и заполнения <input type="date">. */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
