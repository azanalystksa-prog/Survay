"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Printer, ExternalLink } from "lucide-react";
import { issueCertificate } from "@/app/actions/certificate";
import { t, type Lang } from "@/lib/strings";

export function IssueButton({ studyId, lang }: { studyId: string; lang: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await issueCertificate(studyId);
          router.refresh();
        })
      }
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-deep-green disabled:opacity-50"
    >
      <BadgeCheck size={16} /> {pending ? t("loading", lang) : t("issueCertificate", lang)}
    </button>
  );
}

export function CertToolbar({ verifyCode, lang }: { verifyCode: string; lang: Lang }) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <a
        href={`/verify/${verifyCode}`}
        target="_blank"
        className="inline-flex items-center gap-2 rounded-xl bg-soft px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
      >
        <ExternalLink size={15} /> {t("verified", lang)} /verify
      </a>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
      >
        <Printer size={15} /> {t("downloadPdf", lang)}
      </button>
    </div>
  );
}
