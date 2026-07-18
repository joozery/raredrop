# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — runs `node server.js` (custom server: Next.js + Socket.IO + TrueMoney poller in one process). **Not** `next dev`.
- `npm run dev:next` — plain `next dev` without Socket.IO/poller (realtime features silently no-op).
- `npm run build` then `npm start` — production must also run `node server.js`, never `next start`.
- `npm run lint` — ESLint.
- `npx tsc --noEmit` — typecheck. Note: there are pre-existing errors in `red-envelope`, `chat`, `Category.ts`, `ShopCategory.ts` unrelated to most work; check that your changes add no new ones.
- No test suite exists.

## What this is

Thai-language gacha/lootbox e-commerce site ("กล่องสุ่ม") — users top up coins, open boxes/games for prizes, items land in their inventory/collection. Next.js 16 App Router, React 19, Tailwind 4, MongoDB via Mongoose 9, NextAuth 4. All UI text and most code comments are in Thai — follow that convention.

## Architecture

### Custom server (`server.js`)
Plain CommonJS, not compiled by Next. Hosts Next + Socket.IO on one port (path `/socket.io`), exposes the io instance as `globalThis.__io` so route handlers can emit via `src/lib/realtime.ts` (best-effort no-op if absent). Also runs a 5-second interval hitting `/api/internal/truemoney/poll` with header `x-internal-key: NEXTAUTH_SECRET` to match incoming TrueMoney transfers to pending top-ups server-side.

### Routing & auth
- `src/proxy.ts` — Next 16's replacement for `middleware.ts`; guards `/admin/*`, redirecting non-admins to `/admin-login`.
- `src/app/(storefront)/` — customer pages sharing the storefront layout (Header/Sidebar/BottomNav). `src/app/admin/` — back office; its menu lives in `src/app/admin/layout.tsx`.
- Auth is NextAuth (Google, LINE, Credentials+OTP) configured in `src/lib/auth.ts`; roles are `user | admin | super_admin`. **There is no `/login` page** — login is `LoginModal` opened from the Header; never redirect to `/login`.
- Admin API routes each verify role via `getServerSession(authOptions)` (look for a local `requireAdmin()` helper); internal routes use the `x-internal-key` header.
- `src/instrumentation.ts` boots the Discord bot (tickets/notifications) in the nodejs runtime.

### Money & prizes (the core invariants)
- Balances live on `User.coins` (baht) and `User.gemCoins`.
- Deduct atomically: `User.findOneAndUpdate({ _id, coins: { $gte: cost } }, { $inc: { coins: -cost } })` — insufficient funds changes nothing. If a later step fails (e.g. losing a race for a shared resource), refund with `$inc` and undo the claim.
- Every balance change writes a `Transaction` (`type` enum must include your feature, `amount`, `balanceAfter`, optional `referenceId`).
- Prize randomization/granting always happens server-side; the client only animates the returned result. Won items become `Inventory` docs (`status: "kept"` = user's collection page).
- After any server-side balance change, client calls `useBalance().refreshBalance()` (BalanceContext).
- Games follow this pattern: boxes (with pity via `PityCounter`), red-envelope, cards (shared 10-card rounds in `CardRound`). Shared game logic sits in `src/lib/` (e.g. `cardGame.ts`, `redEnvelope.ts`).

### Site settings
Key-value `Setting` model. New keys must be registered in the `DEFAULT_SETTINGS` array in `src/app/api/admin/settings/route.ts` to appear and be editable in the admin settings UI. Public pages read them via `/api/public-settings` or feature-specific config routes.

### Models
Every model file deletes its cached model (`delete mongoose.models.X`) before re-registering, so schema edits take effect without restarting. Follow this pattern in new models.

### Uploads & payments
- Images/videos upload to Cloudflare R2 (`src/lib/r2.ts`, `/api/upload`, `UploadInput` component); allowed image hosts are whitelisted in `next.config.ts`.
- Top-ups: TrueMoney wallet (server poller above) and PromptPay slip verification via Slip2Go (`doc/Slip2Go+API+Documentation.pdf`, `src/lib/thaiQr.ts`).

### Environment
Secrets in `.env.local`: `MONGODB_URI`, NextAuth (+ Google/LINE OAuth), Turnstile, Resend/Gmail (OTP email), Discord (bot + webhooks), TrueMoney tokens, Slip2Go key, R2 credentials.
