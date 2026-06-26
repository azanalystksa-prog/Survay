"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calculator, Sparkles, Plus, Trash2, Check, Save } from "lucide-react";
import { computeSampleSize } from "@/lib/stats";
import { saveSamplingPlan, getMethodRecommendation } from "@/app/actions/study";
import type { MethodRecommendation } from "@/lib/ai";
import { t, type Lang } from "@/lib/strings";
import { AiBadge, Badge } from "./ui";

interface Stratum {
  name: string;
  populationPct: number;
}

const METHOD_LABELS: Record<string, { en: string; ar: string }> = {
  RANDOM: { en: "Random", ar: "عشوائي" },
  STRATIFIED: { en: "Stratified", ar: "طبقي" },
  QUOTA: { en: "Quota", ar: "حصصي" },
  CONVENIENCE: { en: "Convenience", ar: "ميسّر" },
};

export function SampleDesigner({
  studyId,
  initial,
  lang,
}: {
  studyId: string;
  initial: { population: number; confidence: number; marginOfError: number; method: string; strata: Stratum[] };
  lang: Lang;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [population, setPopulation] = useState(initial.population);
  const [confidence, setConfidence] = useState(initial.confidence);
  const [margin, setMargin] = useState(initial.marginOfError);
  const [method, setMethod] = useState(initial.method);
  const [strata, setStrata] = useState<Stratum[]>(initial.strata.length ? initial.strata : [{ name: "Engineering", populationPct: 30 }]);
  const [goal, setGoal] = useState("");
  const [rec, setRec] = useState<MethodRecommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const result = computeSampleSize(population || 1, confidence, margin || 1);
  const n = result.n0Rounded;

  function updateStratum(i: number, patch: Partial<Stratum>) {
    setStrata((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  const pctSum = strata.reduce((a, s) => a + (s.populationPct || 0), 0);

  async function recommend() {
    setRecLoading(true);
    const r = await getMethodRecommendation(goal || "general study");
    setRec(r);
    setRecLoading(false);
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      await saveSamplingPlan(studyId, population, confidence, margin, method, method === "STRATIFIED" ? strata : []);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calculator */}
      <div className="space-y-6">
        <div className="rounded-card border border-line bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            <h3 className="font-heading text-lg font-bold">{t("requiredSample", lang)}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">{t("population", lang)}</label>
              <input
                type="number"
                value={population}
                onChange={(e) => setPopulation(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-mono outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">{t("confidence", lang)}</label>
              <div className="mt-1 flex gap-2">
                {[90, 95, 99].map((c) => (
                  <button
                    key={c}
                    onClick={() => setConfidence(c)}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold ${
                      confidence === c ? "border-primary bg-primary text-white" : "border-line hover:bg-soft"
                    }`}
                  >
                    {c}%
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted">{t("marginOfError", lang)}</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="w-14 rounded-lg bg-soft px-2 py-1 text-center font-mono text-sm font-semibold">±{margin}%</span>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-5 rounded-xl bg-deep-green p-5 text-white">
            <div className="text-xs uppercase tracking-wider text-white/60">{t("requiredSample", lang)} (n₀)</div>
            <div className="font-mono text-5xl font-bold tabular">{n}</div>
            <div className="mt-2 text-sm text-white/70">
              {t("withFpc", lang)}: <span className="font-mono font-semibold text-soft-gold">{result.correctedRounded}</span>
            </div>
            <div className="mt-3 rounded-lg bg-white/10 p-3">
              <div className="text-[11px] uppercase tracking-wider text-white/50">{t("formulaUsed", lang)}</div>
              <code className="mt-1 block break-words font-mono text-xs leading-relaxed text-soft-gold">{result.formula}</code>
            </div>
            <p className="mt-2 text-[11px] text-white/50">
              Cochran (1977): n₀ = Z²·p(1−p)/e², p=0.5 · FPC: n = n₀ / (1 + (n₀−1)/N)
            </p>
          </div>
        </div>
      </div>

      {/* Method recommender + strata */}
      <div className="space-y-6">
        <div className="rounded-card border border-deep-green/20 bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-gold" />
              <h3 className="font-heading text-base font-bold">{t("methodRecommender", lang)}</h3>
            </div>
            <AiBadge />
          </div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted">{t("researchGoal", lang)}</label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
            placeholder={lang === "ar" ? "مثال: مقارنة الرضا بين الكليات…" : "e.g., compare satisfaction across colleges…"}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={recommend}
            disabled={recLoading}
            className="mt-2 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-white hover:bg-deep-green disabled:opacity-50"
          >
            {recLoading ? t("loading", lang) : t("recommend", lang)}
          </button>

          {rec ? (
            <div className="mt-3 rounded-xl border border-gold/40 bg-soft-gold/20 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{lang === "ar" ? "موصى به:" : "Recommended:"}</span>
                <Badge label={METHOD_LABELS[rec.method][lang]} tone="bg-gold text-white" />
              </div>
              <p className="mt-2 text-xs text-muted">{rec.rationale}</p>
              <p className="mt-1 text-xs text-muted"><span className="font-semibold">{lang === "ar" ? "المقايضة:" : "Trade-off:"}</span> {rec.tradeoff}</p>
              <button
                onClick={() => setMethod(rec.method)}
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white"
              >
                <Check size={12} /> {lang === "ar" ? "اعتماد هذه الطريقة" : "Confirm this method"}
              </button>
            </div>
          ) : null}
          <p className="mt-3 rounded-lg bg-soft/60 px-3 py-2 text-[11px] text-muted">{t("methodNote", lang)}</p>
        </div>

        {/* Method selector */}
        <div className="rounded-card border border-line bg-card p-5 shadow-soft">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">{lang === "ar" ? "طريقة المعاينة" : "Sampling method"}</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.keys(METHOD_LABELS).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`rounded-xl border py-2 text-sm font-semibold ${
                  method === m ? "border-primary bg-primary text-white" : "border-line hover:bg-soft"
                }`}
              >
                {METHOD_LABELS[m][lang]}
              </button>
            ))}
          </div>

          {method === "STRATIFIED" ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{t("stratifiedPlan", lang)}</span>
                <span className={`text-xs font-mono ${pctSum === 100 ? "text-primary" : "text-danger"}`}>Σ {pctSum}%</span>
              </div>
              <div className="space-y-2">
                {strata.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={s.name}
                      onChange={(e) => updateStratum(i, { name: e.target.value })}
                      className="flex-1 rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="number"
                      value={s.populationPct}
                      onChange={(e) => updateStratum(i, { populationPct: Number(e.target.value) })}
                      className="w-16 rounded-lg border border-line px-2 py-1.5 text-center font-mono text-sm outline-none focus:border-primary"
                    />
                    <span className="text-xs text-muted">%</span>
                    <span className="w-12 text-end font-mono text-xs text-primary">{Math.round((s.populationPct / 100) * n)}</span>
                    <button onClick={() => setStrata((st) => st.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStrata((s) => [...s, { name: "New stratum", populationPct: 0 }])}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus size={13} /> {lang === "ar" ? "إضافة طبقة" : "Add stratum"}
              </button>
              <div className="mt-1 flex justify-between text-[11px] text-muted">
                <span>{t("stratum", lang)} · %</span>
                <span>{t("quota", lang)}</span>
              </div>
            </div>
          ) : null}

          <button
            onClick={save}
            disabled={pending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-deep-green disabled:opacity-50"
          >
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? (lang === "ar" ? "تم الحفظ" : "Saved — target updated") : pending ? t("loading", lang) : t("save", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
