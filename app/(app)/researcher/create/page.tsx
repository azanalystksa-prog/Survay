import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { getOrCreateDraft } from "@/app/actions/study";
import { t } from "@/lib/strings";
import { PageHeader } from "@/components/ui";
import { LifecycleStepper } from "@/components/LifecycleStepper";
import { StudyBuilder } from "@/components/StudyBuilder";

export const dynamic = "force-dynamic";

export default async function CreateStudyPage() {
  const lang = getLang();
  const studyId = await getOrCreateDraft();
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { questions: { include: { options: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
  });
  if (!study) return null;

  return (
    <div>
      <PageHeader title={t("createStudy", lang)} subtitle={lang === "ar" ? "المرحلة 1 · التصميم" : "Stage 1 · Design"} />
      <div className="mb-6">
        <LifecycleStepper active="design" lang={lang} />
      </div>
      <StudyBuilder
        study={{ id: study.id, title: study.title, description: study.description }}
        questions={study.questions.map((q) => ({
          id: q.id,
          order: q.order,
          text: q.text,
          type: q.type,
          required: q.required,
          scaleMin: q.scaleMin,
          scaleMax: q.scaleMax,
          options: q.options.map((o) => ({ id: o.id, label: o.label })),
        }))}
        lang={lang}
      />
    </div>
  );
}
