import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, getLang } from "@/lib/session";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Icon } from "@/components/Icon";
import { RedeemList } from "@/components/RedeemList";

export default async function RedeemPage() {
  const lang = getLang();
  const user = await getCurrentUser();
  const profile =
    (user ? await prisma.panelistProfile.findUnique({ where: { userId: user.id } }) : null) ??
    (await prisma.panelistProfile.findFirst({ where: { user: { role: "PANELIST" } } }));
  const ledger = profile
    ? await prisma.rewardLedger.findMany({ where: { panelistId: profile.id }, orderBy: { createdAt: "desc" }, take: 6 })
    : [];

  return (
    <div className="flex flex-col items-center">
      <PhoneFrame title={lang === "ar" ? "استبدال النقاط" : "Redeem points"}>
        <Link href="/panelist" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
          <Icon name="ArrowLeft" size={15} className="flip-x" /> {lang === "ar" ? "رجوع" : "Back"}
        </Link>
        <RedeemList lang={lang} balance={profile?.pointsBalance ?? 0} />
        <div className="mt-6">
          <h3 className="mb-2 font-heading text-sm font-bold text-ink">{lang === "ar" ? "آخر الحركات" : "Recent activity"}</h3>
          <ul className="space-y-1.5">
            {ledger.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-lg bg-soft/50 px-3 py-2 text-sm">
                <span className="text-muted">{l.reason}</span>
                <span className={`font-mono font-semibold tabular ${l.delta >= 0 ? "text-primary" : "text-danger"}`}>
                  {l.delta >= 0 ? "+" : ""}
                  {l.delta}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </PhoneFrame>
    </div>
  );
}
