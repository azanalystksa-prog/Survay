"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { redeemReward } from "@/app/actions/survey";
import { Icon } from "./Icon";
import type { Lang } from "@/lib/strings";

const REWARDS = [
  { name: "STC 50 SAR voucher", cost: 500, icon: "Smartphone", color: "bg-info/10 text-info" },
  { name: "Jarir 100 SAR gift card", cost: 1000, icon: "BookOpen", color: "bg-soft-gold text-gold" },
  { name: "Coffee voucher", cost: 250, icon: "Coffee", color: "bg-soft text-primary" },
  { name: "Amazon.sa 200 SAR", cost: 2000, icon: "ShoppingBag", color: "bg-soft text-primary" },
];

export function RedeemList({ lang, balance }: { lang: Lang; balance: number }) {
  const router = useRouter();
  const [bal, setBal] = useState(balance);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function redeem(cost: number, name: string) {
    setBusy(true);
    const res = await redeemReward(cost, name);
    setBusy(false);
    setMsg(res.message);
    if (res.ok) {
      setBal(res.newBalance);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-3 rounded-xl bg-gradient-to-br from-primary to-deep-green px-4 py-3 text-white">
        <div className="text-[11px] uppercase tracking-wider text-white/60">{lang === "ar" ? "رصيدك" : "Your balance"}</div>
        <div className="font-mono text-2xl font-semibold tabular">{bal.toLocaleString()}</div>
      </div>
      {msg ? <p className="mb-3 rounded-lg bg-soft px-3 py-2 text-xs text-primary">{msg}</p> : null}
      <ul className="space-y-2">
        {REWARDS.map((r) => {
          const can = bal >= r.cost;
          return (
            <li key={r.name} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3">
              <span className={`grid h-10 w-10 place-items-center rounded-lg ${r.color}`}>
                <Icon name={r.icon} size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{r.name}</span>
                <span className="block font-mono text-xs text-muted tabular">{r.cost} pts</span>
              </span>
              <button
                onClick={() => redeem(r.cost, r.name)}
                disabled={!can || busy}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:bg-line disabled:text-muted"
              >
                {lang === "ar" ? "استبدال" : "Redeem"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
