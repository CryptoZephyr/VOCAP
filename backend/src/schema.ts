import { readFile } from "node:fs/promises";

export async function loadMigrationSql(): Promise<string> {
  const migrationUrl = new URL("../migrations/001_initial.sql", import.meta.url);
  return readFile(migrationUrl, "utf8");
}
