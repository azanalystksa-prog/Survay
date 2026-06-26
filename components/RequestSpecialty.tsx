"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { requestSpecialty } from "@/app/actions/admin";
import { t, type Lang } from "@/lib/strings";

export function RequestSpecialty({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [done, setDone] = useState(false);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-card border border-line bg-card p-4 shadow-soft">
      <div className="flex-1 min-w-[160px]">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">{lang === "ar" ? "التخصص" : "Specialty"}</label>
        <input
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          placeholder={lang === "ar" ? "مثال: طبيب أسنان" : "e.g., Dentist"}
          className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="w-32">
        <label className="text-xs font-bold uppercase tracking-wider text-muted">{lang === "ar" ? "المدينة" : "City"}</label>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary">
          {["Riyadh", "Jeddah", "Dammam"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <button
        onClick={() => {
          if (!specialty) return;
          startTransition(async () => {
            await requestSpecialty(specialty, city);
            setDone(true);
            setSpecialty("");
            router.refresh();
          });
        }}
        disabled={pending || !specialty}
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-deep-green disabled:opacity-50"
      >
        <Plus size={15} /> {t("requestSpecialty", lang)}
      </button>
      {done ? <span className="text-xs text-primary">{lang === "ar" ? "تم تسجيل الطلب" : "Demand logged"}</span> : null}
    </div>
  );
}
