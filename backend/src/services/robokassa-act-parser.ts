/**
 * Parses Robokassa's monthly "Акт о завершении отчётного периода" PDF (text layer).
 * The act has no per-order breakdown — only period totals — so this extracts
 * exactly what the document provides: aggregate payment/refund counts and the
 * 7 commission line items from section 13, matched by their distinctive label
 * text rather than item numbers (numbers like "1." or "14." collide with dates
 * elsewhere in the document).
 */

export type ParsedRobokassaAct = {
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
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseAmount(raw: string): number {
  return Number(raw.replace(/\s/g, "").replace(",", "."));
}

function findAmount(text: string, label: string): number {
  const pattern = new RegExp(`${escapeRegExp(label)}[\\s\\S]{0,150}?([\\d\\s]+[.,]\\d{2})\\s*руб`, "i");
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Не удалось найти в отчёте сумму по пункту «${label}».`);
  }
  return parseAmount(match[1]);
}

function findCount(text: string, label: string): number {
  const pattern = new RegExp(`${escapeRegExp(label)}[\\s\\S]{0,80}?(\\d+)\\s*шт`, "i");
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Не удалось найти в отчёте количество по пункту «${label}».`);
  }
  return Number(match[1]);
}

function findDate(text: string, label: string): string {
  const pattern = new RegExp(`${escapeRegExp(label)}[\\s\\S]{0,60}?(\\d{2})\\.(\\d{2})\\.(\\d{4})`);
  const match = text.match(pattern);
  if (!match) {
    throw new Error(`Не удалось найти в отчёте дату по пункту «${label}».`);
  }
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function sliceBetween(text: string, startLabel: string, endLabel: string): string {
  const startIndex = text.indexOf(startLabel);
  if (startIndex === -1) {
    throw new Error(`Не удалось найти в отчёте раздел «${startLabel}».`);
  }
  const endIndex = text.indexOf(endLabel, startIndex);
  return text.slice(startIndex, endIndex === -1 ? text.length : endIndex);
}

export function parseRobokassaActText(text: string): ParsedRobokassaAct {
  // The "№" glyph is often extracted from the PDF text layer as literal "No" —
  // match both, but require 4+ digits so we don't grab a law reference like "No 244-ФЗ".
  const actNumberMatch = text.match(/(?:№|No)\s*(\d{4,8})\b/i);
  if (!actNumberMatch) {
    throw new Error("Не удалось найти номер акта — это точно акт Robokassa?");
  }

  const periodFrom = findDate(text, "начала Отчётного периода");
  const periodTo = findDate(text, "окончания Отчётного периода");

  const paymentsSection = sliceBetween(
    text,
    "Оплаты в пользу Получателя в Отчетном периоде",
    "Операции возврата, совершенные Получателем",
  );
  const refundsSection = sliceBetween(
    text,
    "Операции возврата, совершенные Получателем",
    "Сумма Задолженности по Недействительным",
  );

  const paymentsCount = findCount(paymentsSection, "Общее количество");
  const paymentsSum = findAmount(paymentsSection, "Общая сумма");
  const refundsCount = findCount(refundsSection, "Общее количество");
  const refundsSum = findAmount(refundsSection, "Общая сумма");

  const commission = {
    payment: findAmount(text, "при совершении Оплаты"),
    transfer: findAmount(text, "Получателем и Расчетным банком при осуществлении"),
    sms: findAmount(text, "комиссии за использование Функции"),
    robocheki: findAmount(text, "Сумма комиссии за оказание услуги"),
    cabinet: findAmount(text, "техническое сопровождение функционала"),
    yandex: findAmount(text, "Яндекс Пэй и Яндекс Сплит"),
    mokka: findAmount(text, "платежного метода Мокка"),
  };
  const commissionTotal =
    Math.round(Object.values(commission).reduce((sum, value) => sum + value, 0) * 100) / 100;
  const penalties = findAmount(text, "Пени, штрафы, неустойки");

  return {
    actNumber: actNumberMatch[1],
    periodFrom,
    periodTo,
    paymentsCount,
    paymentsSum,
    refundsCount,
    refundsSum,
    commission,
    commissionTotal,
    penalties,
  };
}
