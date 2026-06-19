# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read AGENTS.md first** — this codebase uses Next.js 16, which has breaking changes vs. older versions.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # prisma generate + next build
npm run db:push      # Push schema changes to database (reads .env.local)
npm run db:seed      # Seed admin user + sample cards/packs
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:studio    # Open Prisma Studio
```

All database commands require `.env.local` with a valid `DATABASE_URL`.

## Critical Framework Versions & Breaking Changes

### Next.js 16
- **Middleware**: file is `src/proxy.ts`, exported function must be named `proxy` (not `middleware`, not a default export)
- **Route params**: always `await params` — they are Promises: `{ params: Promise<{ id: string }> }`
- **No `RouteContext` type**: use inline param types in route handlers
- **`useSearchParams`**: must be in a child component wrapped with `<Suspense>`

### Prisma 7.8.0
- **Generator**: `provider = "prisma-client"` (not `prisma-client-js`)
- **Generated output**: `src/generated/prisma/` — always import from `@/generated/prisma/client` (the `/client` suffix is required)
- **No `url` in datasource**: `prisma/schema.prisma` datasource block has NO `url` field — connection URL lives in `prisma.config.ts`
- **Driver adapter required**: `@prisma/adapter-pg` is passed to `PrismaClient` in `src/lib/prisma.ts`
- **`prisma.config.ts`**: uses `config({ path: ".env.local" })` from dotenv to load env vars; `import "dotenv/config"` does NOT work here

### shadcn/ui v4 with @base-ui/react
- **`Button` has no `asChild` prop**: use `render` prop instead: `<Button render={<Link href="/path" />}>Label</Button>`
- **`Select.onValueChange`**: receives `string | null` — type the callback: `(v: string | null) => { if (v) setState(v) }`

### NextAuth v5
- Env var is `AUTH_SECRET` (not `NEXTAUTH_SECRET`); production also needs `AUTH_URL` set to the deployment URL
- Custom session fields (`role`, `isBanned`) require double cast: `(session.user as unknown as { role: string }).role`

## Architecture

### Route Groups
| Group | Path prefix | Auth check |
|---|---|---|
| `(auth)` | `/login`, `/register` | public |
| `(app)` | `/collection`, `/redeem`, `/trades`, `/marketplace`, `/packs` | `requireAuth()` in layout |
| `(admin)` | `/admin/*` | `requireAdmin()` in layout |

`src/proxy.ts` enforces auth/role/ban at the edge before any route renders. Layouts call `requireAuth()` / `requireAdmin()` from `src/lib/session.ts` as a server-side defense-in-depth layer. All `/api/admin/*` routes also call these helpers.

### Key Libraries (`src/lib/`)
- `prisma.ts` — singleton PrismaClient with PrismaPg adapter
- `auth.ts` — NextAuth config: Credentials provider, JWT callbacks embed `id`, `role`, `isBanned` into token
- `session.ts` — `requireAuth()` and `requireAdmin()` using React `cache`; redirect on failure
- `codes.ts` — `generateCode()` / `generateCodes(n)` using `crypto.getRandomValues`; format `XXXX-XXXX-XXXX-XXXX`, alphabet excludes ambiguous chars
- `packs.ts` — `weightedDraw(slots, count)` server-side weighted random selection
- `rarity.ts` — `RARITY_WEIGHTS`, `RARITY_COLORS`, `RARITY_LABELS`, `RARITY_BADGE_COLORS` keyed by `Rarity` enum

### Data Flow Patterns

**Code redemption** (`POST /api/cards/redeem`): single Prisma transaction — find unredeemed code → mark redeemed → create `CollectionEntry`. The `@unique` constraint on `RedemptionCode.code` prevents double-redemption races.

**Trade acceptance** (`PATCH /api/trades/[tradeId]/respond`): `prisma.$transaction` — `updateMany` `CollectionEntry.userId` for both sides atomically, update `Trade.status`.

**Pack opening** (`POST /api/packs/[packId]/open`): transaction — decrement `coinBalance`, run `weightedDraw`, create `CollectionEntry` + `PackOpen` + `PackOpenResult` rows.

**Marketplace purchase**: Stripe webhook only (`POST /api/webhooks/stripe`). Flow: buyer triggers `POST /api/checkout` → Stripe-hosted checkout → `checkout.session.completed` webhook → idempotent transaction (checks `listing.status !== 'SOLD'` first) → transfers `CollectionEntry.userId` to buyer. Webhook uses raw body (`request.text()`) for signature verification.

### CollectionEntry as the ownership record
`CollectionEntry` is the canonical ownership record — one row per owned copy (users can own multiple copies of the same card). Transferring ownership for trades or marketplace purchases means updating `CollectionEntry.userId`, not creating new rows. The `source` field tracks how it was obtained: `"REDEEM"` | `"TRADE"` | `"PACK"` | `"PURCHASE"`.

### Card "lock" logic
A card copy is considered locked (not tradeable/listable) if its `CollectionEntry` has an associated `TradeItem` (PENDING trade) or active `Listing`. These relations are checked at offer creation and re-validated at acceptance.

## Database

**Production**: Supabase — must use **Transaction Pooler URL** (port `6543`), not direct connection (port `5432`). Direct connections fail from Vercel serverless.

Pooler URL format: `postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:6543/postgres`

## Deployment (Vercel)

- Vercel project **Framework Preset must be "Next.js"** in Build and Deployment settings
- `prisma generate` runs automatically before `next build` via the npm `build` script
- All `.env.local` variables must be added as Vercel Environment Variables
- `AUTH_URL` must be set to the production Vercel URL and redeployed after first deploy
- Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) must be set from the Stripe dashboard after registering the webhook endpoint

## Economy

| Feature | Currency |
|---|---|
| Open packs | In-app **coins** (`User.coinBalance` integer) |
| Buy marketplace listings | Real money via **Stripe** |
| Admin awards coins | Direct DB update via admin panel (`/admin/users`) |

No coin purchase via Stripe in current version — admin grants them manually.
