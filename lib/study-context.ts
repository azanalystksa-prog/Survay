import { prisma } from "./db";

/** Resolves the "active" study for monitor/analysis/certificate pages. */
export async function resolveStudy(studyId: string | undefined, prefer: "COLLECTING" | "ANALYZE" | "CERTIFY" = "COLLECTING") {
  const researcher = await prisma.user.findFirst({ where: { role: "RESEARCHER" } });
  const studies = await prisma.study.findMany({
    where: { researcherId: researcher?.id },
    orderBy: { createdAt: "desc" },
  });
  let active = studyId ? studies.find((s) => s.id === studyId) : undefined;
  if (!active) {
    if (prefer === "ANALYZE") {
      // Default to the richest analyzable study: prefer one that has BOTH a categorical
      // grouping (SINGLE) and a Likert item (so cross-group tests + alpha are meaningful),
      // ranked by valid-response count.
      const counts = await prisma.response.groupBy({
        by: ["studyId"],
        where: { included: true, qualityStatus: "VALID", study: { researcherId: researcher?.id } },
        _count: true,
      });
      const countMap = new Map(counts.map((c) => [c.studyId, c._count]));
      const withQuestions = await prisma.study.findMany({
        where: { researcherId: researcher?.id },
        include: { questions: { select: { type: true } } },
      });
      const ranked = withQuestions
        .filter((s) => (countMap.get(s.id) ?? 0) > 0)
        .map((s) => ({
          id: s.id,
          n: countMap.get(s.id) ?? 0,
          rich: s.questions.some((q) => q.type === "SINGLE") && s.questions.some((q) => q.type === "LIKERT"),
        }))
        .sort((a, b) => Number(b.rich) - Number(a.rich) || b.n - a.n);
      if (ranked[0]) active = studies.find((s) => s.id === ranked[0].id);
    }
    if (prefer === "CERTIFY") active = studies.find((s) => ["CLOSED", "CERTIFIED"].includes(s.status));
    active = active ?? studies.find((s) => s.status === "COLLECTING") ?? studies[0];
  }
  return { studies, active };
}
