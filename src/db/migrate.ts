import path from "node:path";
import { pathToFileURL } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index";

export function runMigrations(): void {
  migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMigrations();
  console.log("Migrations applied.");
}
