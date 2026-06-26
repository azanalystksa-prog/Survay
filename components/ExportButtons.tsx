"use client";

import { Download, FileText } from "lucide-react";
import type { Lang } from "@/lib/strings";
import { t } from "@/lib/strings";

export function ExportButtons({ studyId, lang }: { studyId: string; lang: Lang }) {
  return (
    <div className="flex items-center gap-2">
      <a
        href={`/api/export/csv?study=${studyId}`}
        className="inline-flex items-center gap-2 rounded-xl bg-soft px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
      >
        <Download size={15} /> {t("exportCsv", lang)}
      </a>
      <a
        href={`/api/export/codebook?study=${studyId}`}
        className="inline-flex items-center gap-2 rounded-xl bg-soft px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
      >
        <FileText size={15} /> {t("exportCodebook", lang)}
      </a>
    </div>
  );
}
