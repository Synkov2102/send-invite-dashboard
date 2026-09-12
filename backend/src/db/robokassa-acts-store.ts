import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { ParsedRobokassaAct } from "../services/robokassa-act-parser.js";

export type RobokassaActRecord = ParsedRobokassaAct & {
  sourceFileName: string;
  importedAt: string;
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "robokassa-acts.json");

async function readAll(): Promise<RobokassaActRecord[]> {
  if (!existsSync(DATA_FILE)) {
    return [];
  }
  const raw = await readFile(DATA_FILE, "utf-8");
  return raw.trim() ? JSON.parse(raw) : [];
}

async function writeAll(acts: RobokassaActRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(acts, null, 2), "utf-8");
}

export async function listActs(): Promise<RobokassaActRecord[]> {
  const acts = await readAll();
  return acts.sort((a, b) => (a.periodFrom < b.periodFrom ? 1 : -1));
}

export async function upsertAct(act: RobokassaActRecord): Promise<void> {
  const acts = await readAll();
  const index = acts.findIndex((existing) => existing.actNumber === act.actNumber);
  if (index >= 0) {
    acts[index] = act;
  } else {
    acts.push(act);
  }
  await writeAll(acts);
}
