import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "./enums";

export const SESSION_COOKIE = "es_user";
export const LANG_COOKIE = "es_lang";

/** The currently "logged in" user, resolved from a cookie. Falls back to the researcher. */
export async function getCurrentUser() {
  const store = cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true, panelistProfile: true },
    });
  }
  if (!user) {
    // Default demo identity: the researcher (Dr. Sara).
    user = await prisma.user.findFirst({
      where: { role: "RESEARCHER" },
      include: { institution: true, panelistProfile: true },
      orderBy: { name: "asc" },
    });
  }
  return user;
}

export async function getDemoAccounts() {
  return prisma.user.findMany({
    where: { role: { in: ["RESEARCHER", "SUPERVISOR", "PANELIST", "ADMIN", "ENTERPRISE"] } },
    include: { panelistProfile: true },
    orderBy: { role: "asc" },
  });
}

export function getLang(): "en" | "ar" {
  const store = cookies();
  const v = store.get(LANG_COOKIE)?.value;
  return v === "ar" ? "ar" : "en";
}

export function roleHome(role: Role): string {
  switch (role) {
    case "RESEARCHER":
      return "/researcher/dashboard";
    case "SUPERVISOR":
      return "/supervisor/oversight";
    case "PANELIST":
      return "/panelist";
    case "ADMIN":
      return "/admin/registry";
    case "ENTERPRISE":
      return "/enterprise";
    default:
      return "/researcher/dashboard";
  }
}
