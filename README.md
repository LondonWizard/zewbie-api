# Zewbie Universal API

NestJS-based multi-tenant e-commerce platform API. Manages stores, catalogs, orders, payments, shipping, analytics, and administration for the Zewbie marketplace.

## Architecture

**Runtime:** Node.js + NestJS 11  
**ORM:** Prisma 7 (PostgreSQL)  
**Databases:** Primary (transactional), Analytics, Audit (planned)  
**Docs:** Swagger at `/api/docs`

### Module Map

| Module | Prefix | Purpose |
|---|---|---|
| `auth` | `/auth` | Registration, login, JWT, 2FA, social auth |
| `users` | `/users` | User profile, password, notifications |
| `stores` | `/stores` | Store CRUD, pages, themes, domains, publishing |
| `storefront` | `/storefront` | Public store rendering, cart, checkout |
| `catalog` | `/catalog` | Product browsing, categories, search |
| `retailers` | `/retailers` | Retailer dashboard: products, inventory, orders, payouts |
| `orders` | `/orders` | Order management and tracking |
| `payments` | `/payments` | Stripe checkout, webhooks, payment methods |
| `shipping` | `/shipping` | Rates, labels, tracking, carriers |
| `media` | `/media` | File uploads (S3) |
| `integrations` | `/integrations` | Third-party connections, social posting |
| `analytics` | `/analytics` | Sales, traffic, product, customer analytics |
| `admin` | `/admin` | User/retailer/catalog/order/finance administration |
| `notifications` | `/notifications` | In-app notifications and preferences |
| `webhooks` | `/webhooks` | Outbound webhook management |
| `system` | `/system` | Health checks, status, version |

### Key Files

- `prisma/schema.prisma` — Database models (User, Store, Product, Order, Payment, etc.)
- `prisma/prisma.config.ts` — Prisma 7 datasource configuration
- `src/config/configuration.ts` — Centralised env var loading
- `src/prisma/` — Global PrismaService singleton
- `src/app.module.ts` — Root module importing all feature modules
- `src/main.ts` — Bootstrap with CORS, helmet, compression, validation, Swagger

## Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations (requires running PostgreSQL)
npx prisma migrate dev

# Start development server
npm run start:dev
```

The API starts on `http://localhost:3000` with Swagger docs at `http://localhost:3000/api/docs`.

## Environment Variables

See `.env.example` for the full list. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Token signing key
- `STRIPE_SECRET_KEY` — Stripe payments
- `AWS_S3_BUCKET` — Media storage
- `PORT` — Server port (default 3000)

## Current State

All 155+ routes are scaffolded with placeholder responses returning `{ message, status: "not_implemented" }`. The Prisma schema defines 10 production-ready models. Implementation of business logic, auth guards, and integrations is the next phase.
