import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { t } from "@/lib/strings";
import { PageHeader, EmptyState } from "@/components/ui";
import { LifecycleStepper } from "@/components/LifecycleStepper";
import { StudySelector } from "@/components/StudySelector";
import { EthicsPanel } from "@/components/EthicsPanel";

export const dynamic = "force-dynamic";

export default async function EthicsPage({ searchParams }: { searchParams: { study?: string } }) {
  const lang = getLang();
  const researcher = await prisma.user.findFirst({ where: { role: "RESEARCHER" } });
  const studies = await prisma.study.findMany({ where: { researcherId: researcher?.id }, orderBy: { createdAt: "desc" } });
  const active =
    (searchParams.study ? studies.find((s) => s.id === searchParams.study) : undefined) ??
    studies.find((s) => s.status === "DRAFT") ??
    studies[0];

  if (!active) return <EmptyState title={lang === "ar" ? "لا توجد دراسات" : "No studies found"} />;

  const ethics = await prisma.ethicsApproval.findUnique({ where: { studyId: active.id } });

  return (
    <div>
      <PageHeader title={t("ethicsIrb", lang)} subtitle={`${lang === "ar" ? "المرحلة 1 · التصميم" : "Stage 1 · Design"} — ${active.title}`}>
        <StudySelector studies={studies} current={active.id} basePath="/researcher/ethics" />
      </PageHeader>
      <div className="mb-6">
        <LifecycleStepper active="design" lang={lang} />
      </div>
      <EthicsPanel studyId={active.id} ethics={ethics} lang={lang} />
    </div>
  );
}
