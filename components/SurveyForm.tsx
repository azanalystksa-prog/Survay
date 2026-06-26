"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { submitResponse } from "@/app/actions/survey";
import { Icon } from "./Icon";
import type { Lang } from "@/lib/strings";
import { t } from "@/lib/strings";

interface Q {
  id: string;
  order: number;
  text: string;
  type: string;
  required: boolean;
  scaleMin: number | null;
  scaleMax: number | null;
  options: { id: string; label: string }[];
}

const LIKERT_LABELS_EN = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
const LIKERT_LABELS_AR = ["لا أوافق بشدة", "لا أوافق", "محايد", "أوافق", "أوافق بشدة"];

export function SurveyForm({ studyId, title, questions, lang }: { studyId: string; title: string; questions: Q[]; lang: Lang }) {
  const router = useRouter();
  const startRef = useRef<number>(Date.now());
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; valueText?: string; valueNumber?: number; multi?: string[] }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setSingle(qid: string, optionId: string, label: string) {
    setAnswers((a) => ({ ...a, [qid]: { optionId, valueText: label } }));
  }
  function setLikert(qid: string, value: number) {
    setAnswers((a) => ({ ...a, [qid]: { valueNumber: value } }));
  }
  function setNumber(qid: string, value: string) {
    setAnswers((a) => ({ ...a, [qid]: { valueNumber: value === "" ? undefined : Number(value) } }));
  }
  function setText(qid: string, value: string) {
    setAnswers((a) => ({ ...a, [qid]: { valueText: value } }));
  }
  function toggleMulti(qid: string, optionId: string) {
    setAnswers((a) => {
      const cur = a[qid]?.multi ?? [];
      const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId];
      return { ...a, [qid]: { multi: next } };
    });
  }

  async function onSubmit() {
    setError(null);
    // Validate required
    for (const q of questions) {
      if (!q.required) continue;
      const a = answers[q.id];
      const empty =
        !a ||
        (q.type === "SINGLE" && !a.optionId) ||
        (q.type === "LIKERT" && a.valueNumber == null) ||
        (q.type === "NUMBER" && a.valueNumber == null) ||
        (q.type === "SHORT_TEXT" && !a.valueText) ||
        (q.type === "MULTI" && (!a.multi || a.multi.length === 0));
      if (empty) {
        setError(lang === "ar" ? "يرجى الإجابة على جميع الأسئلة الإلزامية." : "Please answer all required questions.");
        return;
      }
    }

    type AnswerOut = { questionId: string; optionId?: string; valueText?: string; valueNumber?: number };
    const payload = {
      studyId,
      durationSec: Math.max(1, Math.round((Date.now() - startRef.current) / 1000)),
      answers: questions.flatMap((q): AnswerOut[] => {
        const a = answers[q.id];
        if (!a) return [];
        if (q.type === "MULTI" && a.multi) {
          return a.multi.map((optionId) => ({ questionId: q.id, optionId, valueText: q.options.find((o) => o.id === optionId)?.label }));
        }
        return [{ questionId: q.id, optionId: a.optionId, valueText: a.valueText, valueNumber: a.valueNumber }];
      }),
    };

    setSubmitting(true);
    const res = await submitResponse(payload);
    setSubmitting(false);
    if (res.ok) {
      router.push(`/panelist?done=1&pts=${res.pointsAwarded}`);
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  const likertLabels = lang === "ar" ? LIKERT_LABELS_AR : LIKERT_LABELS_EN;

  return (
    <div>
      <p className="mb-4 text-sm text-muted">{title}</p>
      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="mb-3 flex gap-2">
              <span className="font-mono text-sm font-semibold text-primary">{idx + 1}.</span>
              <span className="text-sm font-semibold text-ink">
                {q.text}
                {q.required ? <span className="text-danger"> *</span> : null}
              </span>
            </div>

            {q.type === "SINGLE" ? (
              <div className="space-y-2">
                {q.options.map((o) => {
                  const sel = answers[q.id]?.optionId === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setSingle(q.id, o.id, o.label)}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-sm transition ${
                        sel ? "border-primary bg-soft font-semibold text-primary" : "border-line hover:bg-soft/50"
                      }`}
                    >
                      <span className={`grid h-4 w-4 place-items-center rounded-full border ${sel ? "border-primary" : "border-muted"}`}>
                        {sel ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                      </span>
                      {o.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {q.type === "MULTI" ? (
              <div className="space-y-2">
                {q.options.map((o) => {
                  const sel = answers[q.id]?.multi?.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      onClick={() => toggleMulti(q.id, o.id)}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-sm transition ${
                        sel ? "border-primary bg-soft font-semibold text-primary" : "border-line hover:bg-soft/50"
                      }`}
                    >
                      <span className={`grid h-4 w-4 place-items-center rounded border ${sel ? "border-primary bg-primary" : "border-muted"}`}>
                        {sel ? <Icon name="Check" size={12} className="text-white" /> : null}
                      </span>
                      {o.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {q.type === "LIKERT" ? (
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((v) => {
                  const sel = answers[q.id]?.valueNumber === v;
                  return (
                    <button
                      key={v}
                      onClick={() => setLikert(q.id, v)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition ${
                        sel ? "border-primary bg-primary text-white" : "border-line hover:bg-soft/50"
                      }`}
                    >
                      <span className="font-mono text-base font-semibold">{v}</span>
                      <span className="text-[9px] leading-tight">{likertLabels[v - 1]}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {q.type === "NUMBER" ? (
              <input
                type="number"
                inputMode="numeric"
                onChange={(e) => setNumber(q.id, e.target.value)}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="0"
              />
            ) : null}

            {q.type === "SHORT_TEXT" ? (
              <textarea
                onChange={(e) => setText(q.id, e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder={lang === "ar" ? "اكتب إجابتك…" : "Type your answer…"}
              />
            ) : null}
          </div>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="mt-5 w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-deep-green disabled:opacity-60"
      >
        {submitting ? t("loading", lang) : t("submit", lang)}
      </button>
    </div>
  );
}
