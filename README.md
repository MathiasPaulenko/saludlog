# saludlog

PWA local para tracking personal de salud: comidas con macros, entrenamientos, peso/medidas y hábitos diarios. 100% local (SQLite), un solo usuario, sin auth ni deploy.

## Stack

Next.js (App Router, Server Components, Server Actions) · TypeScript · Drizzle ORM + better-sqlite3 · shadcn/ui + Tailwind · Recharts · date-fns

## Desarrollo

```bash
npm install
npm run dev        # levanta en http://localhost:3000 (migra y seedea la DB al arrancar)
```

La base vive en `data/saludlog.db` (gitignored). Scripts útiles:

```bash
npm run db:generate   # genera migración desde src/db/schema.ts
npm run db:migrate    # aplica migraciones pendientes
npm run db:seed       # seedea hábitos y alimentos default (idempotente)
npm run db:seed:demo  # ~35 días de datos sintéticos para probar insights y gráficos
```

## Features

- **Dashboard** (`/`): estado del día vs metas, `?date=` para días pasados, tendencias 7/14/30d (peso, nutrición, entrenos, hábitos).
- **Comidas** (`/meals`): log multi-item con macros en vivo, historial diario, repetir comidas. Catálogo en `/foods` con import desde OpenFoodFacts.
- **Entrenos** (`/workouts`): vista semanal con editor de series.
- **Hábitos** (`/habits`): grid diario por unidad (check/número/horas/ml) + config.
- **Peso** (`/metrics`), **metas** (`/settings`), **reporte semanal** (`/weekly`), **insights** (`/insights`) con reglas explícitas.
- **Export**: JSON completo y CSV por dominio desde `/settings`.
- **PWA**: instalable (manifest + íconos + service worker básico).
