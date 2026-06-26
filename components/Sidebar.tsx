"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_GROUPS } from "@/lib/nav";
import { t, type Lang } from "@/lib/strings";
import { Icon } from "./Icon";

export function Sidebar({ lang, activeRole }: { lang: Lang; activeRole: string }) {
  const pathname = usePathname();

  // Highlight the nav group matching the current role.
  const roleGroupTitle: Record<string, string> = {
    RESEARCHER: "navResearcher",
    SUPERVISOR: "navSupervisor",
    PANELIST: "navParticipant",
    ADMIN: "navPanelOps",
    ENTERPRISE: "navEnterprise",
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-deep-green text-white/90 min-h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white font-heading font-extrabold">ES</div>
        <div>
          <div className="font-heading font-bold leading-tight">{t("appName", lang)}</div>
          <div className="text-[11px] text-white/50">{t("tagline", lang)}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3">
        {NAV_GROUPS.map((group) => {
          const isActiveRole = roleGroupTitle[activeRole] === group.titleKey;
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
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                          active ? "bg-primary text-white font-semibold shadow-soft" : "text-white/70 hover:bg-white/5 hover:text-white"
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

      <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/40">
        PDPL-compliant · Local & offline
      </div>
    </aside>
  );
}
