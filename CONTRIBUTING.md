# Contributing

Thanks for your interest in saludlog. It's a local-first, single-user health tracker — contributions are welcome, but please keep the scope in mind: no auth, no cloud, no accounts.

> Español: este repo también se usa en español; issues y PRs en español o inglés son bienvenidos.

## Setup

```bash
npm install
npm run dev
```

The dev server creates and migrates `data/saludlog.db` automatically. Useful scripts:

```bash
npm run lint              # eslint
npm run build             # typecheck + production build
npm run db:generate       # generate a migration from src/db/schema.ts
npm run db:migrate        # apply pending migrations
npm run db:seed           # default habits + foods
npm run db:seed:demo      # ~35 days of synthetic data for charts/insights
npm run db:seed:exercises # exercise catalog (free-exercise-db)
```

## Rules

- **Never commit personal data.** `data/`, `*.db`, `health/` and `.env*` are gitignored — keep it that way. The only tracked database is `demo/saludlog-demo.db`, which contains synthetic data only (`npm run db:demo` regenerates it).
- TypeScript strict: no `any` unless justified.
- Conventional Commits in English (`feat:`, `fix:`, `refactor:`...), atomic.
- Never edit an already-applied migration in `drizzle/` — create a new one.
- UI strings must exist in both locales. Add the Spanish and English keys in the same `S` dict (`{ es: ..., en: ... }`) next to the component/page; server code resolves with `t(S, await getLocale())`, client components with `useT(S)`.
- Run `npm run lint` and `npm run build` before opening a PR.

## Stack notes

Next.js 16 with Cache Components and Partial Prefetching — check `node_modules/next/dist/docs/` if an API behaves differently than you expect. Drizzle ORM over better-sqlite3, shadcn/ui (Base UI), Tailwind v4, Recharts, date-fns, zod.
