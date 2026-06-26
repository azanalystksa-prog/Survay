// Integration tests for the real engine: AI fallback, audience matching, response
// submission, stats recompute, and certificate issue/verify — all against SQLite.
import { PrismaClient } from "@prisma/client";
import { ruleBasedReview, ruleBasedMethod } from "../lib/ai";
import { matchesAudience, parseAudience } from "../lib/matching";
import { getStudyStats, getStudyAnalysis } from "../lib/queries";

const prisma = new PrismaClient();
let pass = 0, fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name} ${detail}`); }
}

async function main() {
  console.log("AI questionnaire reviewer (deterministic fallback):");
  const flags = ruleBasedReview([
    { id: "q1", text: "Don't you agree that our excellent new app is great?", type: "SINGLE" },
    { id: "q2", text: "Has the program improved your grades and your learning?", type: "SINGLE" },
    { id: "q3", text: "Rate your satisfaction.", type: "LIKERT", scaleMin: 1, scaleMax: 4 },
    { id: "q4", text: "How often do you study?", type: "SHORT_TEXT" },
    { id: "q5", text: "What is your college?", type: "SINGLE" },
  ]);
  check("flags the leading question (q1)", flags.some((f) => f.questionId === "q1" && f.kind === "leading"));
  check("leading rewrite is neutral", flags.find((f) => f.questionId === "q1")?.suggestedText.includes("To what extent") ?? false);
  check("flags double-barreled (q2)", flags.some((f) => f.questionId === "q2" && f.kind === "double_barreled"));
  check("flags unbalanced 4-pt scale (q3)", flags.some((f) => f.questionId === "q3" && f.kind === "unbalanced_scale"));
  check("flags vague wording (q4)", flags.some((f) => f.questionId === "q4" && f.kind === "vague"));
  check("does NOT flag the clean q5", !flags.some((f) => f.questionId === "q5"));

  console.log("Method recommender:");
  check("comparing groups → stratified", ruleBasedMethod("compare satisfaction across colleges").method === "STRATIFIED");
  check("representative estimate → random", ruleBasedMethod("a representative estimate of the population").method === "RANDOM");
  check("fast/practical → convenience", ruleBasedMethod("a quick practical pilot").method === "CONVENIENCE");

  console.log("Audience matching:");
  const student = { kind: "STUDENT", specialty: null, college: "Engineering", city: "Riyadh" };
  check("student matches {kind:STUDENT}", matchesAudience(parseAudience(JSON.stringify({ kind: "STUDENT" })), student));
  check("student does NOT match {specialty:Physician}", !matchesAudience(parseAudience(JSON.stringify({ specialty: "Physician" })), student));

  console.log("Response submission feeds monitor/analysis:");
  const study = await prisma.study.findFirst({ where: { title: "AI tools in higher education" }, include: { questions: { include: { options: true } } } });
  if (!study) throw new Error("seed study missing");
  const before = await getStudyStats(study.id);
  const panelist = await prisma.panelistProfile.findFirst({ where: { user: { email: "panelist.demo@ksu.edu.sa" } } });
  if (!panelist) throw new Error("demo panelist missing");
  // Build a valid set of answers
  const answers = study.questions.map((q) => {
    if (q.type === "LIKERT" || q.type === "NUMBER") return { questionId: q.id, valueNumber: 4 };
    if (q.options.length) return { questionId: q.id, optionId: q.options[0].id, valueText: q.options[0].label };
    return { questionId: q.id, valueText: "n/a" };
  });
  const now = new Date();
  const created = await prisma.response.create({
    data: {
      studyId: study.id, panelistId: panelist.id,
      startedAt: new Date(now.getTime() - 200000), completedAt: now, durationSec: 200,
      qualityStatus: "VALID", included: true,
      answers: { create: answers },
    },
  });
  const after = await getStudyStats(study.id);
  check("valid response count increments", after.valid === before.valid + 1, `before=${before.valid} after=${after.valid}`);

  const analysis = await getStudyAnalysis(study.id);
  check("Cronbach alpha computes in [0,1]", !!analysis && analysis.alpha > 0 && analysis.alpha <= 1, `alpha=${analysis?.alpha}`);
  check("ANOVA across colleges computed", !!analysis?.anova && analysis.anova.F > 0, `F=${analysis?.anova?.F}`);
  check("descriptives present for Likert items", (analysis?.questionAnalyses.filter((q) => q.type === "LIKERT").length ?? 0) >= 1);

  console.log("Quality engine — speeder excluded:");
  const speederStart = new Date();
  const speeder = await prisma.response.create({
    data: {
      studyId: study.id, panelistId: panelist.id,
      startedAt: speederStart, completedAt: speederStart, durationSec: 4,
      qualityStatus: "SPEEDER", included: false,
      answers: { create: answers },
    },
  });
  const afterSpeeder = await getStudyStats(study.id);
  check("speeder NOT counted as valid", afterSpeeder.valid === after.valid);
  check("speeder counted in excluded", afterSpeeder.excluded === after.excluded + 1);
  // cleanup all test responses so the test is non-destructive
  await prisma.response.deleteMany({ where: { id: { in: [speeder.id, created.id] } } });

  console.log("Certificate verify lookup:");
  const cert = await prisma.certificate.findFirst();
  check("seeded certificate exists", !!cert);
  if (cert) {
    const found = await prisma.certificate.findUnique({ where: { verifyCode: cert.verifyCode } });
    check("verifyCode resolves a certificate", !!found && found.id === cert.id);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
