# Security Policy

saludlog is a local-first, single-user app: all data lives in a local SQLite file (`data/saludlog.db`) and nothing is sent to any server by the app itself. The only outbound request is an optional, user-triggered food search against the OpenFoodFacts public API.

## Reporting a vulnerability

Please do not open public issues for security problems. Report them via [GitHub's private vulnerability reporting](../../security/advisories/new) or by contacting the maintainer directly.

## Notes for contributors

- Personal databases, logs and health files are gitignored (`data/`, `*.db`, `health/`, `.env*`). Verify `git ls-files` before pushing — no personal data should ever be committed.
- The demo database (`demo/saludlog-demo.db`) must contain synthetic data only.
- All SQL goes through Drizzle with bound parameters. Never interpolate user input into queries.
- Server Actions validate all input with zod before touching the database.
