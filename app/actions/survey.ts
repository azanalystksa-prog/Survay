"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import type { QualityStatus } from "@/lib/enums";

const POINTS_PER_SURVEY = 350;

export interface SubmitPayload {
  studyId: string;
  durationSec: number;
  answers: { questionId: string; optionId?: string; valueText?: string; valueNumber?: number }[];
}

export interface SubmitResult {
  ok: boolean;
  message: string;
  quality: QualityStatus;
  pointsAwarded: number;
  newBalance: number;
}

/**
 * Records a panelist's response: creates Response + Answers, runs a lightweight
 * quality check, and awards points via the RewardLedger. Real data — it feeds the
 * researcher's live monitor and analysis.
 */
export async function submitResponse(payload: SubmitPayload): Promise<SubmitResult> {
  const user = await getCurrentUser();
  const panelist = user
    ? await prisma.panelistProfile.findUnique({ where: { userId: user.id } })
    : null;

  if (!panelist) {
    return { ok: false, message: "No panelist profile.", quality: "VALID", pointsAwarded: 0, newBalance: 0 };
  }

  const study = await prisma.study.findUnique({
    where: { id: payload.studyId },
    include: { questions: true },
  });
  if (!study) {
    return { ok: false, message: "Study not found.", quality: "VALID", pointsAwarded: 0, newBalance: panelist.pointsBalance };
  }

  // Quality check: too-fast completion → SPEEDER (heuristic: < 5s per question).
  const minExpected = study.questions.length * 5;
  let quality: QualityStatus = "VALID";
  if (payload.durationSec < minExpected) quality = "SPEEDER";

  // Duplicate check: same panelist already has a valid response for this study.
  const existing = await prisma.response.findFirst({
    where: { studyId: study.id, panelistId: panelist.id, included: true },
  });
  if (existing) quality = "DUPLICATE";

  const included = quality === "VALID";
  const now = new Date();

  const response = await prisma.response.create({
    data: {
      studyId: study.id,
      panelistId: panelist.id,
      startedAt: new Date(now.getTime() - payload.durationSec * 1000),
      completedAt: now,
      durationSec: payload.durationSec,
      qualityStatus: quality,
      included,
      answers: {
        create: payload.answers.map((a) => ({
          questionId: a.questionId,
          optionId: a.optionId,
          valueText: a.valueText,
          valueNumber: a.valueNumber,
        })),
      },
    },
  });

  let pointsAwarded = 0;
  let newBalance = panelist.pointsBalance;
  if (included) {
    pointsAwarded = POINTS_PER_SURVEY;
    await prisma.rewardLedger.create({
      data: { panelistId: panelist.id, delta: pointsAwarded, reason: `Completed: ${study.title}` },
    });
    const updated = await prisma.panelistProfile.update({
      where: { id: panelist.id },
      data: { pointsBalance: { increment: pointsAwarded } },
    });
    newBalance = updated.pointsBalance;

    // Keep the matching stratum's collected count in step with reality.
    const plan = await prisma.samplingPlan.findUnique({ where: { studyId: study.id }, include: { strata: true } });
    if (plan) {
      const collegeAnswer = payload.answers
        .map((a) => a.valueText)
        .find((v) => plan.strata.some((s) => s.name === v));
      if (collegeAnswer) {
        const stratum = plan.strata.find((s) => s.name === collegeAnswer);
        if (stratum) {
          await prisma.stratum.update({ where: { id: stratum.id }, data: { collectedCount: { increment: 1 } } });
        }
      }
    }
  }

  revalidatePath("/panelist");
  revalidatePath("/researcher/monitor");
  revalidatePath("/researcher/analysis");

  const message =
    quality === "SPEEDER"
      ? "Recorded, but flagged as too fast (excluded from the dataset)."
      : quality === "DUPLICATE"
        ? "You already completed this survey."
        : "Thank you! Your response was recorded.";

  return { ok: true, message, quality, pointsAwarded, newBalance, responseId: response.id } as SubmitResult & { responseId: string };
}

export async function redeemReward(cost: number, rewardName: string): Promise<{ ok: boolean; message: string; newBalance: number }> {
  const user = await getCurrentUser();
  const panelist = user ? await prisma.panelistProfile.findUnique({ where: { userId: user.id } }) : null;
  if (!panelist) return { ok: false, message: "No panelist profile.", newBalance: 0 };
  if (panelist.pointsBalance < cost) {
    return { ok: false, message: "Not enough points.", newBalance: panelist.pointsBalance };
  }
  await prisma.rewardLedger.create({ data: { panelistId: panelist.id, delta: -cost, reason: `Redeemed: ${rewardName}` } });
  const updated = await prisma.panelistProfile.update({
    where: { id: panelist.id },
    data: { pointsBalance: { decrement: cost } },
  });
  revalidatePath("/panelist");
  return { ok: true, message: `Redeemed ${rewardName}.`, newBalance: updated.pointsBalance };
}
