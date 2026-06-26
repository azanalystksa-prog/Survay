# The Golden-Path Demo — 11 steps

Rehearse this exact click-through. It runs end to end with **zero errors, fully offline**.
It is also automated as a browser test: `npm run test:e2e` (with `npm run dev` running).

> **Before you start (or between rehearsals):** stop the server, run `npm run db:reset`,
> then `npm run dev`. This restores a clean, fully-populated demo state.

---

### 1 · Sign in as the Researcher
Open **http://localhost:3000**. Click **Dr. Sara Al-Otaibi**. The dashboard is already
populated — active studies, responses this week, your studies table with progress bars.

### 2 · Create Study → AI reviewer (Stage 1 · Design)
Go to **Create Study**. Click **Single choice** to add a question and set its text to
something leading, e.g. *“Don't you agree that our excellent new campus app is great?”*
(click outside the box to save). Click **Run review** in the AI panel → it flags a
**Leading question**. Click **Apply** → that one question is neutrally rephrased
(*“To what extent do you agree or disagree…”*); the others are untouched.
Add a couple more questions (try **Likert scale**) to round it out.

### 3 · Sample Designer (Stage 1 · Design)
Go to **Sample Designer**. Enter **Population = 42000**, **Confidence = 95%**,
**Margin = ±5%** → the required sample shows **n₀ = 384** with the **formula** printed
(and the finite-population-corrected n below it). Pick **Stratified** and define strata by
college; quotas compute from the percentages. Click **Save**.

### 4 · Ethics & IRB (Stage 1 · Design)
Go to **Ethics & IRB**. Click **Generate documents** → informed consent, info sheet, IRB
summary, and PDPL notice render with the study's real title/method/sample (toggle **ع** to
show Arabic versions). Click **Mark approved** → the **verification seal** appears with an
**approval number** (e.g. IRB-2026-xxxx).

### 5 · Launch the study
Back on **Create Study**, click **Launch**. The study moves to **Collecting** and now
appears in the panelist app for matching respondents.

### 6 · Switch to Panelist → take the survey
Top-right avatar menu → **Panelist**. Under **Surveys for you**, the matching study appears.
Tap **Take survey**, answer the questions, **Submit** → **points are awarded** (wallet
balance goes up). This is a real response flowing into the database.

### 7 · Back to Researcher → Live Monitor (Stage 2 · Collect)
Avatar menu → **Researcher** → **Live Monitor**. Valid-response count and charts reflect the
collected data; **representativeness per stratum** and the **quality engine** (speeders,
bots, duplicates, attention fails) are populated. Excluded responses aren't charged.

### 8 · Analysis (Stage 3 · Analyze)
Go to **Analysis**. Real **means / SD / frequencies** are computed from the answers,
**Cronbach's α** is shown for the Likert scale, and the **AI analysis assistant** suggests
the right test — **One-way ANOVA** (with the computed F and group means). Try **Export CSV**
and **SPSS/R codebook** — both download real files.

### 9 · Integrity Certificate
Go to **Integrity Certificate**. For a collected study click **Issue certificate** → a record
is created with method, valid/target, quality pass rate, bots blocked, collection window,
ethics approval number, and a unique **verify code**. Open **/verify/&lt;code&gt;** in a new
tab → it shows the certificate as **valid** (public chain-of-custody).

### 10 · Switch to Supervisor → co-sign
Avatar menu → **Supervisor** → **Oversight**. Open a certified study's “why you can trust
this data” panel and click **Co-sign** → the supervisor's name appears on the certificate
(and on its /verify page).

### 11 · (Optional) Enterprise anonymity rule
Avatar menu → **Enterprise** → **Workplace Insights**. Engagement by department is shown, and
any department with **fewer than 5 staff is hidden** — *“hidden — group too small”* — to
protect anonymity.

---

**If anything ever looks empty**, reset to the same rich, consistent state in either way:
- the **Reset demo** button in the avatar menu (top-right) — instant, no restart, or
- `npm run db:reset` with the server stopped, then `npm run dev`.
