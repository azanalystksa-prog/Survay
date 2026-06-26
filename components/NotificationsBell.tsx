"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ShieldCheck, UserCheck, BadgeCheck, Activity } from "lucide-react";
import type { Lang } from "@/lib/strings";

interface Note {
  icon: any;
  tone: string;
  title: { en: string; ar: string };
  time: { en: string; ar: string };
  href: string;
}

const NOTES: Note[] = [
  {
    icon: Activity,
    tone: "bg-soft text-primary",
    title: { en: "“AI tools” study passed 281 valid responses", ar: "دراسة «أدوات الذكاء» تجاوزت 281 ردًا صالحًا" },
    time: { en: "2h ago", ar: "قبل ساعتين" },
    href: "/researcher/monitor",
  },
  {
    icon: BadgeCheck,
    tone: "bg-soft-gold text-gold",
    title: { en: "Campus transport certificate awaiting co-signature", ar: "شهادة نقل الحرم بانتظار التوقيع المشترك" },
    time: { en: "5h ago", ar: "قبل 5 ساعات" },
    href: "/supervisor/oversight",
  },
  {
    icon: UserCheck,
    tone: "bg-soft text-info",
    title: { en: "3 panelist verifications pending review", ar: "3 طلبات تحقق بانتظار المراجعة" },
    time: { en: "1d ago", ar: "قبل يوم" },
    href: "/admin/verification",
  },
  {
    icon: ShieldCheck,
    tone: "bg-soft text-primary",
    title: { en: "Ethics approval IRB-2026-0418 granted", ar: "صدرت الموافقة الأخلاقية IRB-2026-0418" },
    time: { en: "2d ago", ar: "قبل يومين" },
    href: "/researcher/ethics",
  },
];

export function NotificationsBell({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); setUnread(false); }}
        className="relative rounded-xl border border-line bg-card p-2 hover:bg-soft"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-muted" />
        {unread ? <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-gold" /> : null}
      </button>

      {open ? (
        <div className="absolute end-0 mt-2 w-80 overflow-hidden rounded-card border border-line bg-card shadow-soft-lg">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="font-heading text-sm font-bold">{lang === "ar" ? "الإشعارات" : "Notifications"}</span>
            <span className="flex items-center gap-1 text-[11px] text-primary"><CheckCheck size={13} /> {lang === "ar" ? "تم وضع علامة مقروء" : "All read"}</span>
          </div>
          <ul className="max-h-96 overflow-y-auto scrollbar-thin">
            {NOTES.map((n, i) => (
              <li key={i} className="border-b border-line last:border-0">
                <Link href={n.href} onClick={() => setOpen(false)} className="flex items-start gap-3 px-4 py-3 hover:bg-soft/60">
                  <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${n.tone}`}>
                    <n.icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug text-ink">{n.title[lang]}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">{n.time[lang]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
