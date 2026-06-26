import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { resolveStudy } from "@/lib/study-context";
import { t } from "@/lib/strings";
import { PageHeader, EmptyState } from "@/components/ui";
import { LifecycleStepper } from "@/components/LifecycleStepper";
import { StudySelector } from "@/components/StudySelector";
import { SampleDesigner } from "@/components/SampleDesigner";

export const dynamic = "force-dynamic";

export default async function SamplePage({ searchParams }: { searchParams: { study?: string } }) {
  const lang = getLang();
  // Prefer the working draft, else any study.
  const researcher = await prisma.user.findFirst({ where: { role: "RESEARCHER" } });
  const studies = await prisma.study.findMany({ where: { researcherId: researcher?.id }, orderBy: { createdAt: "desc" } });
  const active =
    (searchParams.study ? studies.find((s) => s.id === searchParams.study) : undefined) ??
    studies.find((s) => s.status === "DRAFT") ??
    studies[0];

  if (!active) return <EmptyState title={lang === "ar" ? "لا توجد دراسات" : "No studies found"} />;

  const plan = await prisma.samplingPlan.findUnique({ where: { studyId: active.id }, include: { strata: true } });

  return (
    <div>
      <PageHeader title={t("sampleDesigner", lang)} subtitle={`${lang === "ar" ? "المرحلة 1 · التصميم" : "Stage 1 · Design"} — ${active.title}`}>
        <StudySelector studies={studies} current={active.id} basePath="/researcher/sample" />
      </PageHeader>
      <div className="mb-6">
        <LifecycleStepper active="design" lang={lang} />
      </div>
      <SampleDesigner
        studyId={active.id}
        lang={lang}
        initial={{
          population: plan?.population ?? 42000,
          confidence: plan?.confidence ?? 95,
          marginOfError: plan?.marginOfError ?? 5,
          method: active.samplingMethod,
          strata: plan?.strata.map((s) => ({ name: s.name, populationPct: s.populationPct })) ?? [],
        }}
      />
    </div>
  );
}
