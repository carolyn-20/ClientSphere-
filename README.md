# ClientSphere CRM

A full-stack educational CRM monorepo aligned to the 15-assessment ClientSphere brief.

## Included
- Next.js + TypeScript + Tailwind frontend
- Express + TypeScript REST API with JWT authentication and role checks
- PostgreSQL schema and Prisma ORM
- FastAPI sales intelligence service
- Redis + BullMQ worker foundation
- CSV lead import and lead scoring
- Sales pipeline, activities, dashboard, basic workflow rules
- Docker Compose, GitHub Actions, API docs, tests and architecture documentation

> This is a substantial runnable educational implementation, not a certified production CRM. Email/calendar/telephony providers are sandbox/mock adapters. Before production use, complete provider credentials, tenant isolation review, rate limiting, security hardening, backup/restore drills, monitoring, and broader automated tests.

## Quick start (Docker)
1. Copy `.env.example` to `.env` and change `JWT_SECRET`.
2. Run `docker compose up --build`.
3. API: http://localhost:4000/health
4. Web: http://localhost:3000
5. API docs: http://localhost:4000/api-docs
6. FastAPI docs: http://localhost:8000/docs

The API container synchronizes the Prisma schema to the local database and seeds demo data on startup. For production, replace schema sync with reviewed, committed Prisma migrations.

## Demo login
- Email: `admin@clientsphere.local`
- Password: `ChangeMe123!`

Change this password immediately outside a local demo environment.

## Local development
### API
```bash
cd apps/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```
### Web
```bash
cd apps/web
npm install
npm run dev
```
### Intelligence service
```bash
cd services/intelligence
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Main API routes
- `POST /api/auth/login`
- `GET|POST /api/leads`
- `GET|PATCH|DELETE /api/leads/:id`
- `GET|POST /api/contacts`
- `GET|POST /api/companies`
- `GET|POST /api/opportunities`
- `GET|POST /api/activities`
- `POST /api/imports/leads`
- `GET|POST /api/workflows`
- `GET /api/dashboard/summary`

All protected routes require `Authorization: Bearer <token>`.

## Project structure
- `apps/web` – Next.js interface
- `apps/api` – Express business API and Prisma data layer
- `services/intelligence` – FastAPI analytics service
- `infra` – deployment and database support
- `docs` – architecture, ER model, assessment mapping, runbook

## Important implementation notes
- PostgreSQL is the source of truth.
- Express owns CRM business entities and authorization.
- FastAPI receives analytics payloads and computes reproducible metrics; it does not own CRM records.
- CSV import normalizes email addresses and reports invalid rows.
- Workflow execution is intentionally bounded to safe demo actions (create a follow-up activity / log action); add approval and loop safeguards before real integrations.
- Tenant and record ownership rules are demonstrated in the API middleware and service layer; perform a formal security review before multi-tenant production use.
