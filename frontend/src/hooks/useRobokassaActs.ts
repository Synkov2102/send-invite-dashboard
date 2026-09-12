import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getToken } from "../lib/api";

export type RobokassaAct = {
  actNumber: string;
  periodFrom: string;
  periodTo: string;
  paymentsCount: number;
  paymentsSum: number;
  refundsCount: number;
  refundsSum: number;
  commission: {
    payment: number;
    transfer: number;
    sms: number;
    robocheki: number;
    cabinet: number;
    yandex: number;
    mokka: number;
  };
  commissionTotal: number;
  penalties: number;
  sourceFileName: string;
  importedAt: string;
};

export function useRobokassaActs() {
  return useQuery({
    queryKey: ["robokassa-acts"],
    queryFn: () => apiFetch<RobokassaAct[]>("/robokassa-acts"),
  });
}

export function useImportRobokassaAct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const token = getToken();

      const response = await fetch("/api/robokassa-acts/import", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Не удалось импортировать отчёт.");
      }

      return response.json() as Promise<RobokassaAct>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["robokassa-acts"] });
    },
  });
}
