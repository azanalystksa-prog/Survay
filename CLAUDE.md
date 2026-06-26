# CLAUDE.md

Guidance for working in this repository.

## What this is

**Easy Survey** — an offline-first, demo-ready research platform for universities
(Next.js 14 App Router + TypeScript + Tailwind + Prisma/SQLite). It is built to be
presented live, so **reliability and the golden-path demo matter more than feature count.**
See `README.md` (run/reset) and `DEMO.md` (the 11-step demo).

## Commands

```bash
npm run db:reset   # wipe + reseed SQLite (run with the dev server STOPPED)
npm run dev        # start on http://localhost:3000
npm run build      # production build / full type-check
npm test           # statistics unit tests (no DB/server needed)
npm run test:integration   # engine tests vs the seeded DB
npm run test:e2e           # Playwright golden-path test (needs dev running)
```

> The dev server holds an open SQLite handle. `npm run db:reset` deletes the DB file, so
> **stop the server first**, or use the in-app **Reset demo** button / `seedDatabase(prisma)`
> which reseed via `deleteMany` on the live connection (safe).

## Architecture

- **`app/`** — App Router. `app/(app)/` is the authenticated shell (sidebar + topbar);
  `app/page.tsx` is sign-in; `app/verify/[code]/` is the public certificate check;
  `app/api/export/` are real CSV + codebook downloads. Mutations live in `app/actions/*`
  (server actions); pages read `searchParams`/cookies and are dynamic.
- **`lib/`** — pure logic and data access:
  - `stats.ts` — Cochran, FPC, Cronbach's α, ANOVA, suggested-test decision tree (unit-tested).
  - `ai.ts` — questionnaire reviewer / method recommender / test suggester. **Always returns a
    structured shape and never throws.** Uses the Anthropic API when `ANTHROPIC_API_KEY` is set
    (model `claude-sonnet-4-6`, 8s timeout), otherwise a deterministic rule-based fallback.
  - `queries.ts` — study stats + analysis computed from real responses.
  - `matching.ts` — panelist ↔ study audience matching.
  - `strings.ts` — EN/AR dictionary + `t(key, lang)`; `session.ts` — cookie-based identity/lang.
- **`prisma/`** — `schema.prisma` and a deterministic `seed.ts` exporting `seedDatabase(prisma)`
  (no top-level execution; `seed-run.ts` is the CLI entry).

## Conventions / gotchas

- **SQLite has no native enums.** Schema "enum" fields are `String`, constrained by TypeScript
  unions in `lib/enums.ts`. Keep the two in sync.
- **i18n is server-driven.** Pages call `getLang()` and pass `lang` to `t()` and to client
  components as a prop (no React context for language). Full RTL via `dir` on `<html>`.
- **AI must never block/error the UI.** Add features behind `lib/ai.ts` with a good fallback.
- **The sample-size headline is the rounded Cochran n₀** (384 for 42000/95%/±5%); the
  finite-population-corrected `n` is shown beneath it. Don't "fix" 384→381.
- **Seed invariants the golden path depends on:** the demo panelist
  (`panelist.demo@ksu.edu.sa`) is excluded from seeded responses (so they have a matching,
  unanswered survey); the "AI tools" study has a SINGLE grouping + Likert items (so ANOVA +
  alpha compute); the campus-transport certificate is seeded unsigned (so co-sign is demoable).
- Demo personas are keyed by stable emails in `lib/demo-accounts.ts`; the role switcher and
  one-click sign-in rely on them.

## Before you commit

Run `npm run build` (type-check) and the relevant tests. The golden path (`DEMO.md`) is the
contract — if you touch the builder, sample designer, analysis, certificate, or panelist flow,
re-run `npm run test:e2e` (with `npm run dev` running).
