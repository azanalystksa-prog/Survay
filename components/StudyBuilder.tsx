"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronUp, ChevronDown, Sparkles, Check, X, Rocket, GripVertical, Copy } from "lucide-react";
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  moveQuestion,
  addOption,
  updateOption,
  deleteOption,
  runReview,
  applyFlag,
  launchStudy,
  updateStudyMeta,
} from "@/app/actions/study";
import type { ReviewResult, QuestionFlag } from "@/lib/ai";
import type { QuestionType } from "@/lib/enums";
import { t, type Lang } from "@/lib/strings";
import { AiBadge, Badge } from "./ui";

interface Option {
  id: string;
  label: string;
}
interface Question {
  id: string;
  order: number;
  text: string;
  type: string;
  required: boolean;
  scaleMin: number | null;
  scaleMax: number | null;
  options: Option[];
}

const TYPE_LABELS: Record<QuestionType, { en: string; ar: string }> = {
  SINGLE: { en: "Single choice", ar: "اختيار واحد" },
  MULTI: { en: "Multiple choice", ar: "اختيار متعدد" },
  LIKERT: { en: "Likert scale", ar: "مقياس ليكرت" },
  SHORT_TEXT: { en: "Short text", ar: "نص قصير" },
  NUMBER: { en: "Number", ar: "رقم" },
};

// Rough completion time estimate (seconds) per question type.
const TIME_PER_TYPE: Record<string, number> = { SINGLE: 8, MULTI: 12, LIKERT: 7, SHORT_TEXT: 25, NUMBER: 8 };

export function StudyBuilder({
  study,
  questions,
  lang,
}: {
  study: { id: string; title: string; description: string };
  questions: Question[];
  lang: Lang;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);

  const totalSec = questions.reduce((acc, q) => acc + (TIME_PER_TYPE[q.type] ?? 10), 0);
  const estMin = Math.max(1, Math.round(totalSec / 60));

  function act(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  async function doReview() {
    setReviewing(true);
    const res = await runReview(study.id);
    setReview(res);
    setDismissed(new Set());
    setReviewing(false);
  }

  function onApply(flag: QuestionFlag) {
    setDismissed((d) => new Set(d).add(flagKey(flag)));
    act(async () => {
      await applyFlag(flag.questionId, flag.suggestedText, flag.kind);
      // refresh review to reflect the change
    });
  }

  const visibleFlags = (review?.flags ?? []).filter((f) => !dismissed.has(flagKey(f)));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Builder column */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-card border border-line bg-card p-5 shadow-soft">
          <label className="text-xs font-bold uppercase tracking-wider text-muted">{lang === "ar" ? "عنوان الدراسة" : "Study title"}</label>
          <input
            defaultValue={study.title}
            onBlur={(e) => act(() => updateStudyMeta(study.id, { title: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-heading text-lg font-bold outline-none focus:border-primary"
          />
          <label className="mt-3 block text-xs font-bold uppercase tracking-wider text-muted">{lang === "ar" ? "الوصف" : "Description"}</label>
          <textarea
            defaultValue={study.description}
            rows={2}
            onBlur={(e) => act(() => updateStudyMeta(study.id, { description: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">{t("questionnaireBuilder", lang)}</h3>
          <Badge label={`${t("estCompletion", lang)}: ~${estMin} min`} tone="bg-soft-gold text-gold" />
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const flagged = visibleFlags.find((f) => f.questionId === q.id);
            return (
              <div
                key={q.id}
                className={`rounded-card border bg-card p-4 shadow-soft ${flagged ? "border-gold ring-1 ring-gold/40" : "border-line"}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center pt-1 text-muted">
                    <GripVertical size={15} />
                    <span className="font-mono text-xs">{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge label={TYPE_LABELS[q.type as QuestionType][lang]} tone="bg-soft text-primary" />
                      {flagged ? <Badge label={flagged.label} tone="bg-soft-gold text-gold" /> : null}
                    </div>
                    <textarea
                      defaultValue={q.text}
                      key={q.text}
                      rows={2}
                      onBlur={(e) => act(() => updateQuestion(q.id, { text: e.target.value }))}
                      className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                    />

                    {(q.type === "SINGLE" || q.type === "MULTI") && (
                      <div className="mt-2 space-y-1.5">
                        {q.options.map((o) => (
                          <div key={o.id} className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full border border-muted" />
                            <input
                              defaultValue={o.label}
                              onBlur={(e) => act(() => updateOption(o.id, e.target.value))}
                              className="flex-1 rounded-lg border border-line px-2 py-1 text-sm outline-none focus:border-primary"
                            />
                            <button onClick={() => act(() => deleteOption(o.id))} className="text-muted hover:text-danger">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => act(() => addOption(q.id))}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <Plus size={13} /> {lang === "ar" ? "إضافة خيار" : "Add option"}
                        </button>
                      </div>
                    )}

                    {q.type === "LIKERT" && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                        <span>{lang === "ar" ? "النقاط" : "Points"}:</span>
                        <span className="font-mono font-semibold text-ink">
                          {(q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1}
                        </span>
                        <span>({q.scaleMin}–{q.scaleMax})</span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          defaultChecked={q.required}
                          onChange={(e) => act(() => updateQuestion(q.id, { required: e.target.checked }))}
                          className="accent-primary"
                        />
                        {t("required", lang)}
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => act(() => moveQuestion(q.id, "up"))} disabled={idx === 0} className="rounded-lg p-1 text-muted hover:bg-soft disabled:opacity-30">
                      <ChevronUp size={16} />
                    </button>
                    <button onClick={() => act(() => moveQuestion(q.id, "down"))} disabled={idx === questions.length - 1} className="rounded-lg p-1 text-muted hover:bg-soft disabled:opacity-30">
                      <ChevronDown size={16} />
                    </button>
                    <button onClick={() => act(() => duplicateQuestion(q.id))} title={lang === "ar" ? "تكرار" : "Duplicate"} className="rounded-lg p-1 text-muted hover:bg-soft hover:text-primary">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => act(() => deleteQuestion(q.id))} className="rounded-lg p-1 text-muted hover:bg-red-50 hover:text-danger">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {questions.length === 0 ? (
            <div className="rounded-card border border-dashed border-line bg-soft/40 p-6 text-center text-sm text-muted">
              {lang === "ar" ? "أضف أول سؤال للبدء." : "Add your first question to begin."}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 rounded-card border border-line bg-card p-3 shadow-soft">
          <span className="self-center text-xs font-semibold text-muted">{t("addQuestion", lang)}:</span>
          {(["SINGLE", "MULTI", "LIKERT", "SHORT_TEXT", "NUMBER"] as QuestionType[]).map((type) => (
            <button
              key={type}
              onClick={() => act(() => addQuestion(study.id, type))}
              className="inline-flex items-center gap-1 rounded-xl bg-soft px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              <Plus size={13} /> {TYPE_LABELS[type][lang]}
            </button>
          ))}
        </div>

        <LaunchPanel studyId={study.id} questionCount={questions.length} lang={lang} />
      </div>

      {/* AI reviewer column */}
      <div className="space-y-4">
        <div className="rounded-card border border-deep-green/20 bg-card shadow-soft">
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-gold" />
              <h3 className="font-heading text-base font-bold">{t("aiReviewer", lang)}</h3>
            </div>
            <AiBadge />
          </div>
          <div className="px-5 pb-5">
            <button
              onClick={doReview}
              disabled={reviewing || pending || questions.length === 0}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-deep-green disabled:opacity-50"
            >
              {reviewing ? t("loading", lang) : t("runReview", lang)}
            </button>

            {review && visibleFlags.length === 0 ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-soft px-3 py-3 text-sm text-primary">
                <Check size={16} /> {t("noFlags", lang)}
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {visibleFlags.map((flag) => (
                <div key={flagKey(flag)} className="rounded-xl border border-gold/40 bg-soft-gold/20 p-3">
                  <div className="flex items-center gap-2">
                    <Badge label={flag.label} tone="bg-gold text-white" />
                  </div>
                  <p className="mt-2 text-xs text-muted">{flag.explanation}</p>
                  {flag.kind !== "unbalanced_scale" ? (
                    <div className="mt-2 rounded-lg bg-card p-2 text-xs">
                      <span className="font-semibold text-primary">{lang === "ar" ? "اقتراح:" : "Suggestion:"}</span>{" "}
                      {flag.suggestedText}
                    </div>
                  ) : null}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => onApply(flag)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white hover:bg-deep-green"
                    >
                      <Check size={12} /> {t("apply", lang)}
                    </button>
                    <button
                      onClick={() => setDismissed((d) => new Set(d).add(flagKey(flag)))}
                      className="inline-flex items-center gap-1 rounded-lg bg-soft px-2.5 py-1 text-xs font-semibold text-muted hover:bg-line"
                    >
                      <X size={12} /> {t("dismiss", lang)}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 rounded-lg bg-soft/60 px-3 py-2 text-[11px] text-muted">{t("reviewerNote", lang)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaunchPanel({ studyId, questionCount, lang }: { studyId: string; questionCount: number; lang: Lang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="rounded-card border border-primary/30 bg-soft p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-heading font-bold text-ink">{lang === "ar" ? "إطلاق الدراسة" : "Launch study"}</h4>
          <p className="text-xs text-muted">
            {lang === "ar"
              ? "بعد الإطلاق ستظهر للمشاركين المطابقين في تطبيق الجوال."
              : "Once launched, matching panelists see it in the phone app."}
          </p>
        </div>
        <button
          onClick={() =>
            startTransition(async () => {
              await launchStudy(studyId);
              router.push("/researcher/monitor?study=" + studyId);
              router.refresh();
            })
          }
          disabled={pending || questionCount === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-deep-green disabled:opacity-50"
        >
          <Rocket size={16} /> {pending ? t("loading", lang) : lang === "ar" ? "إطلاق" : "Launch"}
        </button>
      </div>
    </div>
  );
}

function flagKey(f: QuestionFlag): string {
  return `${f.questionId}:${f.kind}`;
}
