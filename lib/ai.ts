// Single server module for all AI features.
// Contract: if ANTHROPIC_API_KEY exists and the network works → call the Anthropic API.
// Otherwise → use the deterministic rule-based fallback. Either way return the SAME
// structured shape and NEVER throw to the UI.

import { suggestTest, type VariableType, type TestSuggestion } from "./stats";
import type { QuestionType } from "./enums";

export type AiSource = "ai" | "fallback";

export interface QuestionFlag {
  questionId: string;
  questionText: string;
  kind: "leading" | "double_barreled" | "unbalanced_scale" | "vague";
  label: string;
  explanation: string;
  suggestedText: string; // a neutral rewrite for the single item
}

export interface ReviewResult {
  flags: QuestionFlag[];
  source: AiSource;
}

export interface QInput {
  id: string;
  text: string;
  type: QuestionType;
  scaleMin?: number | null;
  scaleMax?: number | null;
  optionCount?: number;
}

const LEADING_PATTERNS = [
  "don't you agree",
  "dont you agree",
  "isn't it true",
  "isnt it true",
  "obviously",
  "shouldn't we",
  "shouldnt we",
  "wouldn't you say",
  "surely",
  "everyone knows",
];

const LOADED_ADJECTIVES = ["amazing", "terrible", "excellent", "awful", "wonderful", "horrible", "fantastic", "poor"];
const VAGUE_TERMS = ["often", "regularly", "sometimes", "frequently", "occasionally"];

function neutralRephrase(text: string): string {
  // Strip leading-question framing into a neutral stem.
  let t = text.trim();
  const lower = t.toLowerCase();
  for (const p of [...LEADING_PATTERNS, "do you think that", "do you agree that"]) {
    const idx = lower.indexOf(p);
    if (idx !== -1) {
      t = t.slice(idx + p.length).trim();
      break;
    }
  }
  t = t.replace(/^that\s+/i, "").replace(/\?+$/, "").trim();
  if (!t) t = text.replace(/\?+$/, "").trim();
  const core = t.charAt(0).toUpperCase() + t.slice(1);
  return `To what extent do you agree or disagree: "${core}"?`;
}

export function ruleBasedReview(questions: QInput[]): QuestionFlag[] {
  const flags: QuestionFlag[] = [];
  for (const q of questions) {
    const lower = q.text.toLowerCase();

    // Leading question
    const hitPattern = LEADING_PATTERNS.find((p) => lower.includes(p));
    const hitAdj = LOADED_ADJECTIVES.find((a) => lower.includes(a));
    if (hitPattern || hitAdj) {
      flags.push({
        questionId: q.id,
        questionText: q.text,
        kind: "leading",
        label: "Leading question",
        explanation: hitPattern
          ? `The phrase "${hitPattern}" pushes respondents toward a particular answer. Use neutral wording.`
          : `The loaded word "${hitAdj}" signals a preferred answer. Use neutral wording.`,
        suggestedText: neutralRephrase(q.text),
      });
      continue; // one flag per item keeps Apply unambiguous
    }

    // Double-barreled: "and"/"or" joining two askable clauses
    if (/\b(and|or)\b/i.test(q.text)) {
      const parts = q.text.split(/\b(?:and|or)\b/i).map((s) => s.trim());
      const askable = parts.filter((s) => s.split(/\s+/).length >= 2);
      if (askable.length >= 2) {
        flags.push({
          questionId: q.id,
          questionText: q.text,
          kind: "double_barreled",
          label: "Double-barreled question",
          explanation:
            "This asks about two things at once, so a single answer is ambiguous. Split it into separate questions.",
          suggestedText: `${askable[0].replace(/\?+$/, "")}?`,
        });
        continue;
      }
    }

    // Unbalanced Likert scale: even number of points or missing neutral midpoint
    if (q.type === "LIKERT" && q.scaleMin != null && q.scaleMax != null) {
      const points = q.scaleMax - q.scaleMin + 1;
      if (points % 2 === 0) {
        const mid = q.scaleMin + Math.floor(points / 2);
        flags.push({
          questionId: q.id,
          questionText: q.text,
          kind: "unbalanced_scale",
          label: "Unbalanced scale (no midpoint)",
          explanation: `An even ${points}-point scale forces a side. Add a neutral midpoint for a balanced ${points + 1}-point scale.`,
          suggestedText: q.text,
        });
        continue;
      }
    }

    // Vague wording without a timeframe
    const hitVague = VAGUE_TERMS.find((v) => new RegExp(`\\b${v}\\b`, "i").test(q.text));
    if (hitVague && !/(per (day|week|month|year)|daily|weekly|monthly|in the (last|past))/i.test(q.text)) {
      flags.push({
        questionId: q.id,
        questionText: q.text,
        kind: "vague",
        label: "Vague frequency wording",
        explanation: `"${hitVague}" is undefined. Specify a concrete timeframe (e.g., "in the past 7 days").`,
        suggestedText: q.text.replace(new RegExp(`\\b${hitVague}\\b`, "i"), `${hitVague} (in the past 7 days)`),
      });
    }
  }
  return flags;
}

// ---- Method recommender ----

export interface MethodRecommendation {
  method: "RANDOM" | "STRATIFIED" | "QUOTA" | "CONVENIENCE";
  rationale: string;
  tradeoff: string;
  source: AiSource;
}

export function ruleBasedMethod(goal: string): Omit<MethodRecommendation, "source"> {
  const g = goal.toLowerCase();
  if (/(compar|differ|between groups|across (colleges|groups|departments)|subgroup|strat)/.test(g)) {
    return {
      method: "STRATIFIED",
      rationale:
        "Your goal involves comparing subgroups, so stratified sampling guarantees enough respondents in each stratum.",
      tradeoff: "More planning and a known population frame are required, but subgroup estimates are precise.",
    };
  }
  if (/(represent|generaliz|estimate|prevalence|population|nationwide)/.test(g)) {
    return {
      method: "RANDOM",
      rationale:
        "Your goal is a representative estimate of the whole population, so simple random sampling minimizes selection bias.",
      tradeoff: "Needs a complete sampling frame and can be costly to reach everyone.",
    };
  }
  if (/(fast|quick|practical|pilot|exploratory|budget|cheap)/.test(g)) {
    return {
      method: "CONVENIENCE",
      rationale:
        "Your goal is fast/practical exploration, so convenience sampling collects data quickly — with caveats.",
      tradeoff: "Results may not generalize; treat findings as indicative and state the limitation.",
    };
  }
  return {
    method: "QUOTA",
    rationale:
      "Quota sampling fills preset targets per group, balancing practicality with rough representativeness.",
    tradeoff: "Non-random selection within quotas can still introduce bias.",
  };
}

// ---- Test suggester (wraps the deterministic decision tree) ----

export interface TestSuggestionResult extends TestSuggestion {
  source: AiSource;
}

export function suggestTestResult(params: {
  outcomeType: VariableType;
  predictorType: VariableType;
  groupCount?: number;
}): TestSuggestionResult {
  return { ...suggestTest(params), source: "fallback" };
}

// ---- Anthropic wrapper with timeout + graceful fallback ----

async function withAnthropic<T>(
  build: (text: string) => T | null,
  prompt: string,
): Promise<T | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: key });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const msg = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    const text = msg.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return build(text);
  } catch {
    return null; // any error → caller uses fallback
  }
}

/**
 * Review a questionnaire. Tries AI first (if configured), falls back to rules.
 * Always returns a ReviewResult and never throws.
 */
export async function reviewQuestionnaire(questions: QInput[]): Promise<ReviewResult> {
  const fallback = ruleBasedReview(questions);
  const ai = await withAnthropic<QuestionFlag[]>((text) => {
    try {
      const parsed = JSON.parse(extractJson(text));
      if (!Array.isArray(parsed)) return null;
      // Validate the AI output maps to our shape; otherwise null → fallback.
      return parsed
        .filter((f) => f && typeof f.questionId === "string")
        .map((f) => ({
          questionId: f.questionId,
          questionText: questions.find((q) => q.id === f.questionId)?.text ?? "",
          kind: (f.kind ?? "leading") as QuestionFlag["kind"],
          label: String(f.label ?? "Issue"),
          explanation: String(f.explanation ?? ""),
          suggestedText: String(f.suggestedText ?? ""),
        }));
    } catch {
      return null;
    }
  }, buildReviewPrompt(questions));

  if (ai && ai.length >= 0 && process.env.ANTHROPIC_API_KEY) {
    return { flags: ai, source: "ai" };
  }
  return { flags: fallback, source: "fallback" };
}

export async function recommendMethod(goal: string): Promise<MethodRecommendation> {
  const fb = ruleBasedMethod(goal);
  // For demo-safety and determinism we keep the rule-based recommendation as the
  // structured result; AI (when present) is used to enrich the rationale text only.
  const ai = await withAnthropic<string>((text) => text.trim(), `In one sentence, explain the trade-off of using ${fb.method} sampling for this goal: "${goal}".`);
  return { ...fb, source: ai ? "ai" : "fallback", tradeoff: ai || fb.tradeoff };
}

function extractJson(text: string): string {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text;
}

function buildReviewPrompt(questions: QInput[]): string {
  return [
    "You are a survey methodologist. Review each question for: leading wording, double-barreled questions, unbalanced Likert scales (even points / missing midpoint), and vague frequency terms.",
    "Return ONLY a JSON array. Each element: {questionId, kind, label, explanation, suggestedText}. kind ∈ {leading, double_barreled, unbalanced_scale, vague}. suggestedText is a neutral rewrite of that one item. Only include flagged questions.",
    "Questions:",
    JSON.stringify(questions.map((q) => ({ id: q.id, text: q.text, type: q.type, scaleMin: q.scaleMin, scaleMax: q.scaleMax }))),
  ].join("\n\n");
}
