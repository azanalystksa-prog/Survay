// End-to-end golden-path test driving the real app with Playwright + pre-installed Chromium.
import { chromium } from "playwright-core";
import { PrismaClient } from "@prisma/client";

// Make the test idempotent: clear the demo panelist's responses so a matching survey
// is always available (a real `npm run db:reset` does the same for the live demo).
const prisma = new PrismaClient();
const demo = await prisma.panelistProfile.findFirst({ where: { user: { email: "panelist.demo@ksu.edu.sa" } } });
if (demo) {
  await prisma.answer.deleteMany({ where: { response: { panelistId: demo.id } } });
  await prisma.response.deleteMany({ where: { panelistId: demo.id } });
}
// Start the builder from a clean slate: remove any leftover DRAFT studies.
await prisma.study.deleteMany({ where: { status: "DRAFT" } });
await prisma.$disconnect();

const EXEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = "http://localhost:3000";
let pass = 0, fail = 0;
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name} ${detail}`); }
}

const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const page = await (await browser.newContext()).newPage();
page.setDefaultTimeout(25000);

async function switchRole(role) {
  await page.locator("header button").last().click();
  await page.getByRole("button", { name: new RegExp(`^${role}$`) }).click();
  await page.waitForLoadState("networkidle");
}

try {
  // 1. Sign in as Researcher
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByText("Dr. Sara Al-Otaibi").click();
  await page.waitForURL("**/researcher/dashboard");
  check("1. Sign in as researcher → dashboard", page.url().includes("/researcher/dashboard"));
  await page.getByText("AI tools in higher education").first().waitFor();
  check("   dashboard shows seeded study", true);

  // 2. Create Study → add a question, make it leading, AI flags it, Apply rewrites it
  await page.goto(`${BASE}/researcher/create`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Single choice" }).click();
  // textareas: [description, question1]; the question is the last one.
  await page.waitForFunction(() => document.querySelectorAll("textarea").length >= 2);
  const qBox = page.locator("textarea").last();
  await qBox.fill("Don't you agree that our excellent new campus app is great?");
  await qBox.blur();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Run review" }).click();
  await page.getByText(/Leading question/i).first().waitFor();
  check("2. AI reviewer flags leading question", true);
  await page.getByRole("button", { name: /^Apply$/ }).first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(
    () => Array.from(document.querySelectorAll("textarea")).some((t) => t.value.includes("To what extent")),
  );
  check("   Apply rephrased that question neutrally", true);

  // 3. Sample Designer → 42000 / 95% / ±5% → n₀ 384
  await page.goto(`${BASE}/researcher/sample`, { waitUntil: "networkidle" });
  await page.locator("input[type=number]").first().fill("42000");
  await page.getByRole("button", { name: "95%" }).click();
  await page.waitForTimeout(400);
  check("3. Sample designer computes n₀ = 384", await page.getByText(/^384$/).first().isVisible());

  // 4. Ethics → generate (if needed) → approve → seal + approval number
  await page.goto(`${BASE}/researcher/ethics`, { waitUntil: "networkidle" });
  const gen = page.getByRole("button", { name: "Generate documents" });
  if (await gen.isVisible().catch(() => false)) { await gen.click(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800); }
  const approve = page.getByRole("button", { name: "Mark approved" });
  if (await approve.isVisible().catch(() => false)) { await approve.click(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(800); }
  check("4. Ethics approved → approval number shown", await page.getByText(/IRB-2026-/).first().isVisible().catch(() => false));

  // 5+6. Switch to Panelist → take a matching survey → points awarded
  await switchRole("Panelist");
  await page.waitForURL("**/panelist");
  const take = page.getByText(/Take survey/i).first();
  await take.waitFor();
  await take.click();
  await page.getByRole("button", { name: /^Submit$/ }).waitFor();
  // Answer Likert (pick a column), single options (radio span), numbers
  for (const b of await page.locator("button:has-text('Agree')").all()) await b.click().catch(() => {});
  for (const b of await page.locator("button:has(span.rounded-full)").all()) await b.click().catch(() => {});
  for (const inp of await page.locator("input[type=number]").all()) await inp.fill("5");
  await page.getByRole("button", { name: /^Submit$/ }).click();
  await page.getByText(/Points awarded/i).waitFor();
  check("6. Panelist submitted survey → points awarded", true);

  // 7. Back to researcher → monitor reflects data
  await switchRole("Researcher");
  await page.goto(`${BASE}/researcher/monitor`, { waitUntil: "networkidle" });
  check("7. Live monitor renders representativeness", await page.getByText(/Representativeness/i).isVisible());

  // 8. Analysis shows alpha + suggested test
  await page.goto(`${BASE}/researcher/analysis`, { waitUntil: "networkidle" });
  check("8. Analysis shows Cronbach's alpha", await page.getByText(/Cronbach/i).first().isVisible());
  check("   Analysis suggests ANOVA", await page.getByText(/ANOVA/i).first().isVisible().catch(() => false));

  // 9. Certificate present + /verify valid
  await page.goto(`${BASE}/researcher/certificate`, { waitUntil: "networkidle" });
  const verifyText = await page.getByText(/\/verify\/ES-/).first().textContent().catch(() => null);
  check("9. Certificate with verify code present", !!verifyText);
  if (verifyText) {
    const code = verifyText.trim().split("/").pop();
    await page.goto(`${BASE}/verify/${code}`, { waitUntil: "networkidle" });
    check("   /verify/[code] shows valid", await page.getByText(/This certificate is valid/i).isVisible());
  }

  // 10. Supervisor co-sign (navigate back into the app shell first — verify page has no topbar)
  await page.goto(`${BASE}/researcher/dashboard`, { waitUntil: "networkidle" });
  await switchRole("Supervisor");
  await page.waitForURL("**/supervisor/oversight");
  await page.getByText(/Studies overview|نظرة عامة على الدراسات/).first().waitFor(); // wait for content render
  const cosign = page.getByRole("button", { name: /Co-sign/i }).first();
  if (await cosign.isVisible().catch(() => false)) {
    await cosign.click();
    await page.getByText(/Co-signed/i).first().waitFor();
    check("10. Supervisor co-signs certificate", true);
  } else {
    check("10. Supervisor co-sign (already signed)", await page.getByText(/Co-signed/i).first().isVisible().catch(() => false));
  }

  // 11. Enterprise anonymity rule
  await switchRole("Enterprise");
  await page.waitForURL("**/enterprise");
  await page.getByText(/Engagement by department|الانخراط حسب القسم/).first().waitFor(); // wait for content render
  check("11. Enterprise hides <5 group", await page.getByText(/group too small/i).first().isVisible());
} catch (e) {
  fail++;
  console.error("ERROR:", e.message);
  await page.screenshot({ path: "scripts/e2e-failure.png" }).catch(() => {});
} finally {
  await browser.close();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
