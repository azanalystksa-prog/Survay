import { getDemoAccounts, getLang } from "@/lib/session";
import { loginAs } from "@/app/actions/session";
import { t } from "@/lib/strings";
import { ROLE_LABELS, type Role } from "@/lib/enums";
import { VerificationSeal } from "@/components/VerificationSeal";

const ROLE_BLURB: Record<Role, { en: string; ar: string }> = {
  RESEARCHER: { en: "Design studies, collect & analyse, issue certificates", ar: "تصميم الدراسات والجمع والتحليل وإصدار الشهادات" },
  SUPERVISOR: { en: "Read-only oversight + co-sign certificates", ar: "إشراف للقراءة فقط وتوقيع مشترك للشهادات" },
  PANELIST: { en: "Phone app: answer surveys, earn points", ar: "تطبيق الجوال: أجب على الاستبيانات واكسب النقاط" },
  ADMIN: { en: "Specialty registry & verification queue", ar: "سجل التخصصات وقائمة التحقق" },
  ENTERPRISE: { en: "Workplace engagement insights", ar: "رؤى انخراط الموظفين" },
};

export default async function SignInPage() {
  const lang = getLang();
  const accounts = await getDemoAccounts();
  // One demo account per role.
  const byRole = new Map<string, (typeof accounts)[number]>();
  for (const a of accounts) if (!byRole.has(a.role)) byRole.set(a.role, a);
  const order: Role[] = ["RESEARCHER", "SUPERVISOR", "PANELIST", "ADMIN", "ENTERPRISE"];

  return (
    <div className="min-h-screen bg-deep-green text-white flex flex-col">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 flex-1 flex flex-col">
        <header className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary font-heading text-lg font-extrabold">ES</div>
          <div>
            <div className="font-heading text-xl font-extrabold">{t("appName", lang)}</div>
            <div className="text-sm text-white/60">{t("tagline", lang)}</div>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 md:grid-cols-2">
          <div>
            <div className="mb-5"><VerificationSeal size={88} label={t("verified", lang)} /></div>
            <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-4xl">
              {lang === "ar"
                ? "بحث جامعي موثوق، من التصميم إلى الشهادة."
                : "Trusted university research, from design to certificate."}
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              {lang === "ar"
                ? "صمّم دراسة، احسب العينة بدقة، اجمع من لوحة موثقة، وأنهِ بشهادة نزاهة بيانات قابلة للتحقق."
                : "Design a study, size the sample rigorously, collect from a verified panel, and finish with a tamper-evident Data Integrity Certificate."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/60">
              <span className="rounded-full border border-white/15 px-3 py-1">Cochran sample size</span>
              <span className="rounded-full border border-white/15 px-3 py-1">Cronbach's α</span>
              <span className="rounded-full border border-white/15 px-3 py-1">PDPL compliant</span>
              <span className="rounded-full border border-white/15 px-3 py-1">Offline-safe AI</span>
            </div>
          </div>

          <div className="rounded-card bg-card p-5 text-ink shadow-soft-lg">
            <h2 className="font-heading text-lg font-bold">{t("signIn", lang)}</h2>
            <p className="text-sm text-muted">
              {lang === "ar" ? "اختر حسابًا تجريبيًا للدخول بنقرة واحدة." : "Pick a demo account to sign in with one click."}
            </p>
            <div className="mt-4 space-y-2">
              {order.map((role) => {
                const a = byRole.get(role);
                if (!a) return null;
                const login = loginAs.bind(null, a.id);
                return (
                  <form action={login} key={role}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl border border-line bg-soft/40 px-3 py-3 text-start transition hover:border-primary hover:bg-soft"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-white">
                        {a.avatarInitials}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold leading-tight">{a.name}</span>
                        <span className="block truncate text-xs text-muted">{ROLE_BLURB[role][lang]}</span>
                      </span>
                      <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                        {ROLE_LABELS[role][lang]}
                      </span>
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
