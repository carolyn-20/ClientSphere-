# 15-assessment implementation map

| # | Assessment | Included foundation | Remaining validation / extension |
|---|---|---|---|
| 01 | CRM frontend | Dashboard, leads, pipeline UI | Full detail views, import wizard, accessibility review |
| 02 | CRM backend APIs | Auth, CRUD foundations for core entities | Complete CRUD coverage, pagination/filter contracts |
| 03 | Relational model | PostgreSQL Prisma schema, contact-company many-to-many | Opportunity team members, custom fields, richer dedupe keys |
| 04 | Access control | JWT, roles, lead ownership checks | Full field-level and tenant-level authorization |
| 05 | Python lead processing | API CSV-row import, validation, duplicate detection, score | Dedicated Python CSV upload service and benchmark |
| 06 | FastAPI intelligence | Forecast and conversion calculations | Velocity and prioritization models with business-approved assumptions |
| 07 | Workflow engine | Workflow rule storage | Queue-backed trigger execution, retries, loop protection and execution history |
| 08 | Integrations | Sandbox-ready boundary documented | Real sandbox provider setup, webhook signature verification and consent UI |
| 09 | Docker stack | Compose for web/API/Postgres/Redis/FastAPI | Dedicated worker image, persistent uploads and operational checks |
| 10 | Git collaboration | CI workflow and branch guidance | Configure protected branches and required reviews in GitHub |
| 11 | CI/CD | CI tests and builds | Image publishing, staging deployment and rollback secrets |
| 12 | Test strategy | API scoring and FastAPI tests | Full integration, E2E, security and concurrency suite |
| 13 | API documentation | Route inventory and OpenAPI metadata endpoint | Full generated OpenAPI schemas and Postman collection |
| 14 | Production deployment | Containerized services | Domain, HTTPS, private DB, backups, monitoring and restore evidence |
| 15 | Incident simulation | Audit records and safe error handling foundation | Run controlled incident drills, RCA and regression tests |

This matrix is deliberately transparent: a scaffold or mock is not represented as a completed external integration.
