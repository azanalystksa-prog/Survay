// Lightweight unit tests for lib/stats.ts (no test framework needed).
import {
  computeSampleSize,
  cochranN0,
  finitePopulationCorrection,
  mean,
  sampleStdDev,
  sampleVariance,
  cronbachAlpha,
  suggestTest,
  frequencies,
} from "../lib/stats";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function approx(a: number, b: number, tol = 0.01) {
  return Math.abs(a - b) <= tol;
}

console.log("Cochran sample size:");
{
  const r = computeSampleSize(42000, 95, 5);
  assert("N=42000, 95%, ±5% → n0 ≈ 384", r.n0Rounded === 384, `got ${r.n0Rounded}`);
  assert("FPC-corrected n is slightly lower (~381)", r.correctedRounded === 381, `got ${r.correctedRounded}`);
  const r3 = computeSampleSize(42000, 95, 3);
  assert("tighter margin ±3% increases N", r3.correctedRounded > r.correctedRounded, `got ${r3.correctedRounded}`);
  assert("n0 for 95%/±5% rounds to 384 (384.16)", Math.round(cochranN0(95, 0.05)) === 384, `got ${Math.round(cochranN0(95, 0.05))}`);
  const r99 = computeSampleSize(42000, 99, 5);
  assert("higher confidence increases N", r99.correctedRounded > r.correctedRounded, `got ${r99.correctedRounded}`);
}

console.log("Finite population correction:");
{
  const n0 = cochranN0(95, 0.05);
  assert("fpc reduces n0", finitePopulationCorrection(n0, 1000) < n0);
  assert("fpc with no population returns n0", finitePopulationCorrection(n0, 0) === n0);
}

console.log("Descriptives:");
{
  const v = [2, 4, 4, 4, 5, 5, 7, 9];
  assert("mean", approx(mean(v), 5));
  assert("sample variance", approx(sampleVariance(v), 4.571, 0.01), `got ${sampleVariance(v)}`);
  assert("sample sd", approx(sampleStdDev(v), 2.138, 0.01), `got ${sampleStdDev(v)}`);
  const f = frequencies(["a", "b", "a", "a"]);
  assert("frequencies", f["a"] === 3 && f["b"] === 1);
}

console.log("Cronbach's alpha:");
{
  // Classic worked example → alpha ≈ 0.69
  const data = [
    [1, 2, 2, 1],
    [2, 3, 3, 2],
    [3, 3, 3, 3],
    [4, 4, 4, 4],
    [5, 5, 5, 5],
  ];
  const a = cronbachAlpha(data);
  assert("alpha in valid (0..1) range", a > 0 && a <= 1, `got ${a}`);
  // Highly consistent identical-ish items → high alpha
  assert("high consistency → high alpha", a > 0.9, `got ${a}`);

  const noisy = [
    [1, 5, 2, 4],
    [5, 1, 4, 2],
    [2, 4, 1, 5],
    [4, 2, 5, 1],
  ];
  assert("inconsistent items → low/negative alpha", cronbachAlpha(noisy) < 0.5, `got ${cronbachAlpha(noisy)}`);
}

console.log("Test suggester decision tree:");
{
  assert(
    "2 groups + likert → t-test",
    suggestTest({ outcomeType: "likert", predictorType: "categorical", groupCount: 2 }).test.includes("t-test"),
  );
  assert(
    "3+ groups + continuous → ANOVA",
    suggestTest({ outcomeType: "continuous", predictorType: "categorical", groupCount: 3 }).test.includes("ANOVA"),
  );
  assert(
    "two categorical → chi-square",
    suggestTest({ outcomeType: "categorical", predictorType: "categorical" }).test.includes("Chi-square"),
  );
  assert(
    "two continuous → correlation",
    suggestTest({ outcomeType: "continuous", predictorType: "continuous" }).test.includes("Pearson"),
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
