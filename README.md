# Zewbie Universal API

Backend for the **Zewbie** multi-tenant e-commerce platform: **NestJS 11**, **Prisma 7**, and **PostgreSQL**. It powers creator stores, retailer tooling, catalog, orders, payments, shipping, analytics, admin operations, and integrations.

## API documentation

Interactive **OpenAPI (Swagger)** UI is served at:

**`/api/docs`** — e.g. `http://localhost:3000/api/docs` after you start the server.

## Quick start

Prerequisites: **Node.js** (LTS), **npm**, **Docker** (for local databases), and optionally the **[zewbie-infra](https://github.com/zewbie/zewbie-infra)** repo for the full local stack.

```powershell
git clone https://github.com/zewbie/zewbie-api.git
cd zewbie-api
npm install
copy .env.example .env
```

Start PostgreSQL (three instances), Redis, and optional local AWS/search services using Docker Compose from **zewbie-infra**:

```powershell
cd C:\Users\londo\Documents\GitHub\zewbie-infra\docker
docker compose up -d
cd C:\Users\londo\Documents\GitHub\zewbie-api
```

Align connection strings in `.env` with your Compose defaults (see **Environment variables**). Then:

```powershell
npx prisma generate
npm run start:dev
```

The API listens on **`http://localhost:3000`** (or `PORT` from `.env`). Run migrations when you are ready to evolve the schema:

```powershell
npx prisma migrate dev
```

## Architecture overview

- **Framework:** NestJS with global validation (`ValidationPipe`), **helmet**, **compression**, **CORS**, and **@nestjs/throttler** rate limiting.
- **Persistence:** Prisma ORM; configuration in `prisma/` and `src/prisma/`.
- **Config:** `src/config/configuration.ts` maps environment variables into a typed config object.
- **Scale:** **16 feature modules** plus **Prisma** infrastructure, exposing **155+ HTTP routes** (handlers on controllers; see Swagger for the live list).

```text
Client / frontends
        │
        ▼
   NestJS API (CORS, validation, throttling)
        │
        ├──► PostgreSQL (primary) ── Prisma
        ├──► PostgreSQL (analytics) — optional dedicated DB
        ├──► PostgreSQL (audit) — optional dedicated DB
        ├──► Redis (cache / sessions)
        └──► External: Stripe, S3, SMTP, Clerk, etc.
```

## Module list

Each module owns a URL prefix (see `@Controller` in each `*.controller.ts`). Prisma is global infrastructure, not a route prefix.

| Module | Prefix | Description |
|--------|--------|-------------|
| **Auth** | `/auth` | Registration (user + retailer), login, refresh, logout, password reset, email verification, 2FA, social auth, admin login. |
| **Users** | `/users` | Current user profile, password, notifications, activity. |
| **Stores** | `/stores` | Creator store CRUD, pages, theme, navigation, domain, publish, preview. |
| **Storefront** | `/storefront` | Public store by slug: pages, products, cart, checkout, order return. |
| **Catalog** | `/catalog` | Public product listing, categories, search, featured products. |
| **Retailers** | `/retailers` | Retailer-scoped `me/*` APIs: products, inventory, orders, payouts, shipping settings. |
| **Orders** | `/orders` | Order listing, detail, cancel, tracking, stats. |
| **Payments** | `/payments` | Checkout, Stripe webhook, saved payment methods. |
| **Shipping** | `/shipping` | Rates, labels, tracking, carriers. |
| **Media** | `/media` | Uploads, bulk upload, file metadata, delete, “my files”. |
| **Integrations** | `/integrations` | Connect/callback/disconnect/status per provider; social post and analytics helpers. |
| **Analytics** | `/analytics` | Sales, traffic, products, customers, overview. |
| **Admin** | `/admin` | Platform admin: users, retailers, catalog moderation, orders, disputes, finances, settings, audit log. |
| **Notifications** | `/notifications` | In-app notifications and read/settings endpoints. |
| **Webhooks** | `/webhooks` | Outbound webhook CRUD and delivery logs. |
| **System** | `/system` | Health, status, version. |

**Prisma** (`src/prisma/`) provides `PrismaService` to all modules.

## Environment variables

Copy `.env.example` to `.env` and set values for your environment. Reference:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Primary PostgreSQL connection string. |
| `ANALYTICS_DATABASE_URL` | Analytics PostgreSQL instance (optional / multi-DB). |
| `AUDIT_DATABASE_URL` | Audit PostgreSQL instance (optional / multi-DB). |
| `REDIS_URL` | Redis for cache/sessions (default `redis://localhost:6379`). |
| `JWT_SECRET` | Signing key for JWTs. |
| `JWT_EXPIRY` | Access token lifetime (e.g. `15m`). |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime (e.g. `7d`). |
| `CLERK_SECRET_KEY` | Clerk server secret (if using Clerk). |
| `STRIPE_SECRET_KEY` | Stripe API secret. |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret. |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | AWS credentials for S3 (and related). |
| `AWS_REGION` | AWS region (default `us-east-1`). |
| `AWS_S3_BUCKET` | Media bucket name. |
| `PORT` | HTTP port (default `3000`). |
| `NODE_ENV` | `development` / `production`, etc. |
| `FRONTEND_URL` | CORS origin for browser clients. |
| `API_VERSION` | Shown in Swagger metadata. |
| `SMTP_*` / `EMAIL_FROM` | Outbound email. |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | Rate limit window and max requests. |

## Database architecture (three PostgreSQL instances)

Zewbie separates concerns across **three logical PostgreSQL databases**:

1. **Primary** — transactional core (users, stores, products, orders, etc.) via `DATABASE_URL`.
2. **Analytics** — reporting-friendly or high-volume analytics data via `ANALYTICS_DATABASE_URL`.
3. **Audit** — append-heavy audit trails via `AUDIT_DATABASE_URL`.

Local development typically runs all three via **zewbie-infra** `docker/docker-compose.yml` (primary, analytics, audit containers on ports **5432**, **5433**, **5434**). Ensure database names and credentials in `.env` match your Compose file.

## Development workflow

1. **Branch** from `main` for features or fixes.
2. **Run dependencies** — Docker Compose from zewbie-infra for Postgres/Redis (and optional LocalStack/OpenSearch).
3. **Schema changes** — edit `prisma/schema.prisma`, then `npx prisma migrate dev` (or `db push` for throwaway local DBs).
4. **Client** — `npx prisma generate` after schema changes.
5. **Serve** — `npm run start:dev` (watch mode).
6. **Lint / test** — `npm run lint`, `npm run test`, `npm run test:e2e` as needed.
7. **API exploration** — use `/api/docs` for request/response shapes.

See **CONTRIBUTING.md** for branching, commits, and review expectations.

## Deployment

Typical production layout (see **zewbie-infra** for Terraform):

1. **Build** — `npm run build` → `dist/`.
2. **Run** — `npm run start:prod` (or `node dist/main`) on the host or in a container.
3. **Migrations** — `npx prisma migrate deploy` against the primary database (CI/CD or release step).
4. **Secrets** — inject all `.env` values via your platform (ECS task definitions, Parameter Store, Secrets Manager, etc.).
5. **Networking** — place the API behind an **ALB** with TLS; restrict **CORS** `FRONTEND_URL` to real portal origins.
6. **Observability** — health checks can target `/system/health` (and related system routes).

## Key files

| Path | Role |
|------|------|
| `src/main.ts` | Bootstrap, Swagger at `api/docs`, global pipes and middleware. |
| `src/app.module.ts` | Root module wiring all feature modules. |
| `src/config/configuration.ts` | Environment → config object. |
| `prisma/schema.prisma` | Data models. |
| `.env.example` | Documented environment template. |

## Current implementation note

Many handlers are scaffolded to return structured placeholders (e.g. `not_implemented`) while the route surface and Prisma models are stabilized. Implement services, guards, and integrations incrementally; use Swagger as the contract checklist.

## Related repositories

- **zewbie-admin**, **zewbie-app**, **zewbie-retailer** — React frontends.
- **zewbie-infra** — Docker Compose for local stack; Terraform for AWS.

## License

Private / UNLICENSED (see `package.json`).
