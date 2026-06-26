import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser, getLang } from "@/lib/session";
import { getStudyStats } from "@/lib/queries";
import { t } from "@/lib/strings";
import { STUDY_STATUS_LABELS, type StudyStatus } from "@/lib/enums";
import { Card, CardHeader, StatTile, Badge, ProgressBar, PageHeader } from "@/components/ui";
import { LifecycleStepper } from "@/components/LifecycleStepper";
import { Icon } from "@/components/Icon";

export default async function ResearcherDashboard() {
  const lang = getLang();
  const user = await getCurrentUser();

  // Researcher context: use Dr. Sara's studies (or the current user's if researcher).
  const researcher =
    user?.role === "RESEARCHER" ? user : await prisma.user.findFirst({ where: { role: "RESEARCHER" } });

  const studies = await prisma.study.findMany({
    where: { researcherId: researcher?.id },
    orderBy: { createdAt: "desc" },
    include: { samplingPlan: true },
  });

  const statsByStudy = new Map<string, Awaited<ReturnType<typeof getStudyStats>>>();
  for (const s of studies) statsByStudy.set(s.id, await getStudyStats(s.id));

  const activeStudies = studies.filter((s) => ["COLLECTING", "PILOT"].includes(s.status)).length;
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const responsesThisWeek = await prisma.response.count({
    where: { study: { researcherId: researcher?.id }, included: true, completedAt: { gte: weekAgo } },
  });
  // Wallet = researcher's reward budget proxy (sum of seeded spend headroom) — show a realistic SAR figure.
  const walletSar = 18450;

  const totalValid = [...statsByStudy.values()].reduce((a, s) => a + s.valid, 0);

  return (
    <div>
      <PageHeader
        title={`${lang === "ar" ? "مرحبًا" : "Welcome"}, ${researcher?.name ?? ""}`}
        subtitle={lang === "ar" ? "نظرة عامة على أبحاثك النشطة." : "An overview of your active research."}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("activeStudies", lang)} value={activeStudies} tone="green" icon={<Icon name="FlaskConical" />} />
        <StatTile label={t("responsesThisWeek", lang)} value={responsesThisWeek} icon={<Icon name="Inbox" />} />
        <StatTile label={t("medianTime", lang)} value="3.2 d" hint={lang === "ar" ? "للوصول إلى 100 رد" : "to first 100 responses"} icon={<Icon name="Timer" />} />
        <StatTile label={t("walletBalance", lang)} value={`${walletSar.toLocaleString()}`} hint="SAR" tone="gold" icon={<Icon name="Wallet" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("yourStudies", lang)} subtitle={`${totalValid.toLocaleString()} ${lang === "ar" ? "ردًا صالحًا إجمالًا" : "valid responses total"}`} />
          <div className="overflow-x-auto px-2 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-xs uppercase tracking-wider text-muted">
                  <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "العنوان" : "Title"}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("stage", lang)}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("progress", lang)}</th>
                  <th className="px-3 py-2 text-start font-semibold">{t("qualityScore", lang)}</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((s) => {
                  const stats = statsByStudy.get(s.id)!;
                  return (
                    <tr key={s.id} className="border-t border-line hover:bg-soft/40">
                      <td className="px-3 py-3">
                        <Link href={`/researcher/monitor?study=${s.id}`} className="font-semibold text-ink hover:text-primary">
                          {s.title}
                        </Link>
                        <div className="text-xs text-muted">{s.samplingMethod}</div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge label={STUDY_STATUS_LABELS[s.status as StudyStatus][lang]} kind={s.status} />
                      </td>
                      <td className="px-3 py-3 w-44">
                        <div className="flex items-center justify-between text-xs text-muted mb-1">
                          <span className="font-mono tabular">{stats.valid}/{s.targetN}</span>
                        </div>
                        <ProgressBar value={stats.valid} max={s.targetN} />
                      </td>
                      <td className="px-3 py-3 font-mono tabular text-ink">
                        {stats.total > 0 ? `${stats.qualityPassRate}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title={t("lifecycle", lang)} />
          <div className="px-5 pb-5 space-y-4">
            <LifecycleStepper active="design" lang={lang} />
            <div className="space-y-3 text-sm">
              <LifecycleRow icon="PenLine" title={t("design", lang)} desc={lang === "ar" ? "بناء الاستبيان، حجم العينة، الأخلاقيات." : "Build the questionnaire, size the sample, ethics."} href="/researcher/create" lang={lang} />
              <LifecycleRow icon="Inbox" title={t("collect", lang)} desc={lang === "ar" ? "جمع من لوحة موثقة مع مراقبة الجودة." : "Collect from a verified panel with live quality."} href="/researcher/monitor" lang={lang} />
              <LifecycleRow icon="BarChart3" title={t("analyze", lang)} desc={lang === "ar" ? "إحصاءات حقيقية وشهادة نزاهة." : "Real statistics and an integrity certificate."} href="/researcher/analysis" lang={lang} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function LifecycleRow({ icon, title, desc, href, lang }: { icon: string; title: string; desc: string; href: string; lang: string }) {
  return (
    <Link href={href} className="flex items-start gap-3 rounded-xl border border-line p-3 hover:border-primary hover:bg-soft/40">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-soft text-primary">
        <Icon name={icon} size={17} />
      </span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </Link>
  );
}
