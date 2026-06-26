import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { getStudyStats } from "@/lib/queries";
import { t } from "@/lib/strings";
import { PageHeader, EmptyState, Card, CardHeader, StatTile } from "@/components/ui";
import { StudySelector } from "@/components/StudySelector";
import { CertificateCard, type CertData } from "@/components/CertificateCard";
import { IssueButton, CertToolbar } from "@/components/CertificateActions";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ searchParams }: { searchParams: { study?: string } }) {
  const lang = getLang();
  const researcher = await prisma.user.findFirst({ where: { role: "RESEARCHER" }, include: { institution: true } });
  const studies = await prisma.study.findMany({ where: { researcherId: researcher?.id }, orderBy: { createdAt: "desc" } });
  // Prefer a study that already has (or can have) a certificate.
  const active =
    (searchParams.study ? studies.find((s) => s.id === searchParams.study) : undefined) ??
    studies.find((s) => ["CERTIFIED", "CLOSED"].includes(s.status)) ??
    studies.find((s) => s.status === "COLLECTING") ??
    studies[0];

  if (!active) return <EmptyState title={lang === "ar" ? "لا توجد دراسات" : "No studies found"} />;

  const cert = await prisma.certificate.findUnique({ where: { studyId: active.id } });
  const stats = await getStudyStats(active.id);

  return (
    <div>
      <PageHeader title={t("integrityCertificate", lang)} subtitle={active.title}>
        <StudySelector studies={studies} current={active.id} basePath="/researcher/certificate" />
      </PageHeader>

      {cert ? (
        <div className="space-y-4">
          <CertToolbar verifyCode={cert.verifyCode} lang={lang} />
          <CertificateCard
            lang={lang}
            cert={{
              studyTitle: active.title,
              sampleMethod: cert.sampleMethod,
              validResponses: cert.validResponses,
              targetResponses: cert.targetResponses,
              qualityPassRate: cert.qualityPassRate,
              botsBlocked: cert.botsBlocked,
              collectionStart: cert.collectionStart,
              collectionEnd: cert.collectionEnd,
              ethicsApprovalNumber: cert.ethicsApprovalNumber,
              verifyCode: cert.verifyCode,
              issuedAt: cert.issuedAt,
              supervisorName: cert.supervisorName,
              supervisorSignedAt: cert.supervisorSignedAt,
              researcherName: researcher?.name ?? "",
              institutionName: researcher?.institution?.name ?? "King Saud University",
            }}
          />
        </div>
      ) : (
        <Card>
          <CardHeader
            title={lang === "ar" ? "إصدار شهادة النزاهة" : "Issue the integrity certificate"}
            subtitle={lang === "ar" ? "تُنشأ الشهادة من بيانات الجمع الحقيقية مع رمز تحقق فريد." : "Generated from real collection data with a unique verification code."}
          />
          <div className="px-5 pb-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatTile label={t("validResponses", lang)} value={`${stats.valid} / ${active.targetN}`} icon={<Icon name="CheckCheck" />} />
              <StatTile label={t("qualityPassRate", lang)} value={`${stats.qualityPassRate}%`} tone="green" icon={<Icon name="ShieldCheck" />} />
              <StatTile label={t("botsBlocked", lang)} value={(stats.byQuality["BOT"] ?? 0) + (stats.byQuality["DUPLICATE"] ?? 0)} tone="gold" icon={<Icon name="Bot" />} />
            </div>
            <div className="mt-5">
              <IssueButton studyId={active.id} lang={lang} />
              <p className="mt-2 text-xs text-muted">
                {lang === "ar"
                  ? "سيؤدي الإصدار إلى إغلاق الدراسة وتوثيقها وإنشاء سجل قابل للتحقق علنًا."
                  : "Issuing closes & certifies the study and creates a publicly verifiable record."}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
