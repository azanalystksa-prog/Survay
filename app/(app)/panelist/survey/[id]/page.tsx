import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SurveyForm } from "@/components/SurveyForm";
import { Icon } from "@/components/Icon";

export default async function TakeSurveyPage({ params }: { params: { id: string } }) {
  const lang = getLang();
  const study = await prisma.study.findUnique({
    where: { id: params.id },
    include: { questions: { include: { options: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
  });
  if (!study) notFound();

  return (
    <div className="flex flex-col items-center">
      <PhoneFrame title={study.title}>
        <Link href="/panelist" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
          <Icon name="ArrowLeft" size={15} className="flip-x" /> {lang === "ar" ? "رجوع" : "Back"}
        </Link>
        <SurveyForm
          studyId={study.id}
          title={study.description}
          lang={lang}
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
        />
      </PhoneFrame>
    </div>
  );
}
