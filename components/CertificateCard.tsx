import { VerificationSeal } from "./VerificationSeal";
import { t, type Lang } from "@/lib/strings";

export interface CertData {
  studyTitle: string;
  sampleMethod: string;
  validResponses: number;
  targetResponses: number;
  qualityPassRate: number;
  botsBlocked: number;
  collectionStart: Date;
  collectionEnd: Date;
  ethicsApprovalNumber: string | null;
  verifyCode: string;
  issuedAt: Date;
  supervisorName: string | null;
  supervisorSignedAt: Date | null;
  researcherName: string;
  institutionName: string;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function CertificateCard({ cert, lang }: { cert: CertData; lang: Lang }) {
  const rows: { label: string; value: string }[] = [
    { label: lang === "ar" ? "طريقة المعاينة" : "Sampling method", value: cert.sampleMethod },
    { label: t("validResponses", lang), value: `${cert.validResponses} / ${cert.targetResponses}` },
    { label: t("qualityPassRate", lang), value: `${cert.qualityPassRate}%` },
    { label: t("botsBlocked", lang), value: String(cert.botsBlocked) },
    { label: t("collectionWindow", lang), value: `${fmtDate(cert.collectionStart)} → ${fmtDate(cert.collectionEnd)}` },
    { label: t("approvalNumber", lang), value: cert.ethicsApprovalNumber ?? "—" },
  ];

  return (
    <div className="print-full overflow-hidden rounded-card border-2 border-gold/40 bg-card shadow-soft-lg">
      <div className="bg-deep-green px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-soft-gold">{t("appName", lang)}</div>
            <h2 className="font-heading text-xl font-extrabold">{t("dataIntegrityCertificate", lang)}</h2>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary font-heading font-extrabold">ES</div>
        </div>
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <h3 className="font-heading text-lg font-bold text-ink">{cert.studyTitle}</h3>
          <p className="text-sm text-muted">
            {cert.researcherName} · {cert.institutionName}
          </p>

          <dl className="mt-4 divide-y divide-line">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between py-2.5">
                <dt className="text-sm text-muted">{r.label}</dt>
                <dd className="font-mono text-sm font-semibold tabular text-ink">{r.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-xl bg-soft p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted">{t("verifyCode", lang)}</div>
            <div className="flex items-center justify-between">
              <code className="font-mono text-lg font-bold tracking-wider text-primary">{cert.verifyCode}</code>
              <span className="text-xs text-muted">/verify/{cert.verifyCode}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-line md:border-s md:ps-6">
          <VerificationSeal size={120} label={t("verified", lang)} />
          <div className="w-full text-center">
            {cert.supervisorSignedAt ? (
              <div className="rounded-xl border border-primary/30 bg-soft p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted">{t("signedBy", lang)}</div>
                <div className="font-semibold text-ink">{cert.supervisorName}</div>
                <div className="text-xs text-muted">{fmtDate(cert.supervisorSignedAt)}</div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line p-3 text-xs text-muted">
                {lang === "ar" ? "بانتظار توقيع المشرف" : "Awaiting supervisor co-signature"}
              </div>
            )}
            <div className="mt-2 text-[11px] text-muted">
              {lang === "ar" ? "صدرت في" : "Issued"} {fmtDate(cert.issuedAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
