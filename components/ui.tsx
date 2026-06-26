import Link from "next/link";
import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: any;
}) {
  return (
    <As className={`rounded-card bg-card shadow-soft border border-line ${className}`}>{children}</As>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div>
        <h3 className="font-heading text-lg font-bold text-ink">{title}</h3>
        {subtitle ? <p className="text-sm text-muted mt-0.5">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "gold" | "green";
}) {
  const toneClass =
    tone === "gold"
      ? "bg-soft-gold/40 border-gold/30"
      : tone === "green"
        ? "bg-soft border-primary/20"
        : "bg-card border-line";
  return (
    <div className={`rounded-card border ${toneClass} p-4 shadow-soft`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        {icon ? <span className="text-primary">{icon}</span> : null}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-ink tabular">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}

export function ProgressBar({ value, max, tone = "green" }: { value: number; max: number; tone?: "green" | "gold" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const bar = tone === "gold" ? "bg-gold" : "bg-primary";
  return (
    <div className="h-2 w-full rounded-full bg-line overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  DRAFT: "bg-line text-muted",
  PILOT: "bg-soft-gold text-gold",
  COLLECTING: "bg-soft text-primary",
  CLOSED: "bg-line text-ink",
  CERTIFIED: "bg-primary text-white",
  APPROVED: "bg-primary text-white",
  SUBMITTED: "bg-soft text-info",
  VALID: "bg-soft text-primary",
  SPEEDER: "bg-soft-gold text-gold",
  FAILED_ATTENTION: "bg-red-50 text-danger",
  DUPLICATE: "bg-red-50 text-danger",
  BOT: "bg-red-50 text-danger",
  INSTANT: "bg-soft text-primary",
  ON_REQUEST: "bg-soft-gold text-gold",
  PENDING: "bg-soft-gold text-gold",
};

export function Badge({ label, tone, kind }: { label: string; tone?: string; kind?: string }) {
  const cls = (kind && BADGE_TONES[kind]) || tone || "bg-soft text-primary";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

type BtnProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  size?: "sm" | "md";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  target?: string;
};

const VARIANTS: Record<string, string> = {
  primary: "bg-primary text-white hover:bg-deep-green",
  secondary: "bg-soft text-primary border border-primary/20 hover:bg-primary/10",
  ghost: "bg-transparent text-ink hover:bg-soft",
  danger: "bg-red-50 text-danger hover:bg-red-100",
  gold: "bg-gold text-white hover:brightness-95",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled,
  onClick,
  href,
  target,
}: BtnProps) {
  const sizeCls = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm";
  const base = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${sizeCls} ${className}`;
  if (href) {
    return (
      <Link href={href} target={target} className={base}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={base}>
      {children}
    </button>
  );
}

export function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-deep-green/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-soft-gold">
      <span className="h-1.5 w-1.5 rounded-full bg-soft-gold" /> AI
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle ? <p className="text-muted mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-soft/40 p-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {hint ? <p className="text-sm text-muted mt-1">{hint}</p> : null}
    </div>
  );
}
