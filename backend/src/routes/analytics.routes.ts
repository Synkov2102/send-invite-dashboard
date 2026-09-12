import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  getOrderDetail,
  getOrdersHeatmap,
  getOverview,
  getPromoCodeStats,
  getRevenueTimeseries,
  getSitesTimeseries,
  listOrders,
} from "../services/analytics.service.js";

const rangeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

const ordersQuerySchema = rangeSchema.extend({
  status: z.enum(["pending", "paid", "cancelled"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export default async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/api/analytics/overview", async (request, reply) => {
    const query = rangeSchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Некорректный диапазон дат." });
    }
    return getOverview(query.data);
  });

  fastify.get("/api/analytics/revenue-timeseries", async (request, reply) => {
    const query = rangeSchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Некорректный диапазон дат." });
    }
    return getRevenueTimeseries(query.data);
  });

  fastify.get("/api/analytics/sites-timeseries", async (request, reply) => {
    const query = rangeSchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Некорректный диапазон дат." });
    }
    return getSitesTimeseries(query.data);
  });

  fastify.get("/api/analytics/orders-heatmap", async (request, reply) => {
    const query = rangeSchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Некорректный диапазон дат." });
    }
    return getOrdersHeatmap(query.data);
  });

  fastify.get("/api/analytics/orders", async (request, reply) => {
    const query = ordersQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Некорректные параметры." });
    }
    return listOrders(query.data);
  });

  fastify.get("/api/analytics/promo-codes", async () => {
    return getPromoCodeStats();
  });

  fastify.get<{ Params: { id: string } }>("/api/analytics/orders/:id", async (request, reply) => {
    const detail = await getOrderDetail(request.params.id);
    if (!detail) {
      return reply.code(404).send({ error: "Заказ не найден." });
    }
    return detail;
  });
}
