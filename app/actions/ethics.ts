"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { generateAllDocs } from "@/lib/ethics-docs";

export async function generateEthics(studyId: string, lang: "en" | "ar") {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { researcher: { include: { institution: true } } },
  });
  if (!study) return;
  const docs = generateAllDocs(
    {
      title: study.title,
      pi: study.researcher.name,
      method: study.samplingMethod,
      targetN: study.targetN,
      institution: study.researcher.institution?.name ?? "King Saud University",
    },
    lang,
  );
  await prisma.ethicsApproval.upsert({
    where: { studyId },
    create: {
      studyId,
      status: "SUBMITTED",
      committee: "KSU Institutional Review Board",
      ...docs,
    },
    update: { ...docs, status: "SUBMITTED" },
  });
  revalidatePath("/researcher/ethics");
}

export async function markApproved(studyId: string) {
  const num = `IRB-2026-${String(Math.floor(1000 + Math.random() * 8999))}`;
  await prisma.ethicsApproval.update({
    where: { studyId },
    data: { status: "APPROVED", approvalNumber: num },
  });
  revalidatePath("/researcher/ethics");
  revalidatePath("/researcher/certificate");
  return num;
}

export async function updateEthicsDoc(
  studyId: string,
  field: "consentDocMarkdown" | "infoSheetMarkdown" | "irbSummaryMarkdown" | "pdplNoticeMarkdown",
  value: string,
) {
  await prisma.ethicsApproval.update({ where: { studyId }, data: { [field]: value } });
  revalidatePath("/researcher/ethics");
}
