import { MongoClient, type Db } from "mongodb";
import { config } from "../config.js";

let clientPromise: Promise<MongoClient> | undefined;

export function getMongoClient(): Promise<MongoClient> {
  clientPromise ??= new MongoClient(config.mongodbUri, {
    serverSelectionTimeoutMS: 7000,
  }).connect();

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(config.mongodbDb);
}

export async function closeMongoClient(): Promise<void> {
  if (!clientPromise) return;
  const client = await clientPromise;
  await client.close();
}
