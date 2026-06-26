"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { seedDatabase } from "@/prisma/seed";

/**
 * Restores the demo to a clean, fully-seeded state using the live database
 * connection. Safe under a running server because it uses deleteMany + inserts
 * (never deletes the SQLite file), unlike the `npm run db:reset` CLI.
 */
export async function resetDemo() {
  await seedDatabase(prisma);
  // Refresh every section so the UI reflects the freshly seeded data.
  for (const path of [
    "/",
    "/researcher/dashboard",
    "/researcher/create",
    "/researcher/sample",
    "/researcher/ethics",
    "/researcher/monitor",
    "/researcher/analysis",
    "/researcher/certificate",
    "/researcher/wallet",
    "/supervisor/oversight",
    "/panelist",
    "/admin/registry",
    "/admin/verification",
    "/enterprise",
  ]) {
    revalidatePath(path);
  }
  return { ok: true };
}
