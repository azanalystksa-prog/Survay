"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { decideVerification } from "@/app/actions/admin";
import { t, type Lang } from "@/lib/strings";
import { Badge } from "./ui";

interface Req {
  id: string;
  name: string;
  claimedCredential: string;
  specialty: string;
  status: string;
}

export function VerificationQueue({ requests, lang }: { requests: Req[]; lang: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function decide(id: string, decision: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      await decideVerification(id, decision);
      router.refresh();
    });
  }

  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-card p-4 shadow-soft">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-soft font-bold text-primary">
            {r.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink">{r.name}</div>
            <div className="text-xs text-muted">
              {r.specialty} · {r.claimedCredential}
            </div>
          </div>
          {r.status === "PENDING" ? (
            <div className="flex gap-2">
              <button
                onClick={() => decide(r.id, "APPROVED")}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-deep-green disabled:opacity-50"
              >
                <Check size={14} /> {t("approve", lang)}
              </button>
              <button
                onClick={() => decide(r.id, "REJECTED")}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-danger hover:bg-red-100 disabled:opacity-50"
              >
                <X size={14} /> {t("reject", lang)}
              </button>
            </div>
          ) : (
            <Badge label={r.status === "APPROVED" ? t("approved", lang) : (lang === "ar" ? "مرفوض" : "Rejected")} kind={r.status === "APPROVED" ? "APPROVED" : "FAILED_ATTENTION"} />
          )}
        </li>
      ))}
      {requests.length === 0 ? (
        <li className="rounded-card border border-dashed border-line bg-soft/40 p-6 text-center text-sm text-muted">
          {lang === "ar" ? "لا توجد طلبات معلقة" : "No pending requests"}
        </li>
      ) : null}
    </ul>
  );
}
