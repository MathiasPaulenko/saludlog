import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

/**
 * Genera demo/saludlog-demo.db: una base lista para probar la app,
 * con el seed base (alimentos + hábitos), 35 días de datos sintéticos
 * y el catálogo de ejercicios. Corre con npm run db:demo.
 */

const file = join(process.cwd(), "demo", "saludlog-demo.db");
mkdirSync(join(process.cwd(), "demo"), { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) {
  rmSync(file + suffix, { force: true });
}
process.env.DB_FILE = file;

async function main() {
  const { runMigrations } = await import("./migrate.js");
  const { seedIfEmpty } = await import("./seed.js");

  runMigrations();
  seedIfEmpty();
  await import("./seed-demo.js");
  const { seedExercises } = await import("./seed-exercises.js");
  await seedExercises();

  console.log(`demo db → ${file}`);
}

main();
