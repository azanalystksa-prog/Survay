import type { PrismaClient } from "@prisma/client";
import { DEMO_EMAILS } from "../lib/demo-accounts";

// ---- Deterministic RNG so reseeds are reproducible ----
let seedState = 1337;
function rng(): number {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff;
  return seedState / 0x7fffffff;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
function initials(name: string): string {
  const parts = name.replace(/^Dr\.?\s+/i, "").split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const COLLEGES = ["Engineering", "Health", "Business", "Humanities"];
const CITIES = ["Riyadh", "Jeddah", "Dammam"];
const PRO_SPECIALTIES = ["Civil Engineer", "Physician", "Nurse", "Teacher", "Accountant"];
const FIRST_NAMES = [
  "Mohammed", "Abdullah", "Fahad", "Sara", "Noura", "Reem", "Khalid", "Faisal", "Aisha", "Lina",
  "Omar", "Yousef", "Maha", "Hessa", "Turki", "Salman", "Latifa", "Hind", "Nasser", "Rana",
  "Bandar", "Saud", "Jawaher", "Dalal", "Maan", "Tariq", "Wafa", "Ghada", "Ibrahim", "Mansour",
];
const LAST_NAMES = [
  "Al-Otaibi", "Al-Qahtani", "Al-Ghamdi", "Al-Harbi", "Al-Shehri", "Al-Dosari", "Al-Subaie",
  "Al-Mutairi", "Al-Zahrani", "Al-Saud", "Al-Rashid", "Al-Anazi", "Al-Juhani", "Al-Malki",
];

async function reset(prisma: PrismaClient) {
  // Order matters for FK integrity. Uses deleteMany (not file deletion) so it is safe
  // to run on a live database connection — this powers the in-app "Reset demo" button.
  await prisma.answer.deleteMany();
  await prisma.response.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();
  await prisma.stratum.deleteMany();
  await prisma.samplingPlan.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.ethicsApproval.deleteMany();
  await prisma.rewardLedger.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.study.deleteMany();
  await prisma.panelistProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.registryEntry.deleteMany();
  await prisma.enterpriseSurvey.deleteMany();
}

export async function seedDatabase(prisma: PrismaClient) {
  seedState = 1337;
  await reset(prisma);

  // ---- Institutions ----
  const ksu = await prisma.institution.create({
    data: { name: "King Saud University", type: "University", verified: true, pdplCompliant: true },
  });
  const kau = await prisma.institution.create({
    data: { name: "King Abdulaziz University", type: "University", verified: true, pdplCompliant: true },
  });

  // ---- Core staff users ----
  const sara = await prisma.user.create({
    data: {
      name: "Dr. Sara Al-Otaibi",
      email: DEMO_EMAILS.RESEARCHER,
      role: "RESEARCHER",
      institutionId: ksu.id,
      specialty: "Educational Technology",
      avatarInitials: "SA",
    },
  });
  const khalid = await prisma.user.create({
    data: {
      name: "Dr. Khalid Al-Harbi",
      email: DEMO_EMAILS.SUPERVISOR,
      role: "SUPERVISOR",
      institutionId: ksu.id,
      specialty: "Research Methods",
      avatarInitials: "KH",
    },
  });
  await prisma.user.create({
    data: {
      name: "Panel Ops",
      email: DEMO_EMAILS.ADMIN,
      role: "ADMIN",
      institutionId: ksu.id,
      avatarInitials: "PO",
    },
  });
  await prisma.user.create({
    data: {
      name: "Enterprise Admin",
      email: DEMO_EMAILS.ENTERPRISE,
      role: "ENTERPRISE",
      avatarInitials: "EA",
    },
  });

  // ---- Demo panelist (the one role-switch logs into) ----
  const demoPanelistUser = await prisma.user.create({
    data: {
      name: "Faisal Al-Qahtani",
      email: DEMO_EMAILS.PANELIST,
      role: "PANELIST",
      institutionId: ksu.id,
      avatarInitials: "FQ",
    },
  });
  const demoPanelist = await prisma.panelistProfile.create({
    data: {
      userId: demoPanelistUser.id,
      kind: "STUDENT",
      college: "Engineering",
      gradeYear: "Year 3",
      verifiedBy: "UNI_EMAIL",
      city: "Riyadh",
      pointsBalance: 1450,
      available: true,
    },
  });
  await prisma.rewardLedger.createMany({
    data: [
      { panelistId: demoPanelist.id, delta: 500, reason: "Welcome bonus" },
      { panelistId: demoPanelist.id, delta: 450, reason: "Completed: Student wellbeing survey" },
      { panelistId: demoPanelist.id, delta: 500, reason: "Completed: Campus transport survey" },
    ],
  });

  // ---- ~400 panelists with a realistic student/professional/public mix ----
  const panelists: { id: string; kind: string; college: string | null; specialty: string | null; city: string }[] = [
    {
      id: demoPanelist.id,
      kind: "STUDENT",
      college: "Engineering",
      specialty: null,
      city: "Riyadh",
    },
  ];

  for (let i = 0; i < 399; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const roll = rng();
    let kind: string;
    let college: string | null = null;
    let specialty: string | null = null;
    let verifiedBy: string;
    let gradeYear: string | null = null;
    if (roll < 0.55) {
      kind = "STUDENT";
      college = pick(COLLEGES);
      gradeYear = `Year ${randInt(1, 5)}`;
      verifiedBy = rng() < 0.85 ? "UNI_EMAIL" : "NONE";
    } else if (roll < 0.85) {
      kind = "PROFESSIONAL";
      specialty = pick(PRO_SPECIALTIES);
      verifiedBy = pick(["CREDENTIAL", "EMPLOYER", "CREDENTIAL"]);
    } else {
      kind = "PUBLIC";
      verifiedBy = "NONE";
    }
    const u = await prisma.user.create({
      data: {
        name,
        email: `panelist${i}@panel.easysurvey.sa`,
        role: "PANELIST",
        institutionId: rng() < 0.6 ? ksu.id : kau.id,
        avatarInitials: initials(name),
      },
    });
    const p = await prisma.panelistProfile.create({
      data: {
        userId: u.id,
        kind,
        college,
        specialty,
        gradeYear,
        verifiedBy,
        city: pick(CITIES),
        pointsBalance: randInt(0, 4200),
        available: rng() < 0.92,
      },
    });
    panelists.push({ id: p.id, kind, college, specialty, city: p.city });
  }

  // Exclude the demo panelist from seeded responses so they have matching, unanswered
  // surveys available for the live golden-path demo.
  const studentPanelists = panelists.filter((p) => p.kind === "STUDENT" && p.id !== demoPanelist.id);
  const physicianPanelists = panelists.filter((p) => p.specialty === "Physician" && p.id !== demoPanelist.id);

  // ========================================================================
  // STUDY 1 — AI tools in higher education (STRATIFIED, COLLECTING, ~281 valid)
  // ========================================================================
  const study1 = await prisma.study.create({
    data: {
      researcherId: sara.id,
      supervisorId: khalid.id,
      title: "AI tools in higher education",
      description:
        "Examining how university students adopt and perceive AI study tools, and whether perceptions differ across colleges.",
      status: "COLLECTING",
      targetN: 384,
      samplingMethod: "STRATIFIED",
      pricingTier: "STANDARD",
      audienceFilter: JSON.stringify({ kind: "STUDENT" }),
      createdAt: new Date("2026-05-02T09:00:00Z"),
    },
  });

  // Questions: 1 grouping single, 3 Likert items (for alpha), 1 frequency single, 1 number.
  const s1q1 = await prisma.question.create({
    data: { studyId: study1.id, order: 1, text: "Which college are you enrolled in?", type: "SINGLE", required: true },
  });
  const s1q1Options = await Promise.all(
    COLLEGES.map((c, idx) =>
      prisma.option.create({ data: { questionId: s1q1.id, order: idx + 1, label: c } }),
    ),
  );
  const likertTexts = [
    "AI study tools improve my learning outcomes.",
    "I trust the accuracy of AI-generated study material.",
    "AI tools help me save time on coursework.",
  ];
  const s1Likert = [];
  for (let i = 0; i < likertTexts.length; i++) {
    s1Likert.push(
      await prisma.question.create({
        data: {
          studyId: study1.id,
          order: 2 + i,
          text: likertTexts[i],
          type: "LIKERT",
          required: true,
          scaleMin: 1,
          scaleMax: 5,
        },
      }),
    );
  }
  const s1q5 = await prisma.question.create({
    data: { studyId: study1.id, order: 5, text: "How often do you use AI study tools?", type: "SINGLE", required: true },
  });
  const s1q5Options = await Promise.all(
    ["Never", "Rarely", "Weekly", "Daily"].map((l, idx) =>
      prisma.option.create({ data: { questionId: s1q5.id, order: idx + 1, label: l } }),
    ),
  );
  const s1q6 = await prisma.question.create({
    data: { studyId: study1.id, order: 6, text: "Roughly how many hours per week do you use AI tools for study?", type: "NUMBER", required: false },
  });

  // Per-college latent attitude (so ANOVA finds real between-group differences).
  const collegeAttitude: Record<string, number> = {
    Engineering: 4.1,
    Health: 3.2,
    Business: 3.7,
    Humanities: 2.9,
  };

  // Sampling plan + strata for study 1.
  const plan1 = await prisma.samplingPlan.create({
    data: { studyId: study1.id, population: 42000, confidence: 95, marginOfError: 5, computedN: 384 },
  });
  const strataDef = [
    { name: "Engineering", populationPct: 30, collected: 96 },
    { name: "Health", populationPct: 25, collected: 71 },
    { name: "Business", populationPct: 25, collected: 68 },
    { name: "Humanities", populationPct: 20, collected: 46 },
  ];
  for (const s of strataDef) {
    await prisma.stratum.create({
      data: {
        samplingPlanId: plan1.id,
        name: s.name,
        populationPct: s.populationPct,
        quota: Math.round((s.populationPct / 100) * 384),
        collectedCount: s.collected,
      },
    });
  }

  // Generate responses matching the stratum collected counts (total 281 valid).
  const collectStart1 = new Date("2026-05-05T08:00:00Z");
  let respIndex = 0;
  for (const s of strataDef) {
    for (let i = 0; i < s.collected; i++) {
      const theta = collegeAttitude[s.name];
      const panelist = studentPanelists[respIndex % studentPanelists.length];
      const startedAt = new Date(collectStart1.getTime() + respIndex * 33 * 60 * 1000);
      const duration = randInt(150, 520);
      const resp = await prisma.response.create({
        data: {
          studyId: study1.id,
          panelistId: panelist.id,
          startedAt,
          completedAt: new Date(startedAt.getTime() + duration * 1000),
          durationSec: duration,
          qualityStatus: "VALID",
          included: true,
        },
      });
      // college answer
      const collegeOpt = s1q1Options.find((o) => o.label === s.name)!;
      await prisma.answer.create({
        data: { responseId: resp.id, questionId: s1q1.id, optionId: collegeOpt.id, valueText: s.name },
      });
      // Likert items: latent theta + small per-item noise → correlated (alpha ~0.7-0.85)
      for (const lq of s1Likert) {
        const noise = (rng() - 0.5) * 1.4;
        const val = clamp(Math.round(theta + noise), 1, 5);
        await prisma.answer.create({ data: { responseId: resp.id, questionId: lq.id, valueNumber: val } });
      }
      // frequency single
      const freqIdx = clamp(Math.round((theta - 1) / 1.1), 0, 3);
      await prisma.answer.create({
        data: { responseId: resp.id, questionId: s1q5.id, optionId: s1q5Options[freqIdx].id, valueText: s1q5Options[freqIdx].label },
      });
      // hours number
      await prisma.answer.create({
        data: { responseId: resp.id, questionId: s1q6.id, valueNumber: clamp(Math.round(theta * 2 + (rng() - 0.5) * 4), 0, 20) },
      });
      respIndex++;
    }
  }
  // A handful of excluded (quality-failed) responses — not in dataset, not charged.
  const excludedDefs1 = [
    { q: "SPEEDER", dur: 22 },
    { q: "SPEEDER", dur: 31 },
    { q: "FAILED_ATTENTION", dur: 140 },
    { q: "BOT", dur: 9 },
    { q: "DUPLICATE", dur: 200 },
  ];
  for (let i = 0; i < excludedDefs1.length; i++) {
    const d = excludedDefs1[i];
    const panelist = studentPanelists[(respIndex + i) % studentPanelists.length];
    const startedAt = new Date(collectStart1.getTime() + (respIndex + i) * 33 * 60 * 1000);
    await prisma.response.create({
      data: {
        studyId: study1.id,
        panelistId: panelist.id,
        startedAt,
        completedAt: new Date(startedAt.getTime() + d.dur * 1000),
        durationSec: d.dur,
        qualityStatus: d.q,
        included: false,
      },
    });
  }

  // Ethics for study 1 (submitted, not yet approved — demoable).
  await prisma.ethicsApproval.create({
    data: {
      studyId: study1.id,
      status: "SUBMITTED",
      committee: "KSU Institutional Review Board",
      consentDocMarkdown: consentDoc("AI tools in higher education", "Dr. Sara Al-Otaibi", "STRATIFIED"),
      infoSheetMarkdown: infoSheet("AI tools in higher education"),
      irbSummaryMarkdown: irbSummary("AI tools in higher education", "STRATIFIED", 384),
      pdplNoticeMarkdown: pdplNotice(),
    },
  });

  // ========================================================================
  // STUDY 2 — Physician burnout (TARGETED, COLLECTING, partial)
  // ========================================================================
  const study2 = await prisma.study.create({
    data: {
      researcherId: sara.id,
      supervisorId: khalid.id,
      title: "Physician burnout in tertiary hospitals",
      description: "Measuring burnout dimensions among physicians using verified professional panelists.",
      status: "COLLECTING",
      targetN: 200,
      samplingMethod: "QUOTA",
      pricingTier: "TARGETED",
      audienceFilter: JSON.stringify({ specialty: "Physician" }),
      createdAt: new Date("2026-06-01T09:00:00Z"),
    },
  });
  const s2q1 = await prisma.question.create({
    data: { studyId: study2.id, order: 1, text: "I feel emotionally drained by my work.", type: "LIKERT", required: true, scaleMin: 1, scaleMax: 5 },
  });
  const s2q2 = await prisma.question.create({
    data: { studyId: study2.id, order: 2, text: "I have become more callous toward people since taking this job.", type: "LIKERT", required: true, scaleMin: 1, scaleMax: 5 },
  });
  const s2q3 = await prisma.question.create({
    data: { studyId: study2.id, order: 3, text: "How many night shifts did you work in the past 7 days?", type: "NUMBER", required: false },
  });
  if (physicianPanelists.length > 0) {
    const collectStart2 = new Date("2026-06-03T08:00:00Z");
    const n2 = Math.min(64, physicianPanelists.length);
    for (let i = 0; i < n2; i++) {
      const panelist = physicianPanelists[i % physicianPanelists.length];
      const startedAt = new Date(collectStart2.getTime() + i * 90 * 60 * 1000);
      const duration = randInt(160, 360);
      const resp = await prisma.response.create({
        data: {
          studyId: study2.id,
          panelistId: panelist.id,
          startedAt,
          completedAt: new Date(startedAt.getTime() + duration * 1000),
          durationSec: duration,
          qualityStatus: "VALID",
          included: true,
        },
      });
      await prisma.answer.create({ data: { responseId: resp.id, questionId: s2q1.id, valueNumber: clamp(Math.round(3.6 + (rng() - 0.5) * 2), 1, 5) } });
      await prisma.answer.create({ data: { responseId: resp.id, questionId: s2q2.id, valueNumber: clamp(Math.round(2.8 + (rng() - 0.5) * 2), 1, 5) } });
      await prisma.answer.create({ data: { responseId: resp.id, questionId: s2q3.id, valueNumber: randInt(0, 4) } });
    }
  }
  await prisma.samplingPlan.create({
    data: { studyId: study2.id, population: 3500, confidence: 95, marginOfError: 7, computedN: 191 },
  });

  // ========================================================================
  // STUDY 3 — Campus transport satisfaction (QUOTA, CERTIFIED, 500/500)
  // ========================================================================
  const study3 = await prisma.study.create({
    data: {
      researcherId: sara.id,
      supervisorId: khalid.id,
      title: "Campus transport satisfaction",
      description: "Satisfaction with campus shuttle services across colleges; completed and certified.",
      status: "CERTIFIED",
      targetN: 500,
      samplingMethod: "QUOTA",
      pricingTier: "STANDARD",
      audienceFilter: JSON.stringify({ kind: "STUDENT" }),
      createdAt: new Date("2026-03-10T09:00:00Z"),
    },
  });
  const s3q1 = await prisma.question.create({
    data: { studyId: study3.id, order: 1, text: "Overall, I am satisfied with the campus shuttle service.", type: "LIKERT", required: true, scaleMin: 1, scaleMax: 5 },
  });
  const s3q2 = await prisma.question.create({
    data: { studyId: study3.id, order: 2, text: "The shuttle arrives on time.", type: "LIKERT", required: true, scaleMin: 1, scaleMax: 5 },
  });
  const collectStart3 = new Date("2026-03-12T08:00:00Z");
  const collectEnd3 = new Date("2026-04-02T18:00:00Z");
  for (let i = 0; i < 500; i++) {
    const panelist = studentPanelists[i % studentPanelists.length];
    const startedAt = new Date(collectStart3.getTime() + i * 60 * 60 * 1000);
    const duration = randInt(90, 300);
    const resp = await prisma.response.create({
      data: {
        studyId: study3.id,
        panelistId: panelist.id,
        startedAt,
        completedAt: new Date(startedAt.getTime() + duration * 1000),
        durationSec: duration,
        qualityStatus: "VALID",
        included: true,
      },
    });
    await prisma.answer.create({ data: { responseId: resp.id, questionId: s3q1.id, valueNumber: clamp(Math.round(3.3 + (rng() - 0.5) * 2.2), 1, 5) } });
    await prisma.answer.create({ data: { responseId: resp.id, questionId: s3q2.id, valueNumber: clamp(Math.round(3.0 + (rng() - 0.5) * 2.2), 1, 5) } });
  }
  await prisma.samplingPlan.create({
    data: { studyId: study3.id, population: 38000, confidence: 95, marginOfError: 4.4, computedN: 500 },
  });
  await prisma.ethicsApproval.create({
    data: {
      studyId: study3.id,
      status: "APPROVED",
      approvalNumber: "IRB-2026-0418",
      committee: "KSU Institutional Review Board",
      consentDocMarkdown: consentDoc("Campus transport satisfaction", "Dr. Sara Al-Otaibi", "QUOTA"),
      infoSheetMarkdown: infoSheet("Campus transport satisfaction"),
      irbSummaryMarkdown: irbSummary("Campus transport satisfaction", "QUOTA", 500),
      pdplNoticeMarkdown: pdplNotice(),
    },
  });
  await prisma.certificate.create({
    data: {
      studyId: study3.id,
      issuedAt: new Date("2026-04-03T10:00:00Z"),
      sampleMethod: "QUOTA",
      validResponses: 500,
      targetResponses: 500,
      qualityPassRate: 96.4,
      botsBlocked: 18,
      collectionStart: collectStart3,
      collectionEnd: collectEnd3,
      ethicsApprovalNumber: "IRB-2026-0418",
      verifyCode: "ES-7K3D-9XQ2-4M",
      // Left unsigned so the supervisor can demonstrate co-signing live (golden-path step 10).
      supervisorSignedAt: null,
      supervisorName: null,
    },
  });

  // ========================================================================
  // STUDY 4 — Student wellbeing & study habits (RANDOM, PILOT, ~28)
  // ========================================================================
  const study4 = await prisma.study.create({
    data: {
      researcherId: sara.id,
      title: "Student wellbeing & study habits",
      description: "Pilot study exploring sleep, stress, and study routines among students.",
      status: "PILOT",
      targetN: 350,
      samplingMethod: "RANDOM",
      pricingTier: "STANDARD",
      audienceFilter: JSON.stringify({ kind: "STUDENT" }),
      createdAt: new Date("2026-06-18T09:00:00Z"),
    },
  });
  const s4q1 = await prisma.question.create({
    data: { studyId: study4.id, order: 1, text: "I get enough sleep on weeknights.", type: "LIKERT", required: true, scaleMin: 1, scaleMax: 5 },
  });
  const s4q2 = await prisma.question.create({
    data: { studyId: study4.id, order: 2, text: "How many hours do you sleep on a typical weeknight?", type: "NUMBER", required: false },
  });
  const collectStart4 = new Date("2026-06-19T08:00:00Z");
  for (let i = 0; i < 28; i++) {
    const panelist = studentPanelists[i % studentPanelists.length];
    const startedAt = new Date(collectStart4.getTime() + i * 120 * 60 * 1000);
    const duration = randInt(120, 280);
    const resp = await prisma.response.create({
      data: {
        studyId: study4.id,
        panelistId: panelist.id,
        startedAt,
        completedAt: new Date(startedAt.getTime() + duration * 1000),
        durationSec: duration,
        qualityStatus: "VALID",
        included: true,
      },
    });
    await prisma.answer.create({ data: { responseId: resp.id, questionId: s4q1.id, valueNumber: clamp(Math.round(2.9 + (rng() - 0.5) * 2), 1, 5) } });
    await prisma.answer.create({ data: { responseId: resp.id, questionId: s4q2.id, valueNumber: clamp(Math.round(6.5 + (rng() - 0.5) * 3), 3, 10) } });
  }

  // ---- Specialty registry ----
  await prisma.registryEntry.createMany({
    data: [
      { specialty: "Civil Engineer", city: "Riyadh", count: 142, status: "INSTANT", avgFulfilDays: 0 },
      { specialty: "Physician", city: "Riyadh", count: 88, status: "INSTANT", avgFulfilDays: 0 },
      { specialty: "Physician", city: "Jeddah", count: 54, status: "INSTANT", avgFulfilDays: 0 },
      { specialty: "Nurse", city: "Riyadh", count: 12, status: "ON_REQUEST", avgFulfilDays: 4 },
      { specialty: "Teacher", city: "Dammam", count: 31, status: "INSTANT", avgFulfilDays: 0 },
      { specialty: "Accountant", city: "Riyadh", count: 47, status: "INSTANT", avgFulfilDays: 0 },
      { specialty: "Lawyer", city: "Riyadh", count: 6, status: "ON_REQUEST", avgFulfilDays: 5 },
      { specialty: "Pharmacist", city: "Jeddah", count: 9, status: "ON_REQUEST", avgFulfilDays: 3 },
    ],
  });

  // ---- Verification queue ----
  const pendingNames = ["Norah Al-Saud", "Tariq Al-Malki", "Dalal Al-Anazi"];
  for (let i = 0; i < pendingNames.length; i++) {
    await prisma.verificationRequest.create({
      data: {
        panelistId: panelists[10 + i]?.id ?? demoPanelist.id,
        name: pendingNames[i],
        claimedCredential: pick(["SCFHS license #4421", "Bar association card", "Employer letter (Aramco)"]),
        specialty: pick(PRO_SPECIALTIES),
        status: "PENDING",
      },
    });
  }

  // ---- Enterprise survey with a <5 department ----
  await prisma.enterpriseSurvey.create({
    data: {
      orgName: "Najm Logistics",
      title: "Q2 2026 Employee Engagement Pulse",
      responseRate: 78.4,
      engagementScore: 72.0,
      eNPS: 31,
      departments: JSON.stringify([
        { name: "Operations", count: 64, engagement: 70 },
        { name: "Engineering", count: 38, engagement: 76 },
        { name: "Sales", count: 27, engagement: 68 },
        { name: "Human Resources", count: 11, engagement: 74 },
        { name: "Finance", count: 9, engagement: 65 },
        { name: "Executive Office", count: 3, engagement: 0 },
      ]),
    },
  });

  const counts = {
    institutions: await prisma.institution.count(),
    users: await prisma.user.count(),
    panelists: await prisma.panelistProfile.count(),
    studies: await prisma.study.count(),
    responses: await prisma.response.count(),
    answers: await prisma.answer.count(),
  };
  return counts;
}

// ---- Document templates (EthicsApproval markdown) ----
function consentDoc(title: string, pi: string, method: string): string {
  return `# Informed Consent Form

**Study title:** ${title}
**Principal investigator:** ${pi}
**Institution:** King Saud University

You are invited to participate in a research study using a **${method.toLowerCase()}** sampling design. Your participation is **voluntary**. You may withdraw at any time without penalty.

## Purpose
This study collects anonymous responses for academic research purposes only.

## Procedures
You will complete a short questionnaire (estimated 3–7 minutes).

## Risks & benefits
There are no anticipated risks beyond those of everyday life. There is no direct benefit; you will receive panel reward points.

## Confidentiality
Your responses are stored securely and reported only in aggregate. No personally identifying information is published.

## Consent
By proceeding, you confirm that you are 18 years or older and consent to participate.`;
}

function infoSheet(title: string): string {
  return `# Participant Information Sheet

**Study:** ${title}

- **What is this?** An academic research questionnaire.
- **Who can take part?** Verified panel members who match the study's eligibility criteria.
- **How long?** Approximately 3–7 minutes.
- **Your rights:** Participation is voluntary; you may skip non-required questions or withdraw.
- **Data handling:** Responses are anonymised and processed in line with the Saudi Personal Data Protection Law (PDPL).
- **Contact:** research.ethics@ksu.edu.sa`;
}

function irbSummary(title: string, method: string, n: number): string {
  return `# IRB Submission Summary

**Title:** ${title}
**Design:** Cross-sectional survey, **${method}** sampling
**Target sample size:** ${n} (Cochran, 95% confidence, ±5% margin)
**Population:** University students / verified professionals
**Data collection:** Self-administered electronic questionnaire via the Easy Survey verified panel
**Quality controls:** Attention checks, speeding detection, duplicate/bot screening
**Data protection:** PDPL-compliant; aggregate reporting only
**Risk level:** Minimal risk`;
}

function pdplNotice(): string {
  return `# PDPL Data-Processing Notice

In accordance with the Saudi **Personal Data Protection Law (PDPL)**:

- **Controller:** King Saud University, Research Office
- **Purpose:** Academic research; lawful basis is informed consent.
- **Data collected:** Questionnaire responses and non-identifying panel attributes.
- **Retention:** Data retained only for the duration of the study and analysis.
- **Rights:** Participants may request access, correction, or deletion of their data.
- **Cross-border transfer:** None. Data is processed and stored locally.`;
}
