export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { runMigrations } = await import("@/db/migrate");
  const { seedIfEmpty } = await import("@/db/seed");

  runMigrations();
  seedIfEmpty();
}
