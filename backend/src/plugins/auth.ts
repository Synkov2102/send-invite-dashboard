import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { config } from "../config.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest) => Promise<void>;
  }
}

export default fp(async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
    sign: { expiresIn: "12h" },
  });

  fastify.decorate("authenticate", async function (request: FastifyRequest) {
    await request.jwtVerify();
  });
});
