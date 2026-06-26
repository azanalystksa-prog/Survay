"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, LANG_COOKIE, roleHome } from "@/lib/session";
import { DEMO_EMAILS } from "@/lib/demo-accounts";
import type { Role } from "@/lib/enums";

export async function loginAs(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  cookies().set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(roleHome(user.role as Role));
}

export async function switchToRole(role: Role) {
  const user =
    (await prisma.user.findUnique({ where: { email: DEMO_EMAILS[role] } })) ??
    (await prisma.user.findFirst({ where: { role }, orderBy: { name: "asc" } }));
  if (!user) return;
  cookies().set(SESSION_COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(roleHome(role));
}

export async function logout() {
  cookies().delete(SESSION_COOKIE);
  redirect("/");
}

export async function setLang(lang: "en" | "ar") {
  cookies().set(LANG_COOKIE, lang, { sameSite: "lax", path: "/" });
}
