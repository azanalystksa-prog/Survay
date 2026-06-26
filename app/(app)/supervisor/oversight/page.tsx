import { prisma } from "@/lib/db";
import { getLang } from "@/lib/session";
import { getStudyStats } from "@/lib/queries";
import { t } from "@/lib/strings";
import { STUDY_STATUS_LABELS, type StudyStatus } from "@/lib/enums";
import { Card, CardHeader, PageHeader, Badge, ProgressBar, StatTile } from "@/components/ui";
import { CoSignButton } from "@/components/CoSignButton";
import { VerificationSeal } from "@/components/VerificationSeal";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function OversightPage() {
  const lang = getLang();
  const supervisor = await prisma.user.findFirst({ where: { role: "SUPERVISOR" } });
  const studies = await prisma.study.findMany({
    where: { supervisorId: supervisor?.id },
    orderBy: { createdAt: "desc" },
    include: { researcher: true, certificate: true, ethicsApproval: true },
  });

  const rows = [];
  for (const s of studies) {
    rows.push({ study: s, stats: await getStudyStats(s.id) });
  }

  const certified = rows.filter((r) => r.study.certificate).length;
  const totalValid = rows.reduce((a, r) => a + r.stats.valid, 0);

  return (
    <div>
      <PageHeader
        title={t("oversight", lang)}
        subtitle={`${supervisor?.name} — ${lang === "ar" ? "دراسات طلابك" : "your students' studies"}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={lang === "ar" ? "دراسات تحت الإشراف" : "Studies supervised"} value={studies.length} tone="green" icon={<Icon name="Eye" />} />
        <StatTile label={lang === "ar" ? "شهادات موثّقة" : "Certified studies"} value={certified} tone="gold" icon={<Icon name="BadgeCheck" />} />
        <StatTile label={t("validResponses", lang)} value={totalValid.toLocaleString()} icon={<Icon name="Database" />} />
      </div>

      <Card className="mt-6">
        <CardHeader title={lang === "ar" ? "نظرة عامة على الدراسات" : "Studies overview"} />
        <div className="overflow-x-auto px-2 pb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted">
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "العنوان / الباحث" : "Title / Researcher"}</th>
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "الطريقة" : "Method"}</th>
                <th className="px-3 py-2 text-start font-semibold">{t("validResponses", lang)}</th>
                <th className="px-3 py-2 text-start font-semibold">{lang === "ar" ? "النزاهة" : "Integrity"}</th>
                <th className="px-3 py-2 text-start font-semibold">{t("stage", lang)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ study: s, stats }) => (
                <tr key={s.id} className="border-t border-line align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-ink">{s.title}</div>
                    <div className="text-xs text-muted">{s.researcher.name}</div>
                  </td>
                  <td className="px-3 py-3 text-muted">{s.samplingMethod}</td>
                  <td className="px-3 py-3 w-40">
                    <div className="mb-1 font-mono text-xs tabular">{stats.valid}/{s.targetN}</div>
                    <ProgressBar value={stats.valid} max={s.targetN} />
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono font-semibold tabular text-ink">{stats.total > 0 ? `${stats.qualityPassRate}%` : "—"}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge label={STUDY_STATUS_LABELS[s.status as StudyStatus][lang]} kind={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trust + co-sign panels for certified studies */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {rows
          .filter((r) => r.study.certificate)
          .map(({ study: s, stats }) => (
            <Card key={s.id}>
              <CardHeader title={s.title} subtitle={lang === "ar" ? "لماذا يمكنك الوثوق بهذه البيانات" : "Why you can trust this data"} />
              <div className="px-5 pb-5">
                <div className="flex gap-4">
                  <VerificationSeal size={72} />
                  <ul className="flex-1 space-y-2 text-sm">
                    <TrustRow icon="ShieldCheck" text={`${lang === "ar" ? "معدل اجتياز الجودة" : "Quality pass rate"}: ${s.certificate!.qualityPassRate}%`} />
                    <TrustRow icon="Bot" text={`${s.certificate!.botsBlocked} ${lang === "ar" ? "روبوت/مكرر محجوب" : "bots/duplicates blocked"}`} />
                    <TrustRow icon="FileCheck" text={`${lang === "ar" ? "موافقة أخلاقية" : "Ethics approval"}: ${s.certificate!.ethicsApprovalNumber ?? "—"}`} />
                    <TrustRow icon="Users" text={`${stats.valid} ${lang === "ar" ? "ردًا صالحًا · معاينة" : "valid responses ·"} ${s.samplingMethod}`} />
                  </ul>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <a href={`/verify/${s.certificate!.verifyCode}`} target="_blank" className="text-xs font-semibold text-primary hover:underline">
                    /verify/{s.certificate!.verifyCode}
                  </a>
                  <CoSignButton studyId={s.id} signed={!!s.certificate!.supervisorSignedAt} lang={lang} />
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

function TrustRow({ icon, text }: { icon: string; text: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-lg bg-soft text-primary">
        <Icon name={icon} size={13} />
      </span>
      <span className="text-muted">{text}</span>
    </li>
  );
}
