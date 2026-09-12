import { getDb } from "../db/mongo.js";
import { config } from "../config.js";
import type {
  PaymentOrderDocument,
  PromoCodeDocument,
  SiteDocument,
  UserDocument,
} from "../types/documents.js";

type DateRange = { from: string; to: string };

async function getOrdersCollection() {
  const db = await getDb();
  return db.collection<PaymentOrderDocument>("payment_orders");
}

async function getSitesCollection() {
  const db = await getDb();
  return db.collection<SiteDocument>("sites");
}

async function getPromoCodesCollection() {
  const db = await getDb();
  return db.collection<PromoCodeDocument>("promo_codes");
}

async function getUsersCollection() {
  const db = await getDb();
  return db.collection<UserDocument>("users");
}

export async function getOverview(range: DateRange) {
  const orders = await getOrdersCollection();
  const sites = await getSitesCollection();
  const createdAtFilter = { createdAt: { $gte: range.from, $lte: range.to } };

  const [orderStats, sitesCreated, sitesPublished] = await Promise.all([
    orders
      .aggregate<{ _id: string; count: number; amount: number }>([
        { $match: createdAtFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            amount: { $sum: { $toDouble: "$amount" } },
          },
        },
      ])
      .toArray(),
    sites.countDocuments(createdAtFilter),
    sites.countDocuments({ ...createdAtFilter, isPublished: true }),
  ]);

  const byStatus = { pending: { count: 0, amount: 0 }, paid: { count: 0, amount: 0 }, cancelled: { count: 0, amount: 0 } };
  for (const row of orderStats) {
    if (row._id in byStatus) {
      byStatus[row._id as keyof typeof byStatus] = { count: row.count, amount: row.amount };
    }
  }

  return {
    revenuePaid: byStatus.paid.amount,
    ordersPaid: byStatus.paid.count,
    ordersPending: byStatus.pending.count,
    ordersCancelled: byStatus.cancelled.count,
    conversionRate:
      byStatus.paid.count + byStatus.cancelled.count > 0
        ? byStatus.paid.count / (byStatus.paid.count + byStatus.cancelled.count)
        : null,
    sitesCreated,
    sitesPublished,
  };
}

export async function getRevenueTimeseries(range: DateRange) {
  const orders = await getOrdersCollection();

  const rows = await orders
    .aggregate<{ _id: string; amount: number; count: number }>([
      {
        $match: {
          status: "paid",
          paidAt: { $gte: range.from, $lte: range.to },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$paidAt" }, timezone: "Europe/Moscow" },
          },
          amount: { $sum: { $toDouble: "$amount" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  return rows.map((row) => ({ date: row._id, amount: row.amount, count: row.count }));
}

export async function getSitesTimeseries(range: DateRange) {
  const sites = await getSitesCollection();

  const rows = await sites
    .aggregate<{ _id: string; created: number; published: number }>([
      { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" }, timezone: "Europe/Moscow" },
          },
          created: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ["$isPublished", true] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  return rows.map((row) => ({ date: row._id, created: row.created, published: row.published }));
}

export async function getOrdersHeatmap(range: DateRange) {
  const orders = await getOrdersCollection();

  const rows = await orders
    .aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: range.from, $lte: range.to } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" }, timezone: "Europe/Moscow" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  return rows.map((row) => ({ date: row._id, count: row.count }));
}

export async function listOrders(params: {
  status?: "pending" | "paid" | "cancelled";
  from: string;
  to: string;
  page: number;
  limit: number;
}) {
  const orders = await getOrdersCollection();
  const filter: Record<string, unknown> = { createdAt: { $gte: params.from, $lte: params.to } };
  if (params.status) {
    filter.status = params.status;
  }

  const [items, total] = await Promise.all([
    orders
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit)
      .toArray(),
    orders.countDocuments(filter),
  ]);

  return { items, total, page: params.page, limit: params.limit };
}

export async function getOrderDetail(id: string) {
  const orders = await getOrdersCollection();
  const order = await orders.findOne({ _id: id });
  if (!order) {
    return null;
  }

  const sites = await getSitesCollection();
  const users = await getUsersCollection();
  const promoCodes = await getPromoCodesCollection();

  const [site, owner, promoCodeDoc] = await Promise.all([
    sites.findOne({ _id: order.siteId }),
    users.findOne({ _id: order.ownerId }),
    order.promoCodeId ? promoCodes.findOne({ _id: order.promoCodeId }) : Promise.resolve(null),
  ]);

  return {
    order,
    owner: owner
      ? {
          id: owner._id,
          email: owner.email,
          login: owner.login,
          name: owner.name,
          createdAt: owner.createdAt,
        }
      : null,
    site: site
      ? {
          id: site._id,
          url: `${config.siteBaseUrl}/invite/sites/${site._id}`,
          templateId: site.templateId,
          isPaid: site.isPaid === true,
          isPublished: site.isPublished === true,
          createdAt: site.createdAt,
          updatedAt: site.updatedAt,
          groom: site.invite.groom,
          bride: site.invite.bride,
          date: site.invite.date,
          time: site.invite.time,
          venue: site.invite.venue,
          city: site.invite.city,
        }
      : null,
    promoCode: promoCodeDoc
      ? {
          code: promoCodeDoc.code,
          type: promoCodeDoc.type,
          value: promoCodeDoc.value,
          isActive: promoCodeDoc.isActive,
        }
      : null,
  };
}

export async function getPromoCodeStats() {
  const promoCodes = await getPromoCodesCollection();
  const orders = await getOrdersCollection();

  const [codes, redemptions] = await Promise.all([
    promoCodes.find({}).sort({ usedCount: -1 }).toArray(),
    orders
      .aggregate<{ _id: string; count: number; discount: number }>([
        { $match: { status: "paid", promoCodeId: { $ne: null } } },
        {
          $group: {
            _id: "$promoCodeId",
            count: { $sum: 1 },
            discount: { $sum: { $toDouble: "$discountAmount" } },
          },
        },
      ])
      .toArray(),
  ]);

  const redemptionsById = new Map(redemptions.map((row) => [row._id, row]));

  return codes.map((code) => ({
    id: code._id,
    code: code.code,
    isActive: code.isActive,
    type: code.type,
    value: code.value,
    maxUses: code.maxUses,
    usedCount: code.usedCount,
    paidRedemptions: redemptionsById.get(code._id)?.count ?? 0,
    totalDiscount: redemptionsById.get(code._id)?.discount ?? 0,
  }));
}
