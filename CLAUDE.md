# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # prisma generate + next build
npm run db:push      # Push schema changes to database (reads .env.local)
npm run db:seed      # Seed admin user + sample cards/packs
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:studio    # Open Prisma Studio
```

**Important**: `npm run db:push` must use the direct Supabase connection (port `5432`) for DDL, not the Transaction Pooler. Override inline:
```bash
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres" npm run db:push
```
The Transaction Pooler URL (port `6543`) hangs on schema migrations but is required for Vercel runtime queries.

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
- **`prisma.config.ts`**: uses `config({ path: ".env.local" })` from dotenv; dotenv does NOT override env vars already set in the process, so passing `DATABASE_URL=... npx prisma db push` works

### shadcn/ui v4 with @base-ui/react
- **`Button` has no `asChild` prop**: use `render` prop instead: `<Button render={<Link href="/path" />}>Label</Button>`
- **`Select.onValueChange`**: receives `string | null` — type the callback: `(v: string | null) => { if (v) setState(v) }`

### NextAuth v5
- Env var is `AUTH_SECRET` (not `NEXTAUTH_SECRET`); production also needs `AUTH_URL` set to the deployment URL
- Custom session fields (`role`, `isBanned`) require double cast: `(session.user as unknown as { role: string }).role`

## Architecture

### Route Groups
| Group | Path prefix | Auth |
|---|---|---|
| `(auth)` | `/login`, `/register` | public |
| `(app)` | `/collection`, `/redeem`, `/trades`, `/marketplace`, `/packs`, `/coins`, `/settings`, `/users/[id]` | `requireAuth()` in layout |
| `(admin)` | `/admin/*` | `requireAdmin()` in layout |

`src/proxy.ts` enforces auth/role/ban at the edge before any route renders. Layouts call `requireAuth()` / `requireAdmin()` from `src/lib/session.ts` as defense-in-depth. All `/api/admin/*` routes also call these helpers.

### Key Libraries (`src/lib/`)
- `prisma.ts` — singleton PrismaClient with PrismaPg adapter
- `auth.ts` — NextAuth config: Credentials provider, JWT callbacks embed `id`, `role`, `isBanned` into token
- `session.ts` — `requireAuth()` and `requireAdmin()` using React `cache`; redirect on failure
- `codes.ts` — `generateCode()` / `generateCodes(n)` using `crypto.getRandomValues`; format `XXXX-XXXX-XXXX-XXXX`
- `packs.ts` — `weightedDraw(slots, count)` server-side weighted random selection
- `rarity.ts` — `RARITY_WEIGHTS`, `RARITY_COLORS`, `RARITY_BADGE_COLORS`, `RARITY_LABELS` keyed by `Rarity` enum
- `achievements.ts` — `ACHIEVEMENTS` array with `check(stats)` functions; computed dynamically (no DB storage)

### Client Component Pattern
Server pages serialize Prisma results (converting `Date` → `string`) before passing to client components. Client components never receive raw Prisma types. Example: `CollectionPage` → `CollectionClient`, `MarketplacePage` → `MarketplaceClient`.

`CardThumbnail` accepts a `CardLike` minimal type (not the full Prisma `Card`) so it works in both server and client component contexts.

### Data Flow Patterns

**Code redemption** (`POST /api/cards/redeem`): single transaction — find unredeemed code → mark redeemed → create `CollectionEntry`. `@unique` on `RedemptionCode.code` prevents double-redemption races.

**Trade acceptance** (`PATCH /api/trades/[tradeId]/respond`): `prisma.$transaction` — `updateMany` `CollectionEntry.userId` for both sides atomically, then update `Trade.status`. Also creates a `Notification` for the initiator.

**Pack opening** (`POST /api/packs/[packId]/open`): transaction — decrement `coinBalance`, run `weightedDraw`, create `CollectionEntry` + `PackOpen` + `PackOpenResult` rows. Epic/Legendary pulls trigger confetti in `PackOpener.tsx` via `canvas-confetti`.

**Marketplace purchase**: Stripe webhook only (`POST /api/webhooks/stripe`). Flow: buyer → `POST /api/checkout` → Stripe-hosted checkout → `checkout.session.completed` webhook → idempotent transaction (checks `listing.status !== 'SOLD'`) → transfers `CollectionEntry.userId` to buyer → creates seller `Notification`. Webhook uses raw body (`request.text()`) for signature verification.

**Coin purchase**: buyer → `POST /api/checkout/coins` → Stripe checkout with `metadata: { type: 'coin_purchase', userId, coinAmount }` → webhook branches on `metadata.type` → `User.coinBalance` incremented. Bundle prices are validated server-side against a hardcoded map to prevent manipulation.

**Daily login bonus** (`POST /api/daily-bonus`): called from `DailyBonusBanner` client component on every app page load. Checks `User.lastLoginBonus` — awards coins only if >24h since last claim. Streak resets if >48h gap. Max streak 5 = 50 coins/day.

**Notifications**: created inline in trade/webhook routes (no queue). `GET /api/notifications` returns unread count + last 15. `NotificationBell` polls every 30s. Marking read calls `PATCH /api/notifications` (no body needed).

### CollectionEntry as the ownership record
One row per owned copy. Transferring ownership = updating `CollectionEntry.userId`. The `source` field: `"REDEEM"` | `"TRADE"` | `"PACK"` | `"PURCHASE"`. A card is "locked" if its entry has an associated active `Listing` or `TradeItem`.

### Trade expiration
No cron job. The trade detail server component checks `expiresAt < now` on load and calls the respond API with `action: 'EXPIRE'` to lazily mark expired trades.

### Admin self-modification
Admins can update their own `coinBalance` via the admin panel but cannot change their own `role` or `isBanned` — enforced in `PATCH /api/admin/users/[userId]`.

## Database

**Production**: Supabase — runtime queries use Transaction Pooler URL (port `6543`). Schema migrations (`db:push`) require direct connection (port `5432`).

Pooler URL: `postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:6543/postgres`
Direct URL: `postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres`

## Deployment (Vercel)

- Framework Preset must be **"Next.js"** in Vercel Build settings
- `prisma generate` runs automatically before `next build` via the npm `build` script
- `AUTH_URL` must be set to the production Vercel URL
- `STRIPE_WEBHOOK_SECRET` must be set from the Stripe dashboard after registering `/api/webhooks/stripe`
- Schema changes require a manual `db:push` (direct URL) — Vercel deploy does not run this

## Economy

| Feature | Currency |
|---|---|
| Open packs | In-app **coins** (`User.coinBalance`) |
| Buy coins | Real money via Stripe → webhook → `coinBalance` incremented |
| Buy marketplace listings | Real money via Stripe → webhook → `CollectionEntry.userId` transferred |
| Admin awards coins | Admin panel `/admin/users` → `+ Coins` button |
| Daily login bonus | 10–50 coins/day (streak-based), auto-awarded on first page load |

## Stripe (Test Mode)
Keys are `sk_test_*` / `pk_test_*`. Use card `4242 4242 4242 4242` with any future expiry and any CVV to test payments. The webhook at `/api/webhooks/stripe` handles both `coin_purchase` and marketplace purchase events via `metadata.type`.
