"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function decideVerification(id: string, decision: "APPROVED" | "REJECTED") {
  const req = await prisma.verificationRequest.update({ where: { id }, data: { status: decision } });
  if (decision === "APPROVED" && req.panelistId) {
    await prisma.panelistProfile
      .update({ where: { id: req.panelistId }, data: { verifiedBy: "CREDENTIAL" } })
      .catch(() => undefined);
  }
  revalidatePath("/admin/verification");
}

export async function requestSpecialty(specialty: string, city: string) {
  const existing = await prisma.registryEntry.findFirst({ where: { specialty, city } });
  if (existing) {
    await prisma.registryEntry.update({ where: { id: existing.id }, data: { count: existing.count + 1 } });
  } else {
    await prisma.registryEntry.create({
      data: { specialty, city, count: 0, status: "ON_REQUEST", avgFulfilDays: 5 },
    });
  }
  revalidatePath("/admin/registry");
}
