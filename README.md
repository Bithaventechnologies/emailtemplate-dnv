# Email Platform

A production-oriented internal email operations platform: branded template
authoring, recipient/list management with CSV import, campaign sending
through Resend, and delivery/open/click tracking via Resend webhooks.

## Architecture

```
apps/web   Next.js 15 (App Router) admin dashboard
apps/api   NestJS 10 REST API + BullMQ worker process
packages/types   Shared Zod schemas (source of truth for API contracts)
packages/email   MJML-based email rendering pipeline (preview/test/send share one path)
prisma/schema.prisma   PostgreSQL schema (Prisma)
```

Sending flow:

```
Admin → API (create Campaign, snapshot template/branding/signature)
      → API (send: enqueue one BullMQ job per recipient)
      → Worker (idempotency check → Resend → store providerMessageId)
      → Resend → Webhook (Svix-signed) → API verifies → updates EmailMessage/EmailEvent
```

## Tech stack

- **Frontend**: Next.js 15, TypeScript strict, Tailwind CSS, TanStack Query, React Hook Form + Zod, Zustand (compose wizard), Recharts.
- **Backend**: NestJS 10, TypeScript strict, Prisma, class-validator, BullMQ + Redis, Argon2id, Svix (webhook verification).
- **Database**: PostgreSQL.
- **Email provider**: Resend.

## Folder structure

```
email-platform/
├── apps/
│   ├── web/            Next.js admin app
│   └── api/             NestJS API + worker (apps/api/src/queue/worker.main.ts)
├── packages/
│   ├── types/            Shared Zod schemas
│   └── email/             MJML rendering pipeline
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── docs/
│   ├── resend-webhooks.md
│   └── domain-authentication.md
├── docker-compose.yml
└── .env.example
```

## Environment variables

Copy `.env.example` to `.env` and fill in real values before running against
live infrastructure. Placeholder values are fine for local development
without a live Resend account — sends will fail against the Resend API, but
every other code path (auth, templates, recipients, campaign creation,
queueing) works.

Key variables:

- `DATABASE_URL` — PostgreSQL connection string.
- `REDIS_URL` — BullMQ queue backend.
- `SESSION_SECRET` — used to sign/validate session-related material; set a long random value in production.
- `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`.
- `STORAGE_DRIVER` (`local` by default), `STORAGE_LOCAL_DIR`, `STORAGE_PUBLIC_URL` — swap to an S3-compatible driver later without touching callers.
- `NEXT_PUBLIC_API_URL` — the only variable the frontend reads directly.

## Local setup

```bash
pnpm install

# Start Postgres + Redis (requires Docker Desktop running)
docker compose up -d postgres redis

# Generate the Prisma client
pnpm prisma:generate

# Run migrations (creates tables)
pnpm prisma:migrate

# Seed default categories, an admin user, example branding/template/signature
pnpm prisma:seed
```

The seed script prints the admin login it creates. Override the seeded
credentials via `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars before
running `pnpm prisma:seed` if you don't want the defaults.

## Running in development

```bash
# API (HTTP server)
pnpm --filter api run dev

# API worker (BullMQ email-send processor — separate process)
pnpm --filter api run worker

# Web
pnpm --filter web run dev
```

Or run web + api together with `pnpm dev` from the repo root (the worker is
started separately since it's a distinct long-running process, not an HTTP
server).

## Running tests

```bash
pnpm --filter api run test
```

Covers CSV validation (duplicate/invalid/empty-row detection), template
variable extraction and rendering with missing variables, campaign
suppression filtering at send time, Resend webhook idempotency (a duplicate
provider event id must not double-count), session-guard rejection of
invalid/expired/revoked sessions, and login lockout after repeated failed
attempts.

## Building for production

```bash
pnpm build
```

## Deployment (Linux/VPS)

1. Provision PostgreSQL and Redis (managed or self-hosted).
2. Set real environment variables — do not reuse `.env.example` placeholders.
3. Run `pnpm prisma:deploy` to apply migrations without prompting.
4. Run `pnpm build`, then start `apps/api` (HTTP), `apps/api`'s worker
   process, and `apps/web` behind a reverse proxy (nginx/Caddy) terminating
   TLS.
5. Point Resend's webhook at your public API's `/webhooks/resend` endpoint —
   see `docs/resend-webhooks.md`.
6. Verify SPF/DKIM/DMARC for your sending domain in the Resend dashboard —
   see `docs/domain-authentication.md`. Deliverability depends on this far
   more than any in-app feature.

## Resend configuration

See `docs/resend-webhooks.md` for the exact webhook setup steps (event
types, signature verification, local development strategy via a tunnel).

Resend's exact webhook event names and payload shape are assumed based on
their generally documented pattern (`email.sent`, `email.delivered`,
`email.bounced`, etc.) — the mapping is isolated in
`apps/api/src/webhooks/resend-event-mapper.ts` specifically so it's a
one-place fix if the live payload differs once real credentials are wired
up.

## Security considerations

- Passwords hashed with Argon2id; sessions are opaque tokens hashed at
  rest, delivered only via an httpOnly, Secure, SameSite cookie.
- CSRF protected via a double-submit cookie for cookie-authenticated
  mutations.
- Login attempts are rate-limited and accounts lock out after repeated
  failures.
- File uploads are validated by real file signature (magic bytes), not
  just extension or client-supplied MIME type; raw SVG is rejected for
  logo uploads to avoid stored-XSS risk.
- Resend webhook payloads are verified via Svix signature before being
  trusted; invalid signatures are rejected with 401.
- The Resend API key is only ever read inside the API's Resend module —
  never sent to or exposed by the frontend.
- Suppressed recipients (hard bounce, complaint, unsubscribe, manual) are
  checked before every send, at both campaign-creation and worker-send
  time.

## Known TODOs (documented in code, listed here for visibility)

- Reconcile Resend webhook event names/payload shape against live
  documentation once real Resend credentials are available.
- Wire an actual "forgot password" email send (template + Resend call) —
  the token-issuing logic exists; only the outbound email is pending.
- Add a paginated per-recipient endpoint for campaign detail pages once
  campaign volumes make the current approach insufficient.
