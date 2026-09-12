import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { config } from "./config.js";
import authPlugin from "./plugins/auth.js";
import authRoutes from "./routes/auth.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import robokassaActsRoutes from "./routes/robokassa-acts.routes.js";
import yandexDirectRoutes from "./routes/yandex-direct.routes.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: config.corsOrigin });
  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
  await app.register(authPlugin);
  await app.register(authRoutes);
  await app.register(analyticsRoutes);
  await app.register(robokassaActsRoutes);
  await app.register(yandexDirectRoutes);

  app.get("/api/health", async () => ({ ok: true }));

  return app;
}
