"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, ShieldCheck, Sparkles, Check } from "lucide-react";
import { generateEthics, markApproved, updateEthicsDoc } from "@/app/actions/ethics";
import { Markdown } from "./Markdown";
import { VerificationSeal } from "./VerificationSeal";
import { t, type Lang } from "@/lib/strings";
import { Badge } from "./ui";

type Field = "consentDocMarkdown" | "infoSheetMarkdown" | "irbSummaryMarkdown" | "pdplNoticeMarkdown";

interface Ethics {
  status: string;
  approvalNumber: string | null;
  consentDocMarkdown: string;
  infoSheetMarkdown: string;
  irbSummaryMarkdown: string;
  pdplNoticeMarkdown: string;
}

export function EthicsPanel({
  studyId,
  ethics,
  lang,
}: {
  studyId: string;
  ethics: Ethics | null;
  lang: Lang;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Field>("consentDocMarkdown");
  const [editing, setEditing] = useState(false);

  const tabs: { key: Field; labelKey: Parameters<typeof t>[0]; icon: any }[] = [
    { key: "consentDocMarkdown", labelKey: "consentForm", icon: FileText },
    { key: "infoSheetMarkdown", labelKey: "infoSheet", icon: FileText },
    { key: "irbSummaryMarkdown", labelKey: "irbSummary", icon: FileText },
    { key: "pdplNoticeMarkdown", labelKey: "pdplNotice", icon: ShieldCheck },
  ];

  function gen() {
    startTransition(async () => {
      await generateEthics(studyId, lang);
      router.refresh();
    });
  }
  function approve() {
    startTransition(async () => {
      await markApproved(studyId);
      router.refresh();
    });
  }

  if (!ethics) {
    return (
      <div className="rounded-card border border-line bg-card p-8 text-center shadow-soft">
        <Sparkles className="mx-auto text-gold" size={28} />
        <h3 className="mt-3 font-heading text-lg font-bold">{lang === "ar" ? "توليد مستندات الأخلاقيات" : "Generate ethics documents"}</h3>
        <p className="mt-1 text-sm text-muted">
          {lang === "ar"
            ? "ننشئ الموافقة المستنيرة وورقة المعلومات وملخص اللجنة وإشعار حماية البيانات من حقول دراستك."
            : "We assemble informed consent, an info sheet, the IRB summary, and a PDPL notice from your study's fields."}
        </p>
        <button onClick={gen} disabled={pending} className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-deep-green disabled:opacity-50">
          {pending ? t("loading", lang) : t("generateDocs", lang)}
        </button>
      </div>
    );
  }

  const approved = ethics.status === "APPROVED";
  const currentDoc = ethics[tab];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="rounded-card border border-line bg-card shadow-soft">
          <div className="flex flex-wrap gap-1 border-b border-line p-2">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => { setTab(tb.key); setEditing(false); }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold ${
                  tab === tb.key ? "bg-primary text-white" : "text-muted hover:bg-soft"
                }`}
              >
                <tb.icon size={14} /> {t(tb.labelKey, lang)}
              </button>
            ))}
          </div>
          <div className="p-5">
            <div className="mb-3 flex justify-end">
              <button onClick={() => setEditing((e) => !e)} className="text-xs font-semibold text-primary hover:underline">
                {editing ? (lang === "ar" ? "معاينة" : "Preview") : (lang === "ar" ? "تحرير" : "Edit")}
              </button>
            </div>
            {editing ? (
              <textarea
                defaultValue={currentDoc}
                rows={18}
                onBlur={(e) =>
                  startTransition(async () => {
                    await updateEthicsDoc(studyId, tab, e.target.value);
                    router.refresh();
                  })
                }
                className="w-full rounded-xl border border-line p-3 font-mono text-xs outline-none focus:border-primary"
              />
            ) : (
              <Markdown source={currentDoc} />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-card border border-line bg-card p-5 text-center shadow-soft">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-sm font-semibold text-muted">{lang === "ar" ? "حالة التقديم" : "Submission status"}</span>
            <Badge label={approved ? t("approved", lang) : ethics.status} kind={ethics.status} />
          </div>
          {approved ? (
            <div className="mt-3 flex flex-col items-center">
              <VerificationSeal size={96} label={t("approved", lang)} />
              <div className="mt-3 rounded-lg bg-soft px-3 py-2">
                <div className="text-[11px] uppercase tracking-wider text-muted">{t("approvalNumber", lang)}</div>
                <div className="font-mono text-lg font-bold text-primary">{ethics.approvalNumber}</div>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-muted">
                {lang === "ar" ? "تمت مراجعة المستندات. حدّد الحالة كموافق عليها لإصدار رقم الموافقة." : "Documents are ready. Mark approved to issue an approval number."}
              </p>
              <button onClick={approve} disabled={pending} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50">
                <Check size={15} /> {t("markApproved", lang)}
              </button>
            </div>
          )}
        </div>
        <button onClick={gen} disabled={pending} className="w-full rounded-xl border border-line bg-card py-2 text-sm font-semibold text-muted hover:bg-soft disabled:opacity-50">
          {lang === "ar" ? "إعادة التوليد بهذه اللغة" : "Regenerate in current language"}
        </button>
      </div>
    </div>
  );
}
