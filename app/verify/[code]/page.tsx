import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { t } from "@/lib/strings";
import { CertificateCard } from "@/components/CertificateCard";
import { VerificationSeal } from "@/components/VerificationSeal";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function VerifyPage({ params }: { params: { code: string } }) {
  const lang = getLang();
  const cert = await prisma.certificate.findUnique({
    where: { verifyCode: decodeURIComponent(params.code) },
    include: { study: { include: { researcher: { include: { institution: true } } } } },
  });

  return (
    <div className="min-h-screen bg-canvas">
      <div className="bg-deep-green px-6 py-4 text-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-heading font-extrabold">ES</span>
          <span className="font-heading font-bold">{t("appName", lang)}</span>
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {cert ? (
          <>
            <div className="mb-6 flex items-center gap-3 rounded-card border border-primary/30 bg-soft p-4">
              <VerificationSeal size={56} />
              <div>
                <div className="font-heading text-lg font-bold text-primary">
                  {lang === "ar" ? "هذه الشهادة صحيحة" : "This certificate is valid"}
                </div>
                <p className="text-sm text-muted">
                  {lang === "ar"
                    ? "تم التحقق من سلسلة عهدة البيانات عبر الرمز الفريد المخزَّن."
                    : "Chain of custody verified against the stored unique code."}
                </p>
              </div>
            </div>
            <CertificateCard
              lang={lang}
              cert={{
                studyTitle: cert.study.title,
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
                researcherName: cert.study.researcher.name,
                institutionName: cert.study.researcher.institution?.name ?? "King Saud University",
              }}
            />
          </>
        ) : (
          <div className="rounded-card border border-danger/30 bg-card p-8 text-center shadow-soft">
            <Icon name="ShieldAlert" size={36} className="mx-auto text-danger" />
            <h1 className="mt-3 font-heading text-xl font-bold text-ink">
              {lang === "ar" ? "رمز غير معروف" : "Unknown verification code"}
            </h1>
            <p className="mt-1 text-muted">
              {lang === "ar" ? "لم يتم العثور على شهادة بهذا الرمز:" : "No certificate matches the code:"}{" "}
              <code className="font-mono">{params.code}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
