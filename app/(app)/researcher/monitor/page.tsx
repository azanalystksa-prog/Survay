import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { resolveStudy } from "@/lib/study-context";
import { getStudyStats, getResponsesOverTime } from "@/lib/queries";
import { t } from "@/lib/strings";
import { QUALITY_LABELS, type QualityStatus, STUDY_STATUS_LABELS, type StudyStatus } from "@/lib/enums";
import { Card, CardHeader, StatTile, ProgressBar, PageHeader, Badge, EmptyState } from "@/components/ui";
import { LifecycleStepper } from "@/components/LifecycleStepper";
import { StudySelector } from "@/components/StudySelector";
import { GroupedComparisonChart, SimpleLineChart } from "@/components/Charts";
import { Icon } from "@/components/Icon";

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default async function LiveMonitor({ searchParams }: { searchParams: { study?: string } }) {
  const lang = getLang();
  const { studies, active } = await resolveStudy(searchParams.study, "COLLECTING");

  if (!active) {
    return <EmptyState title={lang === "ar" ? "لا توجد دراسات" : "No studies found"} />;
  }

  const stats = await getStudyStats(active.id);
  const overTime = await getResponsesOverTime(active.id);
  const plan = await prisma.samplingPlan.findUnique({ where: { studyId: active.id }, include: { strata: true } });

  // Estimated time-to-fill: remaining / recent daily rate.
  const remaining = Math.max(0, active.targetN - stats.valid);
  const days = Math.max(1, overTime.length);
  const dailyRate = stats.valid / days;
  const etaDays = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null;

  const qualityRows: QualityStatus[] = ["FAILED_ATTENTION", "SPEEDER", "BOT", "DUPLICATE"];

  return (
    <div>
      <PageHeader title={t("liveMonitor", lang)} subtitle={active.title}>
        <StudySelector studies={studies} current={active.id} basePath="/researcher/monitor" />
      </PageHeader>

      <div className="mb-6">
        <LifecycleStepper active="collect" lang={lang} />
      </div>

      <div className="mb-2 flex items-center gap-2">
        <Badge label={STUDY_STATUS_LABELS[active.status as StudyStatus][lang]} kind={active.status} />
        <span className="text-sm text-muted">{active.samplingMethod}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-primary/20 bg-soft p-4 shadow-soft">
          <span className="text-sm font-medium text-muted">{t("validResponses", lang)}</span>
          <div className="mt-2 font-mono text-2xl font-semibold tabular">
            {stats.valid}
            <span className="text-base text-muted"> / {active.targetN}</span>
          </div>
          <div className="mt-2">
            <ProgressBar value={stats.valid} max={active.targetN} />
          </div>
        </div>
        <StatTile label={t("qualityPassRate", lang)} value={`${stats.qualityPassRate}%`} icon={<Icon name="ShieldCheck" />} />
        <StatTile label={t("medianCompletion", lang)} value={fmtDuration(stats.medianDurationSec)} icon={<Icon name="Timer" />} />
        <StatTile label={t("timeToFill", lang)} value={etaDays ? `${etaDays} d` : "—"} hint={`${remaining} ${lang === "ar" ? "متبقٍ" : "remaining"}`} tone="gold" icon={<Icon name="CalendarClock" />} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("representativeness", lang)} subtitle={lang === "ar" ? "تم جمعه مقابل المخطط لكل طبقة" : "Collected vs planned per stratum"} />
          <div className="px-5 pb-5">
            {plan && plan.strata.length > 0 ? (
              <GroupedComparisonChart
                data={plan.strata.map((s) => ({ name: s.name, collected: s.collectedCount, planned: s.quota }))}
              />
            ) : (
              <EmptyState title={lang === "ar" ? "لا توجد خطة طبقية" : "No stratified plan"} hint={lang === "ar" ? "هذه الدراسة لا تستخدم الطبقات." : "This study does not use strata."} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title={t("qualityEngine", lang)} />
          <div className="px-5 pb-5">
            <ul className="space-y-2">
              {qualityRows.map((q) => (
                <li key={q} className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-50 text-danger">
                      <Icon name={q === "SPEEDER" ? "Gauge" : q === "BOT" ? "Bot" : q === "DUPLICATE" ? "Copy" : "ShieldAlert"} size={15} />
                    </span>
                    {QUALITY_LABELS[q][lang]}
                  </span>
                  <span className="font-mono font-semibold tabular text-ink">{stats.byQuality[q] ?? 0}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-soft/60 px-3 py-2 text-xs text-muted">
              <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-primary" />
              {t("excludedNote", lang)}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title={t("responsesOverTime", lang)} subtitle={lang === "ar" ? "الردود التراكمية الصالحة" : "Cumulative valid responses"} />
          <div className="px-5 pb-5">
            {overTime.length > 0 ? (
              <SimpleLineChart data={overTime} xKey="day" yKey="cumulative" />
            ) : (
              <EmptyState title={lang === "ar" ? "لا توجد بيانات بعد" : "No data yet"} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
