"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_GROUPS } from "@/lib/nav";
import { t, type Lang } from "@/lib/strings";
import { Icon } from "./Icon";

const ROLE_GROUP: Record<string, string> = {
  RESEARCHER: "navResearcher",
  SUPERVISOR: "navSupervisor",
  PANELIST: "navParticipant",
  ADMIN: "navPanelOps",
  ENTERPRISE: "navEnterprise",
};

export function MobileNav({ lang, activeRole }: { lang: Lang; activeRole: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="rounded-xl border border-line bg-card p-2 hover:bg-soft"
      >
        <Menu size={18} className="text-ink" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex">
          {/* backdrop */}
          <button
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          {/* drawer */}
          <aside className="relative flex w-72 max-w-[80vw] flex-col bg-deep-green text-white/90">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-heading font-extrabold">ES</span>
                <span className="font-heading font-bold">{t("appName", lang)}</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
              {NAV_GROUPS.map((group) => {
                const isActiveRole = ROLE_GROUP[activeRole] === group.titleKey;
                return (
                  <div key={group.titleKey} className="px-3 py-2">
                    <div className="flex items-center gap-2 px-2 pb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                        {t(group.titleKey, lang)}
                      </span>
                      {isActiveRole ? <span className="h-1.5 w-1.5 rounded-full bg-gold" /> : null}
                    </div>
                    <ul className="space-y-0.5">
                      {group.items.map((item) => {
                        const active = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                                active ? "bg-primary text-white font-semibold" : "text-white/70 hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              <Icon name={item.icon} size={17} />
                              <span>{t(item.labelKey, lang)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
