# Security checklist before real deployment

- [ ] Replace demo credentials and JWT secret with managed secrets.
- [ ] Implement refresh-token rotation and revocation.
- [ ] Add tenant IDs to all tenant-owned records and enforce tenant scoping in every query.
- [ ] Add resource and field-level authorization for contacts, companies, opportunities and activities.
- [ ] Add webhook HMAC verification and replay protection.
- [ ] Add idempotency keys for externally retried writes.
- [ ] Configure strict CORS, HTTPS, secure headers and production rate limits.
- [ ] Add structured logs with request IDs; redact personal data and secrets.
- [ ] Add dependency/container scanning and security tests.
- [ ] Test encrypted backups and restore.
- [ ] Use synthetic demo data only.
