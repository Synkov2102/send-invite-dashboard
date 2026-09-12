import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

export type DateRange = { from: string; to: string };

export type Overview = {
  revenuePaid: number;
  ordersPaid: number;
  ordersPending: number;
  ordersCancelled: number;
  conversionRate: number | null;
  sitesCreated: number;
  sitesPublished: number;
};

export type RevenuePoint = { date: string; amount: number; count: number };
export type SitesPoint = { date: string; created: number; published: number };
export type HeatmapPoint = { date: string; count: number };

export type OrderRow = {
  _id: string;
  amount: string;
  createdAt: string;
  paidAt: string | null;
  promoCode: string | null;
  siteId: string;
  status: "pending" | "paid" | "cancelled";
};

export type OrderDetail = {
  order: {
    _id: string;
    invId: number;
    amount: string;
    originalAmount: string;
    discountAmount: string;
    email: string | null;
    ownerId: string;
    siteId: string;
    status: "pending" | "paid" | "cancelled";
    paymentMethod: string | null;
    promoCode: string | null;
    promoCodeId: string | null;
    promoRedeemedAt: string | null;
    createdAt: string;
    updatedAt: string;
    paidAt: string | null;
  };
  owner: {
    id: string;
    email: string | null;
    login: string;
    name: string;
    createdAt: string;
  } | null;
  site: {
    id: string;
    url: string;
    templateId: string;
    isPaid: boolean;
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    groom: string;
    bride: string;
    date: string;
    time: string;
    venue: string;
    city: string;
  } | null;
  promoCode: {
    code: string;
    type: "percent" | "fixed";
    value: number;
    isActive: boolean;
  } | null;
};

export type PromoCodeStat = {
  id: string;
  code: string;
  isActive: boolean;
  type: "percent" | "fixed";
  value: number;
  maxUses: number | null;
  usedCount: number;
  paidRedemptions: number;
  totalDiscount: number;
};

function toQuery(range: DateRange, extra?: Record<string, string | number | undefined>) {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

export function useOverview(range: DateRange) {
  return useQuery({
    queryKey: ["overview", range],
    queryFn: () => apiFetch<Overview>(`/analytics/overview?${toQuery(range)}`),
  });
}

export function useRevenueTimeseries(range: DateRange) {
  return useQuery({
    queryKey: ["revenue-timeseries", range],
    queryFn: () => apiFetch<RevenuePoint[]>(`/analytics/revenue-timeseries?${toQuery(range)}`),
  });
}

export function useSitesTimeseries(range: DateRange) {
  return useQuery({
    queryKey: ["sites-timeseries", range],
    queryFn: () => apiFetch<SitesPoint[]>(`/analytics/sites-timeseries?${toQuery(range)}`),
  });
}

export function useOrdersHeatmap(range: DateRange) {
  return useQuery({
    queryKey: ["orders-heatmap", range],
    queryFn: () => apiFetch<HeatmapPoint[]>(`/analytics/orders-heatmap?${toQuery(range)}`),
  });
}

export function useOrders(range: DateRange, status: string | undefined, page: number) {
  return useQuery({
    queryKey: ["orders", range, status, page],
    queryFn: () =>
      apiFetch<{ items: OrderRow[]; total: number; page: number; limit: number }>(
        `/analytics/orders?${toQuery(range, { status, page })}`,
      ),
  });
}

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ["order-detail", id],
    queryFn: () => apiFetch<OrderDetail>(`/analytics/orders/${id}`),
    enabled: id !== null,
  });
}

export function usePromoCodeStats() {
  return useQuery({
    queryKey: ["promo-codes"],
    queryFn: () => apiFetch<PromoCodeStat[]>("/analytics/promo-codes"),
  });
}
