# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js Version Warning

This project uses **Next.js 16.x** — a version with breaking changes from what you were trained on. Before writing any Next.js-specific code, consult `node_modules/next/dist/docs/`. Heed all deprecation notices.

One known difference: dynamic route params are now **async**. Always `await params` in route handlers:
```ts
export async function DELETE(req, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
```

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build + type check
npm run lint     # ESLint (ESLint 9 flat config)
```

No test runner is configured yet.

## Required Environment Variables

Copy `env.example` to `.env.local` and fill in:
- `ADMIN_API_KEY` — Bearer token protecting all `/api/admin/*` routes
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob token (set automatically on Vercel)

## Architecture

**What it does:** Returns whether the business is currently open (`GET /api/open` → `{ "open": true/false }`). Admins can block out special closing days via a protected API.

### Open/Closed Decision Chain (`src/lib/business-hours.ts`)

`isOpen()` evaluates in strict order — short-circuits on first `false`:
1. Weekday check (Mon–Fri only)
2. Time window check (08:00–16:00, always **Europe/Copenhagen** timezone)
3. Danish public holiday → `src/lib/kalendarium.ts`
4. Special closing day → `src/lib/storage.ts`

### Storage (`src/lib/storage.ts`)

Closing days are stored as a single private JSON blob (`closing-days.json`) in Vercel Blob. There is no database. All reads go through `readDays()`, which fetches the blob directly (with `Authorization: Bearer $BLOB_READ_WRITE_TOKEN` because the blob is private).

### Holiday Lookup (`src/lib/kalendarium.ts`)

Calls `https://api.kalendarium.dk/Dayinfo/DD-MM-YYYY` (note: API expects DD-MM-YYYY, not YYYY-MM-DD). **The top-level `holliday` field in the response is unreliable — always use `data.events.find(e => e.holliday === true)` instead.** Fails open (returns `{ holiday: false }`) if the external API is down. Results are cached in a module-level `Map` for the process lifetime, plus Next.js `revalidate: 3600`.

### Admin API (`src/app/api/admin/closing-days/`)

All routes require `Authorization: Bearer <ADMIN_API_KEY>`. Auth uses `crypto.timingSafeEqual()` for constant-time comparison.

- `GET /api/admin/closing-days` — list all closing days
- `POST /api/admin/closing-days` — add a closing day (`{ date: "YYYY-MM-DD", reason?: string }`)
- `DELETE /api/admin/closing-days/[date]` — remove a closing day

### Admin UI (`src/app/admin/page.tsx`)

Client component. Prompts for the API key once, stores it in React state, and sends it as a Bearer token with every request. No session/cookie — refreshing the page clears the key.
