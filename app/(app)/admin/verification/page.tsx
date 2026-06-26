import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { t } from "@/lib/strings";
import { PageHeader, StatTile } from "@/components/ui";
import { VerificationQueue } from "@/components/VerificationQueue";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const lang = getLang();
  const requests = await prisma.verificationRequest.findMany({ orderBy: { createdAt: "asc" } });
  const pending = requests.filter((r) => r.status === "PENDING").length;

  const verifiedCounts = await prisma.panelistProfile.groupBy({ by: ["verifiedBy"], _count: true });
  const verified = verifiedCounts.filter((v) => v.verifiedBy !== "NONE").reduce((a, v) => a + v._count, 0);

  return (
    <div>
      <PageHeader
        title={t("verification", lang)}
        subtitle={lang === "ar" ? "مراجعة بيانات اعتماد المشاركين" : "Review panelists' claimed credentials"}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={lang === "ar" ? "طلبات معلقة" : "Pending requests"} value={pending} tone="gold" icon={<Icon name="Clock" />} />
        <StatTile label={lang === "ar" ? "مشاركون موثقون" : "Verified panelists"} value={verified.toLocaleString()} tone="green" icon={<Icon name="UserCheck" />} />
        <StatTile label={lang === "ar" ? "أساليب التحقق" : "Verification methods"} value="3" hint="UNI_EMAIL · CREDENTIAL · EMPLOYER" icon={<Icon name="ShieldCheck" />} />
      </div>

      <div className="mt-6">
        <h3 className="mb-3 font-heading text-base font-bold">{t("verificationQueue", lang)}</h3>
        <VerificationQueue requests={requests} lang={lang} />
      </div>
    </div>
  );
}
