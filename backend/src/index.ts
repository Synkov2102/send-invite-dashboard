import { buildApp } from "./app.js";
import { config } from "./config.js";
import { closeMongoClient } from "./db/mongo.js";

async function main() {
  const app = await buildApp();

  await app.listen({ port: config.port, host: "0.0.0.0" });

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, async () => {
      await app.close();
      await closeMongoClient();
      process.exit(0);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
