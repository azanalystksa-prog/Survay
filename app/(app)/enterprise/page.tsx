import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { t } from "@/lib/strings";
import { Card, CardHeader, PageHeader, StatTile, Badge } from "@/components/ui";
import { DistributionBar } from "@/components/Charts";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

const SECTOR_BENCHMARK = 68; // engagement benchmark vs sector

export default async function EnterprisePage() {
  const lang = getLang();
  const survey = await prisma.enterpriseSurvey.findFirst();
  if (!survey) return null;

  const departments: { name: string; count: number; engagement: number }[] = JSON.parse(survey.departments);
  const MIN_GROUP = 5;
  const visible = departments.filter((d) => d.count >= MIN_GROUP);
  const hidden = departments.filter((d) => d.count < MIN_GROUP);

  const vsBenchmark = survey.engagementScore - SECTOR_BENCHMARK;

  return (
    <div>
      <PageHeader title={t("workplaceInsights", lang)} subtitle={`${survey.orgName} — ${survey.title}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t("engagementScore", lang)}
          value={survey.engagementScore.toFixed(0)}
          hint={`${vsBenchmark >= 0 ? "+" : ""}${vsBenchmark.toFixed(0)} ${lang === "ar" ? "مقابل القطاع" : "vs sector"}`}
          tone="green"
          icon={<Icon name="HeartHandshake" />}
        />
        <StatTile label={t("responseRate", lang)} value={`${survey.responseRate.toFixed(0)}%`} icon={<Icon name="Inbox" />} />
        <StatTile label={t("enps", lang)} value={survey.eNPS > 0 ? `+${survey.eNPS}` : String(survey.eNPS)} tone="gold" icon={<Icon name="TrendingUp" />} />
        <StatTile label={lang === "ar" ? "معيار القطاع" : "Sector benchmark"} value={SECTOR_BENCHMARK} icon={<Icon name="Target" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("byDepartment", lang)} subtitle={t("anonymityRule", lang)} />
          <div className="px-5 pb-5">
            <DistributionBar data={visible.map((d) => ({ label: d.name, count: d.engagement }))} height={240} />
          </div>
        </Card>

        <Card>
          <CardHeader title={lang === "ar" ? "الأقسام" : "Departments"} />
          <div className="px-5 pb-5">
            <ul className="space-y-2">
              {departments.map((d) => {
                const isHidden = d.count < MIN_GROUP;
                return (
                  <li key={d.name} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
                    <div>
                      <div className="text-sm font-semibold text-ink">{d.name}</div>
                      <div className="text-xs text-muted">{d.count} {lang === "ar" ? "موظف" : "staff"}</div>
                    </div>
                    {isHidden ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                        <Icon name="EyeOff" size={13} /> {t("hiddenSmall", lang)}
                      </span>
                    ) : (
                      <Badge label={`${d.engagement}`} tone="bg-soft text-primary" />
                    )}
                  </li>
                );
              })}
            </ul>
            {hidden.length > 0 ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-soft/60 px-3 py-2 text-xs text-muted">
                <Icon name="Lock" size={14} className="mt-0.5 shrink-0 text-primary" />
                {t("anonymityRule", lang)}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
