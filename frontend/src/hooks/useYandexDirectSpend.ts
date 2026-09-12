import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export type AdSpendPoint = { date: string; cost: number };

export function useYandexDirectSpend(range: { from: string; to: string }) {
  const from = range.from.slice(0, 10);
  const to = range.to.slice(0, 10);

  return useQuery({
    queryKey: ["yandex-direct-spend", from, to],
    queryFn: () => apiFetch<AdSpendPoint[]>(`/yandex-direct/spend?from=${from}&to=${to}`),
    retry: false,
  });
}
