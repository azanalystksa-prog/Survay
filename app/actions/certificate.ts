"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getStudyStats } from "@/lib/queries";

function genVerifyCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = (len: number) =>
    Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `ES-${block(4)}-${block(4)}-${block(2)}`;
}

export async function issueCertificate(studyId: string) {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { ethicsApproval: true, responses: true },
  });
  if (!study) return null;

  const existing = await prisma.certificate.findUnique({ where: { studyId } });
  if (existing) return existing.verifyCode;

  const stats = await getStudyStats(studyId);
  const included = study.responses.filter((r) => r.included);
  const times = included.map((r) => r.completedAt ?? r.startedAt).sort((a, b) => a.getTime() - b.getTime());
  const collectionStart = times[0] ?? study.createdAt;
  const collectionEnd = times[times.length - 1] ?? new Date();
  const botsBlocked = (stats.byQuality["BOT"] ?? 0) + (stats.byQuality["DUPLICATE"] ?? 0);

  // Ensure a unique verify code.
  let code = genVerifyCode();
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.certificate.findUnique({ where: { verifyCode: code } });
    if (!clash) break;
    code = genVerifyCode();
  }

  const cert = await prisma.certificate.create({
    data: {
      studyId,
      sampleMethod: study.samplingMethod,
      validResponses: stats.valid,
      targetResponses: study.targetN,
      qualityPassRate: stats.qualityPassRate,
      botsBlocked,
      collectionStart,
      collectionEnd,
      ethicsApprovalNumber: study.ethicsApproval?.approvalNumber ?? null,
      verifyCode: code,
    },
  });

  await prisma.study.update({ where: { id: studyId }, data: { status: "CERTIFIED" } });
  revalidatePath("/researcher/certificate");
  revalidatePath("/researcher/dashboard");
  revalidatePath("/supervisor/oversight");
  return cert.verifyCode;
}

export async function coSignCertificate(studyId: string) {
  const study = await prisma.study.findUnique({ where: { id: studyId }, include: { supervisor: true } });
  if (!study) return;
  await prisma.certificate.update({
    where: { studyId },
    data: { supervisorSignedAt: new Date(), supervisorName: study.supervisor?.name ?? "Supervisor" },
  });
  revalidatePath("/researcher/certificate");
  revalidatePath("/supervisor/oversight");
}
