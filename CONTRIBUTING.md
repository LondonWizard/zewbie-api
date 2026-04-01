# Contributing to Zewbie Universal API

Thanks for helping improve the Zewbie API. This document explains how we work on this NestJS + Prisma codebase.

## Prerequisites

- Node.js (LTS) and npm
- Docker (for local PostgreSQL/Redis via the **zewbie-infra** repo)
- Git

## Getting set up

```powershell
git clone <repository-url>
cd zewbie-api
npm install
copy .env.example .env
```

Start backing services (from zewbie-infra), then:

```powershell
npx prisma generate
npm run start:dev
```

Open `http://localhost:3000/api/docs` to confirm the app is running.

## Branching and pull requests

- Branch from `main` using a short, descriptive name (e.g. `feat/orders-cancel`, `fix/auth-refresh`).
- Keep pull requests focused: one concern per PR when possible.
- Describe **what** changed and **why** in the PR description; link issues if applicable.
- Ensure migrations are included when `schema.prisma` changes, and that `.env.example` is updated when new configuration is required.

## Code style

- Run **`npm run lint`** and fix issues before pushing.
- Use **`npm run format`** (Prettier) for consistent formatting.
- Follow existing NestJS patterns: feature modules with `*.module.ts`, `*.controller.ts`, `*.service.ts`.
- Prefer **DTOs** with `class-validator` decorators for request bodies and query params; the app uses a global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`.
- Add or update **Swagger** decorators (`@ApiTags`, `@ApiOperation`, etc.) on new or changed endpoints.

## Database and Prisma

- Never commit real secrets or production connection strings.
- Use **`npx prisma migrate dev`** during development to create named migrations.
- For production releases, CI/CD should run **`npx prisma migrate deploy`**.
- If you introduce new environment variables, document them in **README.md** and **`.env.example`**.

## Testing

- **Unit tests:** `npm run test`
- **E2E:** `npm run test:e2e`
- Add tests for non-trivial service logic and regressions when fixing bugs.

## Security

- Do not log tokens, passwords, or full payment payloads.
- Use parameterized queries via Prisma; avoid raw SQL unless necessary and reviewed.
- New public endpoints should consider authentication, authorization, and throttling.

## Questions

Use team channels or issues for design questions before large refactors. When in doubt, align with existing modules and Swagger as the public contract.
