"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, RefreshCw, RotateCcw } from "lucide-react";
import { t, type Lang } from "@/lib/strings";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { switchToRole, setLang } from "@/app/actions/session";
import { resetDemo } from "@/app/actions/demo";
import { MobileNav } from "./MobileNav";
import { SearchPalette } from "./SearchPalette";
import { NotificationsBell } from "./NotificationsBell";

interface Account {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
}

export function Topbar({
  lang,
  currentUser,
  studies = [],
}: {
  lang: Lang;
  currentUser: { name: string; role: string; avatarInitials: string };
  studies?: { id: string; title: string; status: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  function doReset() {
    setMenuOpen(false);
    setResetting(true);
    startTransition(async () => {
      await resetDemo();
      router.refresh();
      setResetting(false);
    });
  }

  const roles: Role[] = ["RESEARCHER", "SUPERVISOR", "PANELIST", "ADMIN", "ENTERPRISE"];

  function toggleLang() {
    startTransition(async () => {
      await setLang(lang === "en" ? "ar" : "en");
      router.refresh();
    });
  }

  function chooseRole(role: Role) {
    setMenuOpen(false);
    startTransition(async () => {
      await switchToRole(role);
    });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-card/80 px-4 backdrop-blur md:px-6">
      <MobileNav lang={lang} activeRole={currentUser.role} />
      <SearchPalette lang={lang} studies={studies} />

      {/* EN / ع language toggle */}
      <button
        onClick={toggleLang}
        className="flex items-center gap-1 rounded-xl border border-line bg-card px-3 py-2 text-sm font-semibold hover:bg-soft"
        aria-label="Toggle language"
      >
        <span className={lang === "en" ? "text-primary" : "text-muted"}>EN</span>
        <span className="text-line">/</span>
        <span className={lang === "ar" ? "text-primary" : "text-muted"}>ع</span>
      </button>

      <NotificationsBell lang={lang} />

      {/* Avatar + role switcher */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-line bg-card px-2 py-1.5 hover:bg-soft"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white">
            {currentUser.avatarInitials}
          </span>
          <span className="hidden text-start sm:block">
            <span className="block text-sm font-semibold leading-tight">{currentUser.name}</span>
            <span className="block text-[11px] text-muted">
              {ROLE_LABELS[currentUser.role as Role]?.[lang] ?? currentUser.role}
            </span>
          </span>
          <ChevronDown size={16} className="text-muted" />
        </button>

        {menuOpen ? (
          <div className="absolute end-0 mt-2 w-60 rounded-card border border-line bg-card p-2 shadow-soft-lg">
            <div className="px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted">
              {t("switchRole", lang)}
            </div>
            {roles.map((role) => {
              const active = currentUser.role === role;
              return (
                <button
                  key={role}
                  onClick={() => chooseRole(role)}
                  disabled={pending}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-soft ${
                    active ? "font-semibold text-primary" : "text-ink"
                  }`}
                >
                  <span>{ROLE_LABELS[role][lang]}</span>
                  {active ? <Check size={15} className="text-primary" /> : null}
                </button>
              );
            })}
            <div className="my-1 border-t border-line" />
            <button
              onClick={doReset}
              disabled={resetting}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-gold hover:bg-soft-gold/40 disabled:opacity-60"
            >
              <RotateCcw size={14} className={resetting ? "animate-spin" : ""} /> {t("resetDemo", lang)}
            </button>
            <a
              href="/"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted hover:bg-soft"
            >
              <RefreshCw size={14} /> {t("signIn", lang)}
            </a>
          </div>
        ) : null}
      </div>
    </header>
  );
}
