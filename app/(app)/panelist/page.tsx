import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, getLang } from "@/lib/session";
import { t } from "@/lib/strings";
import { parseAudience, matchesAudience, describeAudience } from "@/lib/matching";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Icon } from "@/components/Icon";
import { Badge } from "@/components/ui";

const SAR_PER_POINT = 0.1;

export default async function PanelistHome({ searchParams }: { searchParams: { done?: string; pts?: string } }) {
  const lang = getLang();
  const user = await getCurrentUser();
  const panelist = user ? await prisma.panelistProfile.findUnique({ where: { userId: user.id } }) : null;

  // If the current user isn't a panelist (e.g. researcher peeking), use the demo panelist.
  const profile =
    panelist ??
    (await prisma.panelistProfile.findFirst({ include: { user: true }, where: { user: { role: "PANELIST" } } }));

  const displayUser = panelist ? user : await prisma.user.findFirst({ where: { role: "PANELIST" } });

  // Studies open for collection that match this panelist, and not yet answered.
  const openStudies = await prisma.study.findMany({
    where: { status: { in: ["COLLECTING", "PILOT"] } },
    orderBy: { createdAt: "desc" },
  });
  const answered = profile
    ? new Set((await prisma.response.findMany({ where: { panelistId: profile.id }, select: { studyId: true } })).map((r) => r.studyId))
    : new Set<string>();

  const matched = openStudies.filter((s) => {
    if (!profile) return false;
    const aud = parseAudience(s.audienceFilter);
    return matchesAudience(aud, profile) && !answered.has(s.id);
  });

  const balance = profile?.pointsBalance ?? 0;
  const justDone = searchParams.done === "1";
  const pts = searchParams.pts ? parseInt(searchParams.pts, 10) : 0;

  return (
    <div className="flex flex-col items-center">
      <PhoneFrame>
        {/* Wallet header */}
        <div className="rounded-2xl bg-gradient-to-br from-primary to-deep-green p-4 text-white shadow-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 font-bold">
                {displayUser?.avatarInitials ?? "FQ"}
              </span>
              <div>
                <div className="text-sm font-semibold leading-tight">{displayUser?.name}</div>
                <div className="text-[11px] text-white/60">
                  {profile?.city} · {profile?.kind === "STUDENT" ? profile?.college : profile?.specialty}
                </div>
              </div>
            </div>
            <Link href="/panelist/redeem" className="rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold hover:bg-white/25">
              {t("redeem", lang)}
            </Link>
          </div>
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wider text-white/60">{t("wallet", lang)}</div>
            <div className="flex items-end gap-2">
              <span className="font-mono text-3xl font-semibold tabular">{balance.toLocaleString()}</span>
              <span className="pb-1 text-sm text-white/70">{t("points", lang)}</span>
            </div>
            <div className="text-xs text-white/60">≈ {(balance * SAR_PER_POINT).toFixed(2)} SAR</div>
          </div>
        </div>

        {justDone ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/30 bg-soft px-3 py-3 text-sm text-primary">
            <Icon name="PartyPopper" size={18} />
            <span className="font-semibold">{t("pointsAwarded", lang)} +{pts} {t("points", lang)}</span>
          </div>
        ) : null}

        <div className="mt-5">
          <h3 className="mb-2 font-heading text-base font-bold text-ink">{t("surveysForYou", lang)}</h3>
          {matched.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-soft/40 p-5 text-center text-sm text-muted">
              {t("noSurveys", lang)}
            </div>
          ) : (
            <ul className="space-y-3">
              {matched.map((s) => {
                const aud = parseAudience(s.audienceFilter);
                return (
                  <li key={s.id}>
                    <Link
                      href={`/panelist/survey/${s.id}`}
                      className="block rounded-2xl border border-line bg-card p-4 shadow-soft transition hover:border-primary"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink">{s.title}</span>
                        <Badge label={`+350 ${t("points", lang)}`} tone="bg-soft-gold text-gold" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{s.description}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted">
                          <Icon name="Users" size={13} /> {describeAudience(aud, lang)}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          {t("takeSurvey", lang)} <Icon name="ArrowRight" size={14} className="flip-x" />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-soft/60 px-3 py-2 text-[11px] text-muted">
          <Icon name="ShieldCheck" size={14} className="text-primary" />
          {lang === "ar" ? "حساب موثّق عبر البريد الجامعي" : "Verified via university email"}
        </div>
      </PhoneFrame>
    </div>
  );
}
