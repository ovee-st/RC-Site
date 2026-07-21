# API Reference

Route handlers return JSON. Hardened responses include `x-correlation-id`; clients should include that ID in support reports. Errors use `{ error, code, correlationId }` with conventional HTTP status codes.

| Area | Prefix | Authentication |
| --- | --- | --- |
| Health | `/api/health` | Public; no secrets returned |
| Admin | `/api/admin/*` | Admin bearer token |
| ATS | `/api/pipeline`, `/api/recruitment/*`, `/api/interviews`, `/api/offers` | Employer/recruiter/admin permission |
| Talent CRM | `/api/talent-*`, `/api/career-pages`, `/api/referrals` | Employer/recruiter/admin permission |
| Candidate | `/api/applications`, `/api/candidates/*` | Candidate ownership or authorized recruiter |
| Support | `/api/live-chat`, `/api/support/*` | Authenticated role checks |
| Analytics | `/api/analytics` | Validated anonymous payload; optional user UUID |

API inputs are bounded and normalized by each route. Never place JWTs, email addresses, phone numbers, passwords, or storage secrets in logs or analytics parameters.
