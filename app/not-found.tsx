import Link from "next/link";
import { getLang } from "@/lib/session";
import { t } from "@/lib/strings";
import { VerificationSeal } from "@/components/VerificationSeal";

export default function NotFound() {
  const lang = getLang();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <VerificationSeal size={84} />
      <p className="mt-6 font-mono text-5xl font-bold text-deep-green">404</p>
      <h1 className="mt-2 font-heading text-2xl font-extrabold text-ink">
        {lang === "ar" ? "الصفحة غير موجودة" : "Page not found"}
      </h1>
      <p className="mt-2 max-w-md text-muted">
        {lang === "ar"
          ? "تعذّر العثور على الصفحة المطلوبة. عُد إلى لوحة المعلومات للمتابعة."
          : "We couldn't find the page you were looking for. Head back to the dashboard to continue."}
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/researcher/dashboard"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-deep-green"
        >
          {t("dashboard", lang)}
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-line bg-card px-5 py-2.5 text-sm font-semibold text-ink hover:bg-soft"
        >
          {t("signIn", lang)}
        </Link>
      </div>
    </div>
  );
}
