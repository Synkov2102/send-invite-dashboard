import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getDailyAdSpend } from "../services/yandex-direct.service.js";

const spendQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export default async function yandexDirectRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/api/yandex-direct/spend", async (request, reply) => {
    const query = spendQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.code(400).send({ error: "Диапазон дат нужен в формате YYYY-MM-DD." });
    }

    try {
      return await getDailyAdSpend(query.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось получить данные Yandex Direct.";
      return reply.code(502).send({ error: message });
    }
  });
}
