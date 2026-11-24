# Local runbook

## Start / stop
- `docker compose up --build`
- `docker compose down`
- `docker compose down -v` deletes local database data; use with care.

## Troubleshooting
- API cannot connect to database: wait for Postgres healthcheck; verify `DATABASE_URL`.
- Login fails: run seed (`cd apps/api && npm run seed`) or recreate local DB.
- Frontend cannot reach API: verify `NEXT_PUBLIC_API_URL` and browser access to port 4000.
- FastAPI health: `curl http://localhost:8000/health`.

## Backup example
`pg_dump -h localhost -U clientsphere clientsphere > clientsphere.sql`

## Restore example (local only)
`psql -h localhost -U clientsphere clientsphere < clientsphere.sql`

Validate restore procedures in a separate environment before production.
