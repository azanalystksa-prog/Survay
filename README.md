# Easy Survey (إيزي سرفاي)

A working, demo-ready **research operating system for universities**. Design a study, get
AI help making it rigorous, size the sample with real statistics, collect from a verified
panel of students *and* professionals, monitor quality live, analyse the data, and finish
with a tamper-evident **Data Integrity Certificate** a supervisor can independently trust.

Runs **fully offline on a normal laptop** with one command after install. Pre-seeded with
realistic data so every screen looks alive before you click.

---

## Run it (offline, zero external services)

```bash
npm install
npm run db:reset   # creates + seeds the local SQLite database
npm run dev        # http://localhost:3000
```

Open **http://localhost:3000** and sign in with one click as any role.

> **Reset the demo to a clean state between rehearsals:** stop the dev server (Ctrl-C),
> run `npm run db:reset`, then `npm run dev` again. (SQLite is a single local file, so the
> reset must run while the server is stopped.)

### Optional: live AI

The AI features (questionnaire reviewer, method recommender, test suggester) work **with or
without** an API key. With no key they use a deterministic, rule-based fallback that is good
on its own — so the demo never depends on the internet. To enable the live Anthropic model,
set `ANTHROPIC_API_KEY` in `.env`; the app uses `claude-sonnet-4-6` and silently falls back
on any error or timeout.

---

## Tech stack

- **Next.js 14 (App Router) + TypeScript**
- **Tailwind CSS** (custom design system; Arabic-first with full RTL + EN/ع toggle)
- **SQLite + Prisma** (one local file — no Docker, no cloud)
- **Recharts** charts · **lucide-react** icons
- **Anthropic SDK** with a deterministic offline fallback (`lib/ai.ts`)

## Demo accounts (one-click on the sign-in screen)

| Role | Who | Lands on |
|------|-----|----------|
| Researcher | Dr. Sara Al-Otaibi | Dashboard |
| Supervisor | Dr. Khalid Al-Harbi | Oversight |
| Panelist | Faisal Al-Qahtani | Phone app |
| Panel Ops (Admin) | Panel Ops | Specialty Registry |
| Enterprise | Enterprise Admin | Workplace Insights |

Use the **avatar menu (top-right)** to switch roles instantly without retyping anything.

## The golden-path demo

See **[DEMO.md](./DEMO.md)** for the exact 11-step click-through to rehearse.

## Real math, not faked

All formulas are implemented for real in `lib/stats.ts` and unit-tested:

- **Cochran sample size** `n₀ = Z²·p(1−p)/e²` (p=0.5) with **finite-population correction**
  `n = n₀ / (1 + (n₀−1)/N)`. N=42000, 95%, ±5% → **n₀ ≈ 384**.
- **Cronbach's α** `α = (k/(k−1))·(1 − ΣVar(itemᵢ)/Var(total))`, computed over real answers.
- Descriptives (mean, sample SD, frequencies, cross-tabs), one-way **ANOVA F**, and a
  suggested-test **decision tree** (t-test / ANOVA / chi-square / correlation).

### Tests

```bash
npm test               # statistics unit tests (no DB/server needed)
npm run test:integration   # engine tests against the seeded DB (AI fallback, submission, stats, certs)
npm run test:e2e           # full golden-path browser test (requires `npm run dev` running)
```

## Project layout

```
app/                 # App Router pages, route groups, server actions, API routes
  (app)/             #   authenticated shell (sidebar + topbar)
  verify/[code]/     #   public certificate verification
  api/export/        #   real CSV + SPSS/R codebook downloads
components/           # UI kit, charts, builder, phone frame, verification seal, …
lib/                  # stats, ai (+fallback), queries, matching, strings (EN/AR), session
prisma/              # schema + deterministic seed
scripts/             # db reset, unit/integration/e2e tests
```

## Scope notes

Payments, SMS/email, and national-ID verification are cleanly **simulated** (clearly, not in
a broken way). All data stays local in SQLite. The AI never blocks or errors the UI.
