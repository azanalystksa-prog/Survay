import { getLang } from "@/lib/session";
import { resolveStudy } from "@/lib/study-context";
import { getStudyAnalysis } from "@/lib/queries";
import { suggestTestResult } from "@/lib/ai";
import { t } from "@/lib/strings";
import { Card, CardHeader, PageHeader, Badge, EmptyState, AiBadge, StatTile } from "@/components/ui";
import { LifecycleStepper } from "@/components/LifecycleStepper";
import { StudySelector } from "@/components/StudySelector";
import { DistributionBar } from "@/components/Charts";
import { Icon } from "@/components/Icon";
import { ExportButtons } from "@/components/ExportButtons";

function alphaVerdict(a: number, lang: "en" | "ar") {
  if (a >= 0.9) return lang === "ar" ? "ممتاز" : "Excellent";
  if (a >= 0.8) return lang === "ar" ? "جيد" : "Good";
  if (a >= 0.7) return lang === "ar" ? "مقبول" : "Acceptable";
  if (a >= 0.6) return lang === "ar" ? "مشكوك فيه" : "Questionable";
  return lang === "ar" ? "ضعيف" : "Poor";
}

export default async function AnalysisPage({ searchParams }: { searchParams: { study?: string } }) {
  const lang = getLang();
  const { studies, active } = await resolveStudy(searchParams.study, "ANALYZE");
  if (!active) return <EmptyState title={lang === "ar" ? "لا توجد دراسات" : "No studies found"} />;

  const analysis = await getStudyAnalysis(active.id);
  if (!analysis) return <EmptyState title="No analysis" />;

  // AI analysis assistant — suggest the test based on the study's structure.
  const groupCount = analysis.anova?.groups.length ?? 2;
  const suggestion = analysis.anova
    ? suggestTestResult({ outcomeType: "likert", predictorType: "categorical", groupCount })
    : suggestTestResult({ outcomeType: "likert", predictorType: "categorical", groupCount: 2 });

  const numericQs = analysis.questionAnalyses.filter((q) => q.type === "LIKERT" || q.type === "NUMBER");
  const categoricalQs = analysis.questionAnalyses.filter((q) => q.frequencies);

  return (
    <div>
      <PageHeader title={t("analysis", lang)} subtitle={active.title}>
        <div className="flex items-center gap-2">
          <StudySelector studies={studies} current={active.id} basePath="/researcher/analysis" />
          <ExportButtons studyId={active.id} lang={lang} />
        </div>
      </PageHeader>

      <div className="mb-6">
        <LifecycleStepper active="analyze" lang={lang} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={lang === "ar" ? "الردود المحللة" : "Responses analysed"} value={analysis.responseCount} icon={<Icon name="Database" />} tone="green" />
        <StatTile label={t("cronbach", lang)} value={analysis.likertCount >= 2 ? analysis.alpha.toFixed(3) : "—"} hint={analysis.likertCount >= 2 ? `${alphaVerdict(analysis.alpha, lang)} · k=${analysis.likertCount}, n=${analysis.alphaN}` : lang === "ar" ? "يلزم بندان ليكرت+" : "needs 2+ Likert items"} tone="gold" icon={<Icon name="Gauge" />} />
        <StatTile label={lang === "ar" ? "الأسئلة" : "Questions"} value={analysis.questionAnalyses.length} icon={<Icon name="ListChecks" />} />
      </div>

      {/* AI analysis assistant */}
      <Card className="mt-6 border-deep-green/20">
        <CardHeader
          title={t("analysisAssistant", lang)}
          action={<AiBadge />}
        />
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-primary/20 bg-soft p-4">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">{t("suggestedTest", lang)}</div>
            <div className="font-heading text-lg font-bold text-ink">{suggestion.test}</div>
            <p className="mt-1 text-sm text-muted">{suggestion.reason}</p>
            <p className="mt-2 text-xs font-semibold text-gold">⚠ {suggestion.assumptions}</p>
            {analysis.anova ? (
              <div className="mt-3 rounded-lg bg-card p-3 text-sm">
                <div className="mb-1 font-semibold text-ink">
                  {lang === "ar" ? "نتيجة محسوبة" : "Computed result"}: F = <span className="font-mono">{analysis.anova.F}</span>
                </div>
                <div className="text-xs text-muted">
                  {lang === "ar" ? "متوسطات المجموعات" : "Group means"}:{" "}
                  {analysis.anova.groups.map((g) => `${g.name} ${g.mean} (n=${g.n})`).join(" · ")}
                </div>
              </div>
            ) : null}
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted">
            <Icon name="Lock" size={13} className="text-primary" /> {t("analysisNote", lang)}
          </p>
        </div>
      </Card>

      {/* Descriptives table */}
      <Card className="mt-6">
        <CardHeader title={t("descriptives", lang)} subtitle={lang === "ar" ? "محسوبة من الردود الصالحة" : "Computed from valid responses"} />
        <div className="overflow-x-auto px-2 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted">
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "السؤال" : "Question"}</th>
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "النوع" : "Type"}</th>
                <th className="px-3 py-2 text-end font-semibold">{t("n", lang)}</th>
                <th className="px-3 py-2 text-end font-semibold">{t("mean", lang)}</th>
                <th className="px-3 py-2 text-end font-semibold">{t("sd", lang)}</th>
                <th className="px-3 py-2 text-end font-semibold">Min–Max</th>
              </tr>
            </thead>
            <tbody>
              {numericQs.map((q) => (
                <tr key={q.questionId} className="border-t border-line">
                  <td className="px-3 py-2.5 text-ink">{q.text}</td>
                  <td className="px-3 py-2.5"><Badge label={q.type} tone="bg-soft text-muted" /></td>
                  <td className="px-3 py-2.5 text-end font-mono tabular">{q.n}</td>
                  <td className="px-3 py-2.5 text-end font-mono tabular font-semibold">{q.mean?.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-end font-mono tabular">{q.sd?.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-end font-mono tabular text-muted">{q.min}–{q.max}</td>
                </tr>
              ))}
              {numericQs.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-4 text-center text-muted">{lang === "ar" ? "لا توجد أسئلة رقمية" : "No numeric questions"}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Frequency charts */}
      {categoricalQs.length > 0 ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {categoricalQs.map((q) => (
            <Card key={q.questionId}>
              <CardHeader title={q.text} subtitle={`${t("n", lang)} = ${q.n}`} />
              <div className="px-5 pb-5">
                <DistributionBar data={(q.frequencies ?? []).map((f) => ({ label: f.label, count: f.count }))} />
                <div className="mt-2 space-y-1">
                  {(q.frequencies ?? []).map((f) => (
                    <div key={f.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted">{f.label}</span>
                      <span className="font-mono tabular">{f.count} ({f.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
