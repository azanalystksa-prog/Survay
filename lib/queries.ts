import { prisma } from "./db";
import { mean, sampleStdDev, cronbachAlpha, frequencies, oneWayAnovaF, round } from "./stats";

export interface StudyStats {
  total: number;
  valid: number;
  excluded: number;
  qualityPassRate: number;
  medianDurationSec: number;
  byQuality: Record<string, number>;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export async function getStudyStats(studyId: string): Promise<StudyStats> {
  const responses = await prisma.response.findMany({ where: { studyId } });
  const valid = responses.filter((r) => r.included && r.qualityStatus === "VALID");
  const excluded = responses.filter((r) => !r.included);
  const byQuality: Record<string, number> = {};
  for (const r of responses) byQuality[r.qualityStatus] = (byQuality[r.qualityStatus] ?? 0) + 1;
  const total = responses.length;
  const passRate = total > 0 ? round((valid.length / total) * 100, 1) : 0;
  return {
    total,
    valid: valid.length,
    excluded: excluded.length,
    qualityPassRate: passRate,
    medianDurationSec: Math.round(median(valid.map((r) => r.durationSec))),
    byQuality,
  };
}

export interface QuestionAnalysis {
  questionId: string;
  text: string;
  type: string;
  n: number;
  mean?: number;
  sd?: number;
  min?: number;
  max?: number;
  frequencies?: { label: string; count: number; pct: number }[];
}

export async function getStudyAnalysis(studyId: string) {
  const study = await prisma.study.findUnique({
    where: { id: studyId },
    include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
  });
  if (!study) return null;

  const responses = await prisma.response.findMany({
    where: { studyId, included: true, qualityStatus: "VALID" },
    include: { answers: true },
  });

  const questionAnalyses: QuestionAnalysis[] = [];
  const likertQuestions = study.questions.filter((q) => q.type === "LIKERT");

  for (const q of study.questions) {
    const answers = responses.map((r) => r.answers.find((a) => a.questionId === q.id)).filter(Boolean) as {
      valueNumber: number | null;
      valueText: string | null;
      optionId: string | null;
    }[];

    if (q.type === "LIKERT" || q.type === "NUMBER") {
      const nums = answers.map((a) => a.valueNumber).filter((v): v is number => v != null);
      questionAnalyses.push({
        questionId: q.id,
        text: q.text,
        type: q.type,
        n: nums.length,
        mean: nums.length ? round(mean(nums), 2) : 0,
        sd: nums.length ? round(sampleStdDev(nums), 2) : 0,
        min: nums.length ? Math.min(...nums) : 0,
        max: nums.length ? Math.max(...nums) : 0,
      });
    } else {
      // SINGLE / MULTI / SHORT_TEXT → frequencies by option label or text
      const labels = answers
        .map((a) => {
          if (a.optionId) return q.options.find((o) => o.id === a.optionId)?.label ?? a.valueText ?? "—";
          return a.valueText ?? "—";
        })
        .filter(Boolean) as string[];
      const freq = frequencies(labels);
      const totalN = labels.length;
      questionAnalyses.push({
        questionId: q.id,
        text: q.text,
        type: q.type,
        n: totalN,
        frequencies: Object.entries(freq)
          .map(([label, count]) => ({ label, count, pct: totalN ? round((count / totalN) * 100, 1) : 0 }))
          .sort((a, b) => b.count - a.count),
      });
    }
  }

  // Cronbach's alpha across all Likert items (respondents who answered every item).
  let alpha = 0;
  let alphaN = 0;
  if (likertQuestions.length >= 2) {
    const matrix: number[][] = [];
    for (const r of responses) {
      const row: number[] = [];
      let complete = true;
      for (const lq of likertQuestions) {
        const a = r.answers.find((x) => x.questionId === lq.id);
        if (a?.valueNumber == null) {
          complete = false;
          break;
        }
        row.push(a.valueNumber);
      }
      if (complete) matrix.push(row);
    }
    alphaN = matrix.length;
    alpha = round(cronbachAlpha(matrix), 3);
  }

  // ANOVA: a Likert outcome across the first categorical (SINGLE) grouping variable.
  let anova: { F: number; groups: { name: string; mean: number; n: number }[]; outcome: string; grouping: string } | null = null;
  const grouping = study.questions.find((q) => q.type === "SINGLE");
  const outcome = likertQuestions[0];
  if (grouping && outcome) {
    const groupsMap: Record<string, number[]> = {};
    for (const r of responses) {
      const gAns = r.answers.find((a) => a.questionId === grouping.id);
      const oAns = r.answers.find((a) => a.questionId === outcome.id);
      const gLabel = gAns?.optionId
        ? grouping.options.find((o) => o.id === gAns.optionId)?.label ?? gAns.valueText
        : gAns?.valueText;
      if (gLabel && oAns?.valueNumber != null) {
        (groupsMap[gLabel] = groupsMap[gLabel] || []).push(oAns.valueNumber);
      }
    }
    const groupEntries = Object.entries(groupsMap).filter(([, v]) => v.length >= 2);
    if (groupEntries.length >= 2) {
      const { F } = oneWayAnovaF(groupEntries.map(([, v]) => v));
      anova = {
        F: round(F, 2),
        outcome: outcome.text,
        grouping: grouping.text,
        groups: groupEntries.map(([name, v]) => ({ name, mean: round(mean(v), 2), n: v.length })),
      };
    }
  }

  return {
    study,
    responseCount: responses.length,
    questionAnalyses,
    alpha,
    alphaN,
    likertCount: likertQuestions.length,
    anova,
  };
}

export async function getResponsesOverTime(studyId: string) {
  const responses = await prisma.response.findMany({
    where: { studyId, included: true },
    orderBy: { startedAt: "asc" },
    select: { startedAt: true },
  });
  const byDay: Record<string, number> = {};
  for (const r of responses) {
    const day = r.startedAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  let cumulative = 0;
  return Object.entries(byDay).map(([day, count]) => {
    cumulative += count;
    return { day: day.slice(5), count, cumulative };
  });
}
