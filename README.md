# Zewbie Universal API

Backend for the **Zewbie** multi-tenant e-commerce platform: **NestJS 11**, **Prisma 7**, **PostgreSQL** (Supabase), with **Zod** validation, **Winston** logging, and **Sentry** error tracking. It powers creator stores, retailer tooling, catalog, orders, payments, shipping, analytics, admin operations, and integrations.

## API documentation

Interactive **OpenAPI (Swagger)** UI is served at:

**`/v1/api/docs`** — e.g. `http://localhost:3000/v1/api/docs` after you start the server.

All API routes are prefixed with `/v1/`.

## Quick start

Prerequisites: **Node.js 20+**, **npm 10+**.

```powershell
git clone <repository-url>
cd zewbie-api
npm install
copy .env.example .env   # Then fill in your credentials
npx prisma generate
npm run start:dev
```

The API listens on **`http://localhost:3000/v1`** (or `PORT` from `.env`).

Run migrations when the Supabase project is active:

```powershell
npx prisma migrate deploy
```

## Architecture overview

```text
Client / frontends
        │
        ▼
   NestJS API  (/v1 prefix)
   ├── Helmet (security headers)
   ├── Compression (gzip)
   ├── Dynamic CORS (multi-origin)
   ├── @nestjs/throttler (rate limiting)
   ├── Zod validation (DTOs)
   ├── Winston logging (dev/prod formats)
   ├── Sentry (error tracking + profiling)
   ├── Global exception filter
   ├── Response envelope interceptor
   └── Request logging interceptor
        │
        ├──► PostgreSQL (Supabase) ── Prisma ORM
        ├──► Redis (cache / sessions — ElastiCache in prod)
        ├──► AWS S3 (media uploads)
        └──► External: Clerk (auth), Stripe (deferred), SES (email)
```

### Key infrastructure patterns

- **Zod validation pipes** — DTOs defined as Zod schemas; `ZodValidationPipe` replaces class-validator for endpoint input validation.
- **Global exception filter** — Catches all exceptions, logs 5xx to Sentry, returns consistent `{ statusCode, message, timestamp, path }`.
- **Response envelope** — All successful responses wrapped in `{ success: true, data, timestamp }`.
- **Clerk auth guard** — `ClerkAuthGuard` extracts user ID from JWT Bearer tokens. Falls back to dev mode if Clerk secret is not configured.
- **Roles guard** — `RolesGuard` + `@Roles()` decorator for RBAC on admin/retailer endpoints.
- **Paginated responses** — Standard `{ items, meta: { page, limit, total, totalPages } }` shape.

## Module list

| Module | Prefix | Auth | Description |
|--------|--------|------|-------------|
| **Auth** | `/v1/auth` | Public | Register (user + retailer), login, password reset, Clerk webhook sync. |
| **Users** | `/v1/users` | Bearer | Current user profile, notifications, notification settings, activity. |
| **Stores** | `/v1/stores` | Bearer | Creator store CRUD, pages, theme, domain, publish, preview. |
| **Storefront** | `/v1/storefront` | Public | Public store resolution by slug/domain, pages, templates. |
| **Catalog** | `/v1/catalog` | Public | Product search/filter, categories, featured, single product. |
| **Retailers** | `/v1/retailers` | Bearer + RETAILER | Retailer profile, products CRUD, variants, dashboard stats. |
| **Orders** | `/v1/orders` | Bearer | Order creation, detail, store/customer queries, status updates. |
| **Payments** | `/v1/payments` | Bearer | Payment intents (mock), confirm, refund, order lookup. |
| **Shipping** | `/v1/shipping` | Bearer | Rate quotes (mock), tracking management. |
| **Media** | `/v1/media` | Bearer | S3 presigned upload URLs, file deletion. |
| **Integrations** | `/v1/integrations` | Bearer | Social platform connect/disconnect (IG, TikTok, FB, Pinterest, YouTube). |
| **Analytics** | `/v1/analytics` | Bearer | Store analytics, platform summary. |
| **Admin** | `/v1/admin` | Bearer + ADMIN | Dashboard, user management, retailer review, audit logs, suspend. |
| **Notifications** | `/v1/notifications` | Bearer | Unread count, mark read, mark all read. |
| **Webhooks** | `/v1/webhooks` | Public | Clerk + Stripe webhook receivers. |
| **System** | `/v1/system` | Public | Health (memory + DB), status, version. |

## Prisma schema

35+ models covering the full domain: users, retailer profiles, stores (pages, versions, presets, drafts, analytics), products (variants, diamond attributes, tags), store products, orders (sub-orders, transparency updates), payments, payouts, invoices, disputes, returns, notifications, social integrations, email campaigns, help center (articles, tickets), audit logs, feature flags, API keys, and user data collection (data records, IP history, device fingerprints, user sessions, user events, sales history).

Configuration: `prisma.config.ts` (root) + `prisma/schema.prisma`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase pooler). |
| `REDIS_URL` | Redis for cache/sessions (default `redis://localhost:6379`). |
| `JWT_SECRET` | Fallback JWT signing key (pre-Clerk). |
| `CLERK_SECRET_KEY` | Clerk server secret. |
| `STRIPE_SECRET_KEY` | Stripe API secret (deferred — mock fallbacks active). |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials for S3, SES, SQS. |
| `AWS_REGION` | AWS region (default `us-west-1`). |
| `AWS_S3_BUCKET` | Media bucket name. |
| `SENTRY_DSN` | Sentry error tracking DSN. |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID` / `CLOUDFLARE_ACCOUNT_ID` | Cloudflare. |
| `PORT` | HTTP port (default `3000`). |
| `NODE_ENV` | `development` / `production`. |
| `FRONTEND_URL` | CORS origins (comma-separated for multiple). |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | Rate limit window (seconds) and max requests. |

## Development workflow

1. **Branch** from `main` for features or fixes.
2. **Schema changes** — edit `prisma/schema.prisma`, then `npx prisma migrate dev`.
3. **Client** — `npx prisma generate` after schema changes.
4. **Serve** — `npm run start:dev` (watch mode with hot reload).
5. **Lint / test** — `npm run lint`, `npm run test`.
6. **API exploration** — use `/v1/api/docs` for request/response shapes.

## Key files

| Path | Role |
|------|------|
| `src/main.ts` | Bootstrap, /v1 prefix, Swagger, global pipes/filters/interceptors. |
| `src/instrument.ts` | Sentry initialization (imported first in main.ts). |
| `src/app.module.ts` | Root module wiring all feature modules + Sentry + Winston. |
| `src/config/configuration.ts` | Environment → typed config object. |
| `src/common/` | Shared infrastructure: guards, pipes, interceptors, decorators, DTOs. |
| `prisma/schema.prisma` | 35+ data models and enums. |
| `prisma.config.ts` | Prisma 7 config (datasource URL, migration path). |
| `.env` | Environment variables (gitignored). |

## Related repositories

- **zewbie-admin**, **zewbie-app**, **zewbie-retailer** — React frontends.
- **zewbie-infra** — Docker Compose for local stack; Terraform for AWS.

## License

Private / UNLICENSED (see `package.json`).
