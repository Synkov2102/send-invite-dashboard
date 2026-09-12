import { config } from "../config.js";

const REPORTS_URL = "https://api.direct.yandex.com/json/v5/reports";
const MAX_OFFLINE_RETRIES = 5;

export type DailySpendPoint = { date: string; cost: number };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Yandex rejects some reports in `online` mode with error 8312 ("Отчет
 * невозможно построить в режиме online") — offline mode always works but
 * queues the report; Yandex responds 201/202 with a `retryIn` header telling
 * us how long to wait before asking again.
 */
async function requestReport(from: string, to: string): Promise<string> {
  if (!config.yandexDirectToken) {
    throw new Error("YANDEX_DIRECT_OAUTH_TOKEN не настроен.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.yandexDirectToken}`,
    "Accept-Language": "ru",
    "Content-Type": "application/json; charset=utf-8",
    processingMode: "offline",
    returnMoneyInMicros: "false",
    skipReportHeader: "true",
    skipColumnHeader: "true",
    skipReportSummary: "true",
  };
  if (config.yandexDirectClientLogin) {
    headers["Client-Login"] = config.yandexDirectClientLogin;
  }

  const body = {
    params: {
      SelectionCriteria: { DateFrom: from, DateTo: to },
      FieldNames: ["Date", "Cost"],
      ReportName: `send-invite-dashboard ${from}_${to}_${Date.now()}`,
      ReportType: "CUSTOM_REPORT",
      DateRangeType: "CUSTOM_DATE",
      Format: "TSV",
      IncludeVAT: "YES",
      IncludeDiscount: "YES",
    },
  };

  for (let attempt = 0; attempt <= MAX_OFFLINE_RETRIES; attempt++) {
    const response = await fetch(REPORTS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 200) {
      return response.text();
    }

    if (response.status === 201 || response.status === 202) {
      const retryInHeader = response.headers.get("retryIn");
      const retrySeconds = retryInHeader ? Number(retryInHeader) : 5;
      await sleep(Math.min(retrySeconds, 15) * 1000);
      continue;
    }

    const errorText = await response.text().catch(() => "");
    throw new Error(`Yandex Direct API вернул ошибку (${response.status}): ${errorText.slice(0, 300)}`);
  }

  throw new Error("Отчёт Yandex Direct не был готов после нескольких попыток — попробуйте ещё раз.");
}

function parseTsv(tsv: string): DailySpendPoint[] {
  return tsv
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, cost] = line.split("\t");
      return { date, cost: Number(cost) };
    })
    .filter((point) => point.date && Number.isFinite(point.cost));
}

export async function getDailyAdSpend(range: { from: string; to: string }): Promise<DailySpendPoint[]> {
  const tsv = await requestReport(range.from, range.to);
  return parseTsv(tsv);
}
