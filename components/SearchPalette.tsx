"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, FileText, Compass } from "lucide-react";
import { NAV_GROUPS } from "@/lib/nav";
import { t, type Lang } from "@/lib/strings";
import { STUDY_STATUS_LABELS, type StudyStatus } from "@/lib/enums";

interface StudyLite {
  id: string;
  title: string;
  status: string;
}
interface Entry {
  label: string;
  sub: string;
  href: string;
  kind: "page" | "study";
}

export function SearchPalette({ lang, studies }: { lang: Lang; studies: StudyLite[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const index: Entry[] = useMemo(() => {
    const pages: Entry[] = NAV_GROUPS.flatMap((g) =>
      g.items.map((it) => ({ label: t(it.labelKey, lang), sub: t(g.titleKey, lang), href: it.href, kind: "page" as const })),
    );
    const studyEntries: Entry[] = studies.map((s) => ({
      label: s.title,
      sub: STUDY_STATUS_LABELS[s.status as StudyStatus]?.[lang] ?? s.status,
      href: `/researcher/monitor?study=${s.id}`,
      kind: "study" as const,
    }));
    return [...studyEntries, ...pages];
  }, [lang, studies]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return index.slice(0, 6);
    return index.filter((e) => e.label.toLowerCase().includes(needle) || e.sub.toLowerCase().includes(needle)).slice(0, 8);
  }, [q, index]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(entry: Entry) {
    setOpen(false);
    setQ("");
    router.push(entry.href);
  }

  return (
    <div ref={boxRef} className="relative flex-1 max-w-md">
      <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-muted" size={16} />
      <input
        type="search"
        value={q}
        placeholder={t("search", lang)}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        className="w-full rounded-xl border border-line bg-soft/50 py-2 ps-9 pe-3 text-sm outline-none focus:border-primary"
      />

      {open ? (
        <div className="absolute start-0 end-0 mt-2 overflow-hidden rounded-card border border-line bg-card shadow-soft-lg">
          {results.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted">{lang === "ar" ? "لا نتائج" : "No matches"}</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto scrollbar-thin py-1">
              {results.map((e, i) => (
                <li key={`${e.kind}-${e.href}-${i}`}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(e)}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-start ${i === active ? "bg-soft" : "hover:bg-soft/60"}`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${e.kind === "study" ? "bg-soft-gold text-gold" : "bg-soft text-primary"}`}>
                      {e.kind === "study" ? <FileText size={14} /> : <Compass size={14} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{e.label}</span>
                      <span className="block truncate text-xs text-muted">{e.sub}</span>
                    </span>
                    {i === active ? <CornerDownLeft size={14} className="text-muted" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
