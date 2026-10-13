import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { join } from "path";
import * as schema from "./schema";

/**
 * Carga el catálogo de ejercicios desde free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db, datos abiertos ~870
 * ejercicios con músculos, equipamiento e instrucciones).
 * Idempotente: upsert por source_id. Corre con npm run db:seed:exercises.
 */

const URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

interface RemoteExercise {
  id: string;
  name: string;
  category: string;
  level: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

const db = drizzle(new Database(join(process.cwd(), "data", "saludlog.db")), {
  schema,
});

async function main() {
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`No se pudo descargar el catálogo (${res.status})`);
  const data = (await res.json()) as RemoteExercise[];

  db.transaction((tx) => {
    for (const e of data) {
      tx.insert(schema.exercises)
        .values({
          sourceId: e.id,
          name: e.name,
          category: e.category,
          level: e.level,
          equipment: e.equipment,
          primaryMuscles: e.primaryMuscles,
          secondaryMuscles: e.secondaryMuscles,
          instructions: e.instructions,
        })
        .onConflictDoUpdate({
          target: schema.exercises.sourceId,
          set: {
            name: e.name,
            category: e.category,
            level: e.level,
            equipment: e.equipment,
          },
        })
        .run();
    }
  });

  console.log(`seed:exercises → ${data.length} ejercicios`);
}

main();
