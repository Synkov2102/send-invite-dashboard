import bcrypt from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/api/auth/login", async (request, reply) => {
    const body = loginSchema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: "Некорректный запрос." });
    }

    const { email, password } = body.data;
    const isEmailValid = email.toLowerCase() === config.adminEmail.toLowerCase();
    const isPasswordValid = isEmailValid
      ? await bcrypt.compare(password, config.adminPasswordHash)
      : false;

    if (!isEmailValid || !isPasswordValid) {
      return reply.code(401).send({ error: "Неверный email или пароль." });
    }

    const token = fastify.jwt.sign({ email });
    return { token };
  });
}
