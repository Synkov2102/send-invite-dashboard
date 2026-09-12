import type { FastifyInstance } from "fastify";
import pdfParse from "pdf-parse";
import { listActs, upsertAct } from "../db/robokassa-acts-store.js";
import { parseRobokassaActText } from "../services/robokassa-act-parser.js";

export default async function robokassaActsRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get("/api/robokassa-acts", async () => {
    return listActs();
  });

  fastify.post("/api/robokassa-acts/import", async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ error: "Файл не передан." });
    }
    if (file.mimetype !== "application/pdf") {
      return reply.code(400).send({ error: "Ожидается PDF-файл акта." });
    }

    const buffer = await file.toBuffer();
    const { text } = await pdfParse(buffer);

    let parsed;
    try {
      parsed = parseRobokassaActText(text);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось разобрать отчёт.";
      return reply.code(422).send({ error: message });
    }

    const record = {
      ...parsed,
      sourceFileName: file.filename,
      importedAt: new Date().toISOString(),
    };
    await upsertAct(record);
    return record;
  });
}
