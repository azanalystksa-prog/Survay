"use client";

import { useRouter, usePathname } from "next/navigation";

export function StudySelector({
  studies,
  current,
  basePath,
}: {
  studies: { id: string; title: string; status: string }[];
  current: string;
  basePath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <select
      value={current}
      onChange={(e) => router.push(`${basePath ?? pathname}?study=${e.target.value}`)}
      className="rounded-xl border border-line bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
    >
      {studies.map((s) => (
        <option key={s.id} value={s.id}>
          {s.title} · {s.status}
        </option>
      ))}
    </select>
  );
}
