import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export const config = {
  mongodbUri: required("MONGODB_URI"),
  mongodbDb: process.env.MONGODB_DB ?? "invite",
  adminEmail: required("ADMIN_EMAIL"),
  adminPasswordHash: required("ADMIN_PASSWORD_HASH"),
  jwtSecret: required("JWT_SECRET"),
  siteBaseUrl: process.env.SITE_BASE_URL ?? "https://send-invite.online",
  yandexDirectToken: process.env.YANDEX_DIRECT_OAUTH_TOKEN ?? null,
  yandexDirectClientLogin: process.env.YANDEX_DIRECT_CLIENT_LOGIN ?? null,
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
