// Real statistics helpers. All formulas per the build brief, Section 9.
// Pure functions, unit-tested in scripts/test-stats.ts.

export const Z_SCORES: Record<number, number> = {
  90: 1.645,
  95: 1.96,
  99: 2.576,
};

/**
 * Cochran's sample size for a large population.
 * n0 = (Z^2 * p * (1-p)) / e^2  with p = 0.5
 */
export function cochranN0(confidence: number, marginOfError: number, p = 0.5): number {
  const z = Z_SCORES[confidence] ?? 1.96;
  const e = marginOfError; // decimal, e.g. 0.05
  return (z * z * p * (1 - p)) / (e * e);
}

/**
 * Finite population correction: n = n0 / (1 + (n0 - 1) / N)
 */
export function finitePopulationCorrection(n0: number, population: number): number {
  if (!population || population <= 0) return n0;
  return n0 / (1 + (n0 - 1) / population);
}

export interface SampleSizeResult {
  n0: number; // unrounded
  n0Rounded: number;
  corrected: number; // unrounded
  correctedRounded: number;
  z: number;
  confidence: number;
  marginOfError: number;
  population: number;
  formula: string;
}

export function computeSampleSize(
  population: number,
  confidence: number,
  marginOfErrorPct: number,
): SampleSizeResult {
  const e = marginOfErrorPct / 100;
  const z = Z_SCORES[confidence] ?? 1.96;
  const n0 = cochranN0(confidence, e);
  const corrected = finitePopulationCorrection(n0, population);
  return {
    n0,
    // The textbook "≈384" figure is the rounded uncorrected Cochran n0 (384.16).
    n0Rounded: Math.round(n0),
    corrected,
    correctedRounded: Math.ceil(corrected),
    z,
    confidence,
    marginOfError: marginOfErrorPct,
    population,
    formula: `n0 = (${z}² · 0.5 · 0.5) / ${e}² = ${Math.ceil(n0)} ;  n = n0 / (1 + (n0−1)/N) = ${Math.ceil(corrected)}`,
  };
}

// ---- Descriptives ----

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Sample variance (n-1 denominator). */
export function sampleVariance(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const m = mean(values);
  return values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (n - 1);
}

export function sampleStdDev(values: number[]): number {
  return Math.sqrt(sampleVariance(values));
}

export function frequencies<T extends string | number>(values: T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const v of values) {
    const k = String(v);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Cross-tabulation of two categorical variables. */
export function crossTab(
  rows: string[],
  cols: string[],
): { table: Record<string, Record<string, number>>; rowKeys: string[]; colKeys: string[] } {
  const table: Record<string, Record<string, number>> = {};
  const rowKeys = new Set<string>();
  const colKeys = new Set<string>();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const c = cols[i];
    rowKeys.add(r);
    colKeys.add(c);
    if (!table[r]) table[r] = {};
    table[r][c] = (table[r][c] ?? 0) + 1;
  }
  return { table, rowKeys: [...rowKeys], colKeys: [...colKeys] };
}

/**
 * Cronbach's alpha.
 * α = (k / (k-1)) * (1 - (Σ Var(item_i) / Var(total)))
 * @param itemScores rows = respondents, columns = items
 */
export function cronbachAlpha(itemScores: number[][]): number {
  const nRespondents = itemScores.length;
  if (nRespondents < 2) return 0;
  const k = itemScores[0]?.length ?? 0;
  if (k < 2) return 0;

  // Per-item variance (across respondents).
  let sumItemVar = 0;
  for (let j = 0; j < k; j++) {
    const col = itemScores.map((row) => row[j]);
    sumItemVar += sampleVariance(col);
  }

  // Total-score variance.
  const totals = itemScores.map((row) => row.reduce((a, b) => a + b, 0));
  const totalVar = sampleVariance(totals);
  if (totalVar === 0) return 0;

  return (k / (k - 1)) * (1 - sumItemVar / totalVar);
}

// ---- Suggested-test decision tree ----

export type VariableType = "continuous" | "likert" | "categorical";

export interface TestSuggestion {
  test: string;
  reason: string;
  assumptions: string;
}

export function suggestTest(params: {
  outcomeType: VariableType;
  predictorType: VariableType;
  groupCount?: number;
}): TestSuggestion {
  const { outcomeType, predictorType, groupCount = 2 } = params;
  const outcomeNumeric = outcomeType === "continuous" || outcomeType === "likert";

  if (outcomeNumeric && predictorType === "categorical") {
    if (groupCount <= 2) {
      return {
        test: "Independent-samples t-test",
        reason:
          "A numeric/Likert outcome is being compared across 2 groups, so an independent-samples t-test compares the two group means.",
        assumptions: "Check assumptions (normality, equal variance) first.",
      };
    }
    return {
      test: "One-way ANOVA",
      reason:
        "A numeric/Likert outcome is being compared across 3+ groups, so one-way ANOVA tests whether any group means differ.",
      assumptions: "Check assumptions (normality, equal variance) first.",
    };
  }

  if (outcomeType === "categorical" && predictorType === "categorical") {
    return {
      test: "Chi-square test of independence",
      reason: "Two categorical variables are being related, so a chi-square test assesses their association.",
      assumptions: "Check assumptions (expected cell counts ≥ 5) first.",
    };
  }

  if (outcomeNumeric && (predictorType === "continuous" || predictorType === "likert")) {
    return {
      test: "Pearson correlation (and simple linear regression)",
      reason:
        "Two continuous variables are being related, so Pearson correlation quantifies the linear association (regression models the relationship).",
      assumptions: "Check assumptions (linearity, normality) first.",
    };
  }

  return {
    test: "Descriptive summary",
    reason: "The variable combination does not map to a standard inferential test; summarize descriptively.",
    assumptions: "Check assumptions before any inferential test.",
  };
}

// One-way ANOVA F statistic (for a real computed value in the analysis screen).
export function oneWayAnovaF(groups: number[][]): { F: number; dfBetween: number; dfWithin: number } {
  const k = groups.length;
  const all = groups.flat();
  const grandMean = mean(all);
  const N = all.length;

  let ssBetween = 0;
  let ssWithin = 0;
  for (const g of groups) {
    const gm = mean(g);
    ssBetween += g.length * (gm - grandMean) ** 2;
    for (const v of g) ssWithin += (v - gm) ** 2;
  }
  const dfBetween = k - 1;
  const dfWithin = N - k;
  const msBetween = dfBetween > 0 ? ssBetween / dfBetween : 0;
  const msWithin = dfWithin > 0 ? ssWithin / dfWithin : 0;
  const F = msWithin > 0 ? msBetween / msWithin : 0;
  return { F, dfBetween, dfWithin };
}

export function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
