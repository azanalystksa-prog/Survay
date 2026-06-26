"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Check } from "lucide-react";
import { coSignCertificate } from "@/app/actions/certificate";
import { t, type Lang } from "@/lib/strings";

export function CoSignButton({ studyId, signed, lang }: { studyId: string; signed: boolean; lang: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (signed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl bg-soft px-3 py-2 text-sm font-semibold text-primary">
        <Check size={15} /> {lang === "ar" ? "تم التوقيع" : "Co-signed"}
      </span>
    );
  }
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await coSignCertificate(studyId);
          router.refresh();
        })
      }
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-50"
    >
      <PenLine size={15} /> {pending ? t("loading", lang) : t("coSign", lang)}
    </button>
  );
}
