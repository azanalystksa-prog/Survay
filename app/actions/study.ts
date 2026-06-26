"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { reviewQuestionnaire, recommendMethod, type QInput } from "@/lib/ai";
import { computeSampleSize } from "@/lib/stats";
import type { QuestionType } from "@/lib/enums";

async function researcherId(): Promise<string> {
  const user = await getCurrentUser();
  if (user?.role === "RESEARCHER") return user.id;
  const r = await prisma.user.findFirst({ where: { role: "RESEARCHER" } });
  return r!.id;
}

/** Returns the researcher's working draft study, creating one if needed. */
export async function getOrCreateDraft() {
  const rid = await researcherId();
  let draft = await prisma.study.findFirst({
    where: { researcherId: rid, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
  });
  if (!draft) {
    const supervisor = await prisma.user.findFirst({ where: { role: "SUPERVISOR" } });
    draft = await prisma.study.create({
      data: {
        researcherId: rid,
        supervisorId: supervisor?.id,
        title: "Untitled study",
        description: "A new research study.",
        status: "DRAFT",
        targetN: 384,
        samplingMethod: "RANDOM",
        audienceFilter: JSON.stringify({ kind: "STUDENT" }),
      },
    });
  }
  return draft.id;
}

export async function updateStudyMeta(studyId: string, data: { title?: string; description?: string }) {
  await prisma.study.update({ where: { id: studyId }, data });
  revalidatePath("/researcher/create");
}

export async function addQuestion(studyId: string, type: QuestionType) {
  const count = await prisma.question.count({ where: { studyId } });
  const defaults: Record<string, { text: string; scaleMin?: number; scaleMax?: number; options?: string[] }> = {
    SINGLE: { text: "New single-choice question?", options: ["Option 1", "Option 2", "Option 3"] },
    MULTI: { text: "New multiple-choice question?", options: ["Option 1", "Option 2", "Option 3"] },
    LIKERT: { text: "New statement to rate.", scaleMin: 1, scaleMax: 5 },
    SHORT_TEXT: { text: "New open-text question?" },
    NUMBER: { text: "New numeric question?" },
  };
  const d = defaults[type];
  const q = await prisma.question.create({
    data: {
      studyId,
      order: count + 1,
      text: d.text,
      type,
      required: true,
      scaleMin: d.scaleMin,
      scaleMax: d.scaleMax,
      options: d.options ? { create: d.options.map((label, i) => ({ order: i + 1, label })) } : undefined,
    },
  });
  revalidatePath("/researcher/create");
  return q.id;
}

export async function updateQuestion(questionId: string, data: { text?: string; required?: boolean; scaleMin?: number; scaleMax?: number }) {
  await prisma.question.update({ where: { id: questionId }, data });
  revalidatePath("/researcher/create");
}

export async function deleteQuestion(questionId: string) {
  const q = await prisma.question.findUnique({ where: { id: questionId } });
  if (!q) return;
  await prisma.question.delete({ where: { id: questionId } });
  // Re-pack order.
  const remaining = await prisma.question.findMany({ where: { studyId: q.studyId }, orderBy: { order: "asc" } });
  for (let i = 0; i < remaining.length; i++) {
    if (remaining[i].order !== i + 1) await prisma.question.update({ where: { id: remaining[i].id }, data: { order: i + 1 } });
  }
  revalidatePath("/researcher/create");
}

export async function moveQuestion(questionId: string, direction: "up" | "down") {
  const q = await prisma.question.findUnique({ where: { id: questionId } });
  if (!q) return;
  const sibling = await prisma.question.findFirst({
    where: { studyId: q.studyId, order: direction === "up" ? q.order - 1 : q.order + 1 },
  });
  if (!sibling) return;
  await prisma.question.update({ where: { id: q.id }, data: { order: sibling.order } });
  await prisma.question.update({ where: { id: sibling.id }, data: { order: q.order } });
  revalidatePath("/researcher/create");
}

export async function addOption(questionId: string) {
  const count = await prisma.option.count({ where: { questionId } });
  await prisma.option.create({ data: { questionId, order: count + 1, label: `Option ${count + 1}` } });
  revalidatePath("/researcher/create");
}

export async function updateOption(optionId: string, label: string) {
  await prisma.option.update({ where: { id: optionId }, data: { label } });
  revalidatePath("/researcher/create");
}

export async function deleteOption(optionId: string) {
  await prisma.option.delete({ where: { id: optionId } });
  revalidatePath("/researcher/create");
}

/** Runs the AI (or fallback) questionnaire reviewer. */
export async function runReview(studyId: string) {
  const questions = await prisma.question.findMany({
    where: { studyId },
    orderBy: { order: "asc" },
    include: { options: true },
  });
  const input: QInput[] = questions.map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type as QuestionType,
    scaleMin: q.scaleMin,
    scaleMax: q.scaleMax,
    optionCount: q.options.length,
  }));
  return reviewQuestionnaire(input);
}

/** Applies a single suggested rewrite to one question. */
export async function applyFlag(questionId: string, suggestedText: string, kind: string) {
  if (kind === "unbalanced_scale") {
    // Add a midpoint by widening the scale to an odd number of points.
    const q = await prisma.question.findUnique({ where: { id: questionId } });
    if (q && q.scaleMin != null && q.scaleMax != null) {
      const points = q.scaleMax - q.scaleMin + 1;
      if (points % 2 === 0) await prisma.question.update({ where: { id: questionId }, data: { scaleMax: q.scaleMax + 1 } });
    }
  } else {
    await prisma.question.update({ where: { id: questionId }, data: { text: suggestedText } });
  }
  revalidatePath("/researcher/create");
}

export async function launchStudy(studyId: string, meta?: { title?: string; description?: string }) {
  if (meta) await prisma.study.update({ where: { id: studyId }, data: meta });
  await prisma.study.update({ where: { id: studyId }, data: { status: "COLLECTING" } });
  revalidatePath("/researcher/create");
  revalidatePath("/researcher/dashboard");
  revalidatePath("/panelist");
  return studyId;
}

// ---- Sample designer actions ----

export async function saveSamplingPlan(
  studyId: string,
  population: number,
  confidence: number,
  marginOfError: number,
  method: string,
  strata: { name: string; populationPct: number }[],
) {
  const result = computeSampleSize(population, confidence, marginOfError);
  const n = result.n0Rounded;
  await prisma.study.update({ where: { id: studyId }, data: { samplingMethod: method, targetN: n } });
  await prisma.samplingPlan.deleteMany({ where: { studyId } });
  const plan = await prisma.samplingPlan.create({
    data: { studyId, population, confidence, marginOfError, computedN: n },
  });
  if (strata.length > 0) {
    for (const s of strata) {
      await prisma.stratum.create({
        data: { samplingPlanId: plan.id, name: s.name, populationPct: s.populationPct, quota: Math.round((s.populationPct / 100) * n), collectedCount: 0 },
      });
    }
  }
  revalidatePath("/researcher/sample");
  return n;
}

export async function getMethodRecommendation(goal: string) {
  return recommendMethod(goal);
}
